#!/usr/bin/env bash
set -euo pipefail

: "${ANDROID_KEYSTORE_PATH:?Missing ANDROID_KEYSTORE_PATH}"
: "${ANDROID_KEYSTORE_PASSWORD:?Missing ANDROID_KEYSTORE_PASSWORD}"
: "${ANDROID_KEY_ALIAS:?Missing ANDROID_KEY_ALIAS}"
: "${ANDROID_KEY_PASSWORD:?Missing ANDROID_KEY_PASSWORD}"
: "${ANDROID_VERSION_CODE:?Missing ANDROID_VERSION_CODE}"
: "${ANDROID_VERSION_NAME:?Missing ANDROID_VERSION_NAME}"
: "${RELEASE_KEY_KIND:?Missing RELEASE_KEY_KIND}"
: "${BUNDLETOOL_VERSION:=1.18.3}"
: "${BUNDLETOOL_SHA256:=a099cfa1543f55593bc2ed16a70a7c67fe54b1747bb7301f37fdfd6d91028e29}"

test -s "$ANDROID_KEYSTORE_PATH"
chmod 600 "$ANDROID_KEYSTORE_PATH"

npm ci --include=optional

test -s out/index.html
! grep -Eqi '<script[^>]+src=' out/index.html
! grep -Eqi 'http://|myninja\.ai' out/index.html
grep -Fq 'Content-Security-Policy' out/index.html
grep -Fq 'https://hockerone.vercel.app' out/index.html

npm run android:sync

(
  cd android
  chmod +x gradlew
  ./gradlew testReleaseUnitTest lintRelease assembleRelease bundleRelease --stacktrace
)

mapfile -t apks < <(find android/app/build/outputs/apk/release -type f -name '*.apk' | sort)
mapfile -t aabs < <(find android/app/build/outputs/bundle/release -type f -name '*.aab' | sort)
[[ "${#apks[@]}" -eq 1 ]]
[[ "${#aabs[@]}" -eq 1 ]]

apk="${apks[0]}"
aab="${aabs[0]}"
apksigner="$(find "$ANDROID_HOME/build-tools" -type f -name apksigner | sort -V | tail -n 1)"
zipalign="$(find "$ANDROID_HOME/build-tools" -type f -name zipalign | sort -V | tail -n 1)"
aapt="$(find "$ANDROID_HOME/build-tools" -type f -name aapt | sort -V | tail -n 1)"
test -x "$apksigner"
test -x "$zipalign"
test -x "$aapt"

verification="android/app/build/outputs/release-verification"
mkdir -p "$verification"
printf '%s\n' "$RELEASE_KEY_KIND" > "$verification/RELEASE-KEY-KIND.txt"

if [[ "$RELEASE_KEY_KIND" == "ephemeral-pr-verification-key" ]]; then
  cat > "$verification/NOT-FOR-PRODUCTION.txt" <<'EOF'
This build is cryptographically valid and installable, but it is signed with a temporary CI key.
It proves package integrity only. It must not be published or used as the permanent Android update identity.
EOF
fi

"$apksigner" verify --verbose --print-certs "$apk" | tee "$verification/APK-SIGNATURE.txt"
"$zipalign" -c -P 16 -v 4 "$apk" | tee "$verification/APK-ZIPALIGN.txt"
"$aapt" dump badging "$apk" | tee "$verification/APK-BADGING.txt"

grep -Fq "package: name='com.hocker.one'" "$verification/APK-BADGING.txt"
grep -Fq "sdkVersion:'24'" "$verification/APK-BADGING.txt"
grep -Fq "targetSdkVersion:'36'" "$verification/APK-BADGING.txt"
grep -Fq "versionName='${ANDROID_VERSION_NAME}'" "$verification/APK-BADGING.txt"

# Android app certificates are normally self-signed. Verify cryptographic
# integrity without promoting that expected trust-chain warning to an error,
# while explicitly rejecting appended or otherwise unsigned bundle entries.
jarsigner -verify -verbose -certs "$aab" > "$verification/AAB-JARSIGNER.txt" 2>&1
grep -Fq 'jar verified.' "$verification/AAB-JARSIGNER.txt"
if grep -Eqi 'unsigned entries|not integrity-checked|treated as unsigned|digest error|invalid signature' "$verification/AAB-JARSIGNER.txt"; then
  echo "AAB verification detected unsigned or invalid entries." >&2
  cat "$verification/AAB-JARSIGNER.txt" >&2
  exit 1
fi
unzip -t "$aab" | tee "$verification/AAB-ZIP-TEST.txt"

bundletool="$RUNNER_TEMP/bundletool-all-${BUNDLETOOL_VERSION}.jar"
curl --fail --location --retry 3 --silent --show-error \
  "https://github.com/google/bundletool/releases/download/${BUNDLETOOL_VERSION}/bundletool-all-${BUNDLETOOL_VERSION}.jar" \
  --output "$bundletool"
test -s "$bundletool"
sha256sum "$bundletool" | tee "$verification/BUNDLETOOL-SHA256.txt"
printf '%s  %s\n' "$BUNDLETOOL_SHA256" "$bundletool" | sha256sum --check --strict

ks_pass_file="$RUNNER_TEMP/android-keystore.pass"
key_pass_file="$RUNNER_TEMP/android-key.pass"
printf '%s' "$ANDROID_KEYSTORE_PASSWORD" > "$ks_pass_file"
printf '%s' "$ANDROID_KEY_PASSWORD" > "$key_pass_file"
chmod 600 "$ks_pass_file" "$key_pass_file"

generated_apks="$verification/hocker-one-universal.apks"
java -jar "$bundletool" build-apks \
  --bundle="$aab" \
  --output="$generated_apks" \
  --mode=universal \
  --ks="$ANDROID_KEYSTORE_PATH" \
  --ks-pass="file:$ks_pass_file" \
  --ks-key-alias="$ANDROID_KEY_ALIAS" \
  --key-pass="file:$key_pass_file" \
  --overwrite

unzip -p "$generated_apks" universal.apk > "$verification/universal-from-aab.apk"
test -s "$verification/universal-from-aab.apk"
"$apksigner" verify --verbose --print-certs "$verification/universal-from-aab.apk" \
  | tee "$verification/AAB-UNIVERSAL-APK-SIGNATURE.txt"
"$zipalign" -c -P 16 -v 4 "$verification/universal-from-aab.apk" \
  | tee "$verification/AAB-UNIVERSAL-APK-ZIPALIGN.txt"
"$aapt" dump badging "$verification/universal-from-aab.apk" \
  | tee "$verification/AAB-UNIVERSAL-APK-BADGING.txt"
grep -Fq "package: name='com.hocker.one'" "$verification/AAB-UNIVERSAL-APK-BADGING.txt"
grep -Fq "targetSdkVersion:'36'" "$verification/AAB-UNIVERSAL-APK-BADGING.txt"
grep -Fq "versionName='${ANDROID_VERSION_NAME}'" "$verification/AAB-UNIVERSAL-APK-BADGING.txt"

sha256sum \
  "$apk" \
  "$aab" \
  "$generated_apks" \
  "$verification/universal-from-aab.apk" \
  > "$verification/SHA256SUMS.txt"
cat "$verification/SHA256SUMS.txt"
