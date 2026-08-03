import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("production Android releases require external signing secrets", async () => {
  const gradle = await read("android/app/build.gradle");
  const workflow = await read(".github/workflows/android-release.yml");

  for (const variable of [
    "ANDROID_KEYSTORE_PATH",
    "ANDROID_KEYSTORE_PASSWORD",
    "ANDROID_KEY_ALIAS",
    "ANDROID_KEY_PASSWORD",
  ]) {
    assert.match(gradle, new RegExp(variable));
  }

  assert.match(gradle, /releaseRequested && !releaseSigningConfigured/);
  assert.match(workflow, /ANDROID_KEYSTORE_BASE64: \$\{\{ secrets\.ANDROID_KEYSTORE_BASE64 \}\}/);
  assert.match(workflow, /A tag or manual release requires ANDROID_KEYSTORE_BASE64/);
  assert.match(workflow, /configured-release-key/);
  assert.match(workflow, /apksigner.*verify --verbose --print-certs/s);
  assert.match(workflow, /bundleRelease/);
  assert.match(workflow, /assembleRelease/);
  assert.match(workflow, /SHA256SUMS\.txt/);
});

test("PR package verification uses a temporary key and cannot masquerade as production", async () => {
  const workflow = await read(".github/workflows/android-release.yml");

  assert.match(workflow, /ephemeral-pr-verification-key/);
  assert.match(workflow, /NOT-FOR-PRODUCTION\.txt/);
  assert.match(workflow, /must not be published or used as the permanent Android update identity/);
  assert.match(workflow, /bundletool-all-/);
  assert.match(workflow, /universal-from-aab\.apk/);
});

test("release workflow never stores signing material in the repository", async () => {
  const workflow = await read(".github/workflows/android-release.yml");

  assert.match(workflow, /\$RUNNER_TEMP\/hocker-one-release\.jks/);
  assert.match(workflow, /chmod 600/);
  assert.match(workflow, /Remove temporary signing material/);
  assert.doesNotMatch(workflow, /android\/.*\.(jks|keystore)/i);
});
