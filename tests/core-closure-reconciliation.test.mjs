import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("current closure pack separates core integration blockers from optional degraded capabilities", async () => {
  const closure = await read("docs/operations/PLATFORM_CLOSURE_2026-08-17.md");

  assert.match(closure, /Core Integration Ready/i);
  assert.match(closure, /Full Launch\/GA/i);
  assert.match(closure, /migration.*CLOSED/i);
  assert.match(closure, /Node Mirror.*CLOSED/i);
  assert.match(closure, /AGI foreign-key.*CLOSED/i);
  assert.match(closure, /Supabase Advisor exception.*CLOSED/i);
  assert.match(closure, /Owner AAL2.*OPEN/i);
  assert.match(closure, /16\/16.*eval.*OPEN/i);
  assert.match(closure, /Leaked Password Protection.*OPEN_PROVIDER_GATE/i);
  assert.match(closure, /physical Node Agent.*DEGRADED/i);
  assert.match(closure, /Railway.*DEGRADED/i);
  assert.match(closure, /Android.*FULL_LAUNCH_GATE/i);
  assert.match(closure, /Cloudflare.*PROVIDER_EVIDENCE/i);
  assert.doesNotMatch(closure, /100% terminado|100% secure|bug[- ]free/i);
});

test("development ledger records current authority and supersedes stale PR snapshots without erasing history", async () => {
  const ledger = await read("docs/00-governance/HOCKER_DEVELOPMENT_LEDGER.md");

  assert.match(ledger, /append-only/i);
  assert.match(ledger, /6b3b4f35820f4fb9c0906fa582dcd397d3169f88/);
  assert.match(ledger, /PR #224/);
  assert.match(ledger, /PR #226/);
  assert.match(ledger, /PR #227/);
  assert.match(ledger, /PR #228/);
  assert.match(ledger, /20260817052915/);
  assert.match(ledger, /Railway[\s\S]*inactive/i);
  assert.match(ledger, /Supersedes operational use of PR #215/i);
});
