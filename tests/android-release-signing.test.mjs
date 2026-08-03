import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("production Android releases require external signing secrets on trusted refs", async () => {
  const gradle = await read("android/app/build.gradle");
  const workflow = await read(".github/workflows/android-release.yml");
  const verifier = await read(".github/scripts/android-build-verify.sh");

  for (const variable of [
    "ANDROID_KEYSTORE_PATH",
    "ANDROID_KEYSTORE_PASSWORD",
    "ANDROID_KEY_ALIAS",
    "ANDROID_KEY_PASSWORD",
  ]) {
    assert.match(gradle, new RegExp(variable));
  }

  assert.match(gradle, /releaseRequested && !releaseSigningConfigured/);
  assert.match(workflow, /build-production-release:/);
  assert.match(workflow, /github\.event_name == 'workflow_dispatch' && github\.ref == 'refs\/heads\/main'/);
  assert.match(workflow, /ANDROID_KEYSTORE_BASE64: \$\{\{ secrets\.ANDROID_KEYSTORE_BASE64 \}\}/);
  assert.match(workflow, /configured-release-key/);
  assert.match(verifier, /apksigner.*verify --verbose --print-certs/s);
  assert.match(verifier, /bundleRelease/);
  assert.match(verifier, /assembleRelease/);
  assert.match(verifier, /SHA256SUMS\.txt/);
});

test("PR package verification uses a temporary key and receives no production secrets", async () => {
  const workflow = await read(".github/workflows/android-release.yml");
  const verifier = await read(".github/scripts/android-build-verify.sh");
  const prJob = workflow.split("  build-production-release:")[0];

  assert.match(prJob, /verify-pr-package:/);
  assert.match(prJob, /ephemeral-pr-verification-key/);
  assert.doesNotMatch(prJob, /secrets\./);
  assert.doesNotMatch(prJob, /ANDROID_KEYSTORE_BASE64/);
  assert.match(verifier, /NOT-FOR-PRODUCTION\.txt/);
  assert.match(verifier, /must not be published or used as the permanent Android update identity/);
  assert.match(verifier, /bundletool-all-/);
  assert.match(verifier, /universal-from-aab\.apk/);
});

test("AAB verification tolerates self-signed identity but rejects unsigned entries", async () => {
  const verifier = await read(".github/scripts/android-build-verify.sh");

  assert.match(verifier, /jarsigner -verify -verbose -certs/);
  assert.doesNotMatch(verifier, /jarsigner -verify -strict/);
  assert.match(verifier, /unsigned entries\|not integrity-checked\|treated as unsigned/);
  assert.match(verifier, /AAB verification detected unsigned or invalid entries/);
});

test("release workflow never stores signing material in the repository", async () => {
  const workflow = await read(".github/workflows/android-release.yml");

  assert.match(workflow, /\$RUNNER_TEMP\/hocker-one-pr-verification\.jks/);
  assert.match(workflow, /\$RUNNER_TEMP\/hocker-one-production-release\.jks/);
  assert.match(workflow, /chmod 600/);
  assert.match(workflow, /Remove temporary signing material/);
  assert.match(workflow, /Remove permanent signing material from runner/);
  assert.doesNotMatch(workflow, /android\/.*\.(jks|keystore)/i);
});
