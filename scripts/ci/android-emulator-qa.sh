#!/usr/bin/env bash
set -Eeuo pipefail

mode="${1:-}"
artifacts_dir="${2:-artifacts}"
avd_name="${ANDROID_EMULATOR_AVD_NAME:-hocker_api36}"
boot_timeout_seconds="${ANDROID_EMULATOR_BOOT_TIMEOUT_SECONDS:-240}"
poll_seconds="${ANDROID_EMULATOR_POLL_SECONDS:-2}"
adb_command_timeout_seconds="${ANDROID_ADB_COMMAND_TIMEOUT_SECONDS:-15}"
adb_probe_timeout_seconds="${ANDROID_ADB_PROBE_TIMEOUT_SECONDS:-3}"
diagnostic_timeout_seconds="${ANDROID_EMULATOR_DIAGNOSTIC_TIMEOUT_SECONDS:-5}"

: "${ANDROID_HOME:?ANDROID_HOME must point to the Android SDK}"

adb_bin="$ANDROID_HOME/platform-tools/adb"
emulator_bin="$ANDROID_HOME/emulator/emulator"
emulator_log="$artifacts_dir/emulator.log"
emulator_pid_file="$artifacts_dir/emulator.pid"

mkdir -p "$artifacts_dir"

require_executable() {
  local executable="$1"
  if [[ ! -x "$executable" ]]; then
    echo "required executable is missing: $executable" >&2
    exit 2
  fi
}

print_emulator_diagnostics() {
  echo "--- Android emulator diagnostics ---" >&2
  run_with_timeout "$diagnostic_timeout_seconds" "$emulator_bin" -version >&2 || true
  run_with_timeout "$diagnostic_timeout_seconds" "$adb_bin" devices -l >&2 || true
  if [[ -r "$emulator_log" ]]; then
    echo "--- emulator.log ---" >&2
    tail -n 200 "$emulator_log" >&2 || true
  fi
}

run_with_timeout() {
  local timeout_seconds="$1"
  shift

  "$@" &
  local command_pid=$!
  (
    sleep "$timeout_seconds"
    kill -TERM "$command_pid" 2>/dev/null || true
    sleep 1
    kill -KILL "$command_pid" 2>/dev/null || true
  ) &
  local watchdog_pid=$!

  local status=0
  wait "$command_pid" || status=$?
  kill "$watchdog_pid" 2>/dev/null || true
  wait "$watchdog_pid" 2>/dev/null || true
  return "$status"
}

boot_emulator() {
  require_executable "$adb_bin"
  require_executable "$emulator_bin"

  "$emulator_bin" \
    -avd "$avd_name" \
    -no-window \
    -noaudio \
    -no-boot-anim \
    -no-snapshot \
    -gpu "${ANDROID_EMULATOR_GPU_MODE:-software}" \
    >"$emulator_log" 2>&1 &
  local emulator_pid=$!
  printf '%s\n' "$emulator_pid" >"$emulator_pid_file"

  local deadline=$((SECONDS + boot_timeout_seconds))
  while (( SECONDS < deadline )); do
    if ! kill -0 "$emulator_pid" 2>/dev/null; then
      wait "$emulator_pid" 2>/dev/null || true
      echo "emulator exited before registering with ADB" >&2
      print_emulator_diagnostics
      return 1
    fi

    local adb_state=""
    local boot_completed=""
    adb_state="$(run_with_timeout "$adb_probe_timeout_seconds" "$adb_bin" get-state 2>/dev/null || true)"
    if [[ "$adb_state" == "device" ]]; then
      boot_completed="$(
        run_with_timeout "$adb_probe_timeout_seconds" \
          "$adb_bin" shell getprop sys.boot_completed 2>/dev/null | tr -d '\r' || true
      )"
    fi
    if [[ "$adb_state" == "device" && "$boot_completed" == "1" ]]; then
      "$adb_bin" shell input keyevent 82 >/dev/null 2>&1 || true
      return 0
    fi
    sleep "$poll_seconds"
  done

  echo "emulator did not finish booting within ${boot_timeout_seconds}s" >&2
  print_emulator_diagnostics
  return 1
}

capture_evidence() {
  require_executable "$adb_bin"

  if ! run_with_timeout "$adb_probe_timeout_seconds" "$adb_bin" get-state >/dev/null 2>&1; then
    printf '%s\n' "ADB device unavailable; emulator.log is the primary startup evidence." \
      >"$artifacts_dir/adb-unavailable.txt"
    return 0
  fi

  run_with_timeout "$adb_command_timeout_seconds" "$adb_bin" exec-out screencap -p \
    >"$artifacts_dir/hocker-one-api36.png" 2>/dev/null || true
  run_with_timeout "$adb_command_timeout_seconds" "$adb_bin" shell uiautomator dump \
    /sdcard/hocker-one-ui.xml >/dev/null 2>&1 || true
  run_with_timeout "$adb_command_timeout_seconds" "$adb_bin" pull \
    /sdcard/hocker-one-ui.xml "$artifacts_dir/hocker-one-ui.xml" >/dev/null 2>&1 || true
  run_with_timeout "$adb_command_timeout_seconds" "$adb_bin" logcat -d \
    >"$artifacts_dir/logcat.txt" 2>/dev/null || true
  run_with_timeout "$adb_command_timeout_seconds" "$adb_bin" logcat -b crash -d \
    >"$artifacts_dir/crash.txt" 2>/dev/null || true
  run_with_timeout "$adb_command_timeout_seconds" "$adb_bin" shell dumpsys activity activities \
    >"$artifacts_dir/activity.txt" 2>/dev/null || true
}

case "$mode" in
  boot)
    boot_emulator
    ;;
  capture)
    capture_evidence
    ;;
  *)
    echo "usage: $0 {boot|capture} [artifacts-dir]" >&2
    exit 2
    ;;
esac
