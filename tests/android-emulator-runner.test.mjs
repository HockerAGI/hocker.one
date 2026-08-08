import assert from "node:assert/strict";
import { chmod, mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const runner = new URL("../scripts/ci/android-emulator-qa.sh", import.meta.url);

test("emulator runner fails fast and preserves startup evidence when the process exits", async () => {
  const root = await mkdtemp(join(tmpdir(), "hocker-emulator-runner-"));
  const androidHome = join(root, "android-sdk");
  const emulatorDir = join(androidHome, "emulator");
  const platformToolsDir = join(androidHome, "platform-tools");
  const artifactsDir = join(root, "artifacts");

  await mkdir(emulatorDir, { recursive: true });
  await mkdir(platformToolsDir, { recursive: true });

  const emulator = join(emulatorDir, "emulator");
  await writeFile(
    emulator,
    `#!/usr/bin/env bash
if [[ "\${1:-}" == "-version" ]]; then exec sleep 10; fi
echo 'synthetic emulator start failure' >&2
exit 42
`,
  );
  await chmod(emulator, 0o755);

  const adb = join(platformToolsDir, "adb");
  await writeFile(
    adb,
    "#!/usr/bin/env bash\nexec sleep 10\n",
  );
  await chmod(adb, 0o755);

  const startedAt = Date.now();
  const result = spawnSync("bash", [runner.pathname, "boot", artifactsDir], {
    encoding: "utf8",
    env: {
      ...process.env,
      ANDROID_HOME: androidHome,
      ANDROID_EMULATOR_BOOT_TIMEOUT_SECONDS: "2",
      ANDROID_EMULATOR_POLL_SECONDS: "0.05",
      ANDROID_EMULATOR_DIAGNOSTIC_TIMEOUT_SECONDS: "0.2",
      ANDROID_ADB_PROBE_TIMEOUT_SECONDS: "0.2",
    },
  });
  const elapsedMs = Date.now() - startedAt;

  assert.notEqual(result.status, 0);
  assert.ok(elapsedMs < 5_000, `runner took ${elapsedMs}ms instead of failing fast`);
  assert.match(result.stderr, /emulator exited before registering with ADB/i);
  assert.match(
    await readFile(join(artifactsDir, "emulator.log"), "utf8"),
    /synthetic emulator start failure/,
  );
});

test("evidence capture is bounded when ADB never responds", async () => {
  const root = await mkdtemp(join(tmpdir(), "hocker-emulator-capture-"));
  const androidHome = join(root, "android-sdk");
  const platformToolsDir = join(androidHome, "platform-tools");
  const artifactsDir = join(root, "artifacts");
  await mkdir(platformToolsDir, { recursive: true });

  const adb = join(platformToolsDir, "adb");
  await writeFile(adb, "#!/usr/bin/env bash\nexec sleep 10\n");
  await chmod(adb, 0o755);

  const startedAt = Date.now();
  const result = spawnSync("bash", [runner.pathname, "capture", artifactsDir], {
    encoding: "utf8",
    env: {
      ...process.env,
      ANDROID_HOME: androidHome,
      ANDROID_ADB_PROBE_TIMEOUT_SECONDS: "0.2",
      ANDROID_ADB_COMMAND_TIMEOUT_SECONDS: "0.2",
    },
  });
  const elapsedMs = Date.now() - startedAt;

  assert.equal(result.status, 0, result.stderr);
  assert.ok(elapsedMs < 2_000, `capture took ${elapsedMs}ms instead of timing out`);
  assert.match(
    await readFile(join(artifactsDir, "adb-unavailable.txt"), "utf8"),
    /ADB device unavailable/,
  );
});
