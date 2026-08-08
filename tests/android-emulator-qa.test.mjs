import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const workflowUrl = new URL("../.github/workflows/android-emulator-qa.yml", import.meta.url);

const readWorkflow = () => readFile(workflowUrl, "utf8");

test("Android emulator QA is API 36, read-only and supply-chain pinned", async () => {
  const workflow = await readWorkflow();

  assert.match(workflow, /permissions:\s*\n\s*contents:\s*read/);
  assert.match(workflow, /persist-credentials:\s*false/);
  assert.match(workflow, /system-images;android-36;google_apis;x86_64/);
  assert.match(workflow, /adb\s+install\s+-r/);
  assert.match(workflow, /cmd package resolve-activity --brief/);
  assert.match(workflow, /uiautomator dump/);
  assert.match(workflow, /screencap -p/);
  assert.match(workflow, /logcat/);
  assert.match(workflow, /pidof -s/);

  for (const [index, line] of workflow.split("\n").entries()) {
    const match = line.match(/^\s*uses:\s*([^\s#]+)(?:\s+#.*)?$/);
    if (!match) continue;
    const ref = match[1];
    if (ref.startsWith("./") || ref.startsWith("docker://")) continue;
    assert.match(ref, /@[0-9a-f]{40}$/i, `line ${index + 1} must pin action by full SHA: ${ref}`);
  }

  assert.doesNotMatch(workflow, /secrets\./i, "emulator QA must not consume repository secrets");
});
