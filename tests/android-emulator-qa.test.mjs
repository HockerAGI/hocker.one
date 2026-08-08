import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const workflowUrl = new URL("../.github/workflows/android-emulator-qa.yml", import.meta.url);
const runnerUrl = new URL("../scripts/ci/android-emulator-qa.sh", import.meta.url);

const readWorkflow = () => readFile(workflowUrl, "utf8");
const readRunner = () => readFile(runnerUrl, "utf8");

test("Android emulator QA is API 36, read-only and supply-chain pinned", async () => {
  const [workflow, runner] = await Promise.all([readWorkflow(), readRunner()]);

  assert.match(workflow, /permissions:\s*\n\s*contents:\s*read/);
  assert.match(workflow, /persist-credentials:\s*false/);
  assert.match(workflow, /system-images;android-36;google_apis;x86_64/);
  assert.match(workflow, /apt-get install -y --no-install-recommends libpulse0/);
  assert.match(workflow, /ANDROID_AVD_HOME="\$RUNNER_TEMP\/android-avd"/);
  assert.match(workflow, /ANDROID_AVD_HOME=\$ANDROID_AVD_HOME.*GITHUB_ENV/);
  assert.match(workflow, /list avd -c.*grep -Fx hocker_api36/);
  assert.match(workflow, /- "scripts\/ci\/android-emulator-qa\.sh"/);
  assert.match(workflow, /- "tests\/android-emulator-runner\.test\.mjs"/);
  assert.match(
    workflow,
    /node --test tests\/android-emulator-qa\.test\.mjs tests\/android-emulator-runner\.test\.mjs/,
  );
  assert.match(workflow, /scripts\/ci\/android-emulator-qa\.sh boot artifacts/);
  assert.match(workflow, /scripts\/ci\/android-emulator-qa\.sh capture artifacts/);
  assert.match(workflow, /adb\s+install\s+-r/);
  assert.match(workflow, /cmd package resolve-activity --brief/);
  assert.match(runner, /uiautomator dump/);
  assert.match(runner, /screencap -p/);
  assert.match(runner, /logcat/);
  assert.match(workflow, /pidof -s/);
  assert.doesNotMatch(workflow, /adb wait-for-device/);
  assert.doesNotMatch(workflow, /swiftshader_indirect/);

  for (const [index, line] of workflow.split("\n").entries()) {
    const match = line.match(/^\s*uses:\s*([^\s#]+)(?:\s+#.*)?$/);
    if (!match) continue;
    const ref = match[1];
    if (ref.startsWith("./") || ref.startsWith("docker://")) continue;
    assert.match(ref, /@[0-9a-f]{40}$/i, `line ${index + 1} must pin action by full SHA: ${ref}`);
  }

  assert.doesNotMatch(workflow, /secrets\./i, "emulator QA must not consume repository secrets");
});
