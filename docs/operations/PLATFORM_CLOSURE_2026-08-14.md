# HOCKER ONE — Platform Closure Gate — 2026-08-14

Status: **OPEN / FAIL-CLOSED**  
Scope: Hocker One control plane, canonical 16 AGIs, GitHub/Vercel/Supabase integration, MCP boundary and final release gates.  
Baseline SHA: `a5f4b1838674d6f0c5d648064f8505c280303d34`  
Rule: this document is evidence, not an authorization to merge or deploy changes.

## 1. Verified baseline

- Hocker One production deployment for the baseline SHA is READY on Vercel.
- Pull-request CI for the feature head merged as #208 passed.
- The runtime registry contains 16 AGIs and all 16 remain `allow_actions=false`.
- Runtime eval and read-only tool-eval infrastructure exists, but production currently has no persisted `agi_eval_result` or `agi_tool_eval_result` evidence rows.
- Hocker Ads `client_*` context tables no longer appear in the current Supabase authenticated GraphQL exposure advisor set.
- The GitHub organization currently contains nine repositories. `punto.g` is private and documentation-only; it is not automatically authorized by Hocker One merely because it exists.

## 2. Release-blocking gates

### G1 — AGI certification evidence

For every canonical AGI:

- execute the versioned runtime eval suite through the Owner + AAL2 path;
- persist passing `agi_eval_result` evidence with real run provenance;
- execute read-only tool probes for every enabled assignment that is required for the AGI's current scope;
- persist `agi_tool_eval_result` evidence;
- do not enable material external actions merely to satisfy certification.

Gate passes only when the certification matrix is backed by current versioned evidence, not by code presence alone.

### G2 — Owner MFA / AAL2 ceremony

A real production Owner must enroll and verify TOTP through the supported Supabase Auth flow. Critical paths remain fail-closed until AAL2 is observed. Do not store QR content, TOTP secrets, recovery material, cookies or tokens in GitHub.

### G3 — Supabase security reconciliation

Current Security Advisor findings must be classified object-by-object. Priority:

- authenticated GraphQL discoverability of financial, KYC, audit, command, node and observability objects;
- anonymous GraphQL objects: `agis_public_catalog`, `cashback_tiers`, `free_round_tiers`, `promo_offers` — retain only when intentionally public and column/row scope is approved;
- exposed `SECURITY DEFINER` RPCs — justify contract or restrict/rework;
- RLS-enabled/no-policy objects — distinguish intentional backend-only deny-by-grant from missing policy;
- leaked-password protection — enable through Supabase Auth settings when plan/support allows and verify sign-in/recovery behavior.

Do not silence advisors with broad authenticated policies.

### G4 — Supabase migration branch health

Supabase branch metadata currently reports `MIGRATIONS_FAILED` for the default branch while the preview project reports healthy. Resolve/reconcile migration-branch state before using branching as the safety boundary for new DDL. No production DDL is authorized by this document.

### G5 — Database performance debt

Review, with query evidence, four currently unindexed foreign keys:

- `agi_agent_tools.canonical_agi_id`
- `agi_agents.canonical_agi_id`
- `agi_memory_mirror.canonical_agi_id`
- `context_bridge_manifests.approval_id`

Also reconcile duplicate permissive authenticated SELECT policies on `commands` and `nodes` if semantics can be preserved. Do **not** delete indexes solely because the advisor labels them unused.

### G6 — Android final-main evidence

After the final candidate SHA is frozen, manually run the existing Android API 36 emulator QA on that exact SHA and retain the artifact. Signed release remains a separate gate requiring the configured release signing secrets.

### G7 — Credential hygiene

The legacy credential document is quarantined input, not a secret store. Inventory privileged credentials by consumer and environment, replace consumers safely, verify, then revoke old credentials. Never paste secret values into issues, PRs, logs, screenshots or AGI memory.

### G8 — Repository governance drift

The organization now has nine repositories. `punto.g` must receive an explicit product/governance decision before any of the following:

- addition to Hocker One GitHub allowlists;
- creation of Vercel/Supabase production infrastructure;
- inclusion in the canonical app count;
- assignment of AGI write capabilities.

Its current repository contract says PWA-first, documentation/specification only, separate infrastructure/data from Hocker One and Chido, and fail-closed sensitive payment capabilities.

### G9 — Dependency-family reconciliation

Hocker One currently runs Next.js `16.2.12` while `eslint-config-next` is declared on a `16.3.x` range. Reconcile the Next.js package family against the current supported/LTS release after exact-head CI verification. Do not upgrade to a preview/canary merely to make version numbers equal.

### G10 — Context Bridge freshness and shared-context governance

The Context Bridge is implemented and its provider source registry covers ChatGPT, Codex, GitHub, Google Drive, Supabase and Vercel, but the currently active manifest is historical relative to the 2026-08-15 engineering state. The latest observed checkpoint in the audit predates the current repo/PR/migration changes.

Gate requirements:

- finish the current ecosystem reconciliation before generating a replacement manifest;
- refresh source checkpoints from current evidence;
- create a **new draft** manifest rather than mutating an active historical manifest;
- verify coverage, precedence and secret/PII redaction;
- activate only through the current Owner + MFA AAL2 surface;
- keep prior manifests immutable for audit history;
- never use raw conversations, secrets, TOTP/KYC/PII or private-domain content as global shared memory.

`AGENTS.md` is repo operating guidance for Codex; Context Bridge is operational continuity; SYNTIA/Memory Mirror is reviewed reusable learning. These are complementary and must not be collapsed into a raw shared-chat store.

## 3. HOCKER MCP / Cloudflare Zero Trust target

Adopt the Cloudflare 2026-08-14 MCP controls as a perimeter policy, but mark them **NOT VERIFIED IN HOCKER** until the Cloudflare account configuration is observed.

Target path:

`NOVA / AGIs -> Cloudflare Gateway -> HOCKER MCP Portal -> Access / identity -> HOCKER MCP policy + Owner Gate -> approved providers`

Baseline Gateway policy after observe-only validation:

```text
experimental.is_mcp == true and not traffic.onramp in ("mcp_portal")
Action: Block
```

Requirements:

- route relevant managed-device HTTP traffic through Gateway with TLS inspection where policy/legal constraints allow;
- inventory exceptions: local stdio MCP, off-network traffic, Do Not Inspect destinations and traffic that bypasses Gateway are not covered by header detection;
- route approved compatible MCP servers through an HOCKER MCP Portal;
- keep Hocker One MCP Registry, provider policy and Owner Gate authoritative even when Cloudflare permits the network connection;
- export/retain MCP and Access evidence without storing provider secrets;
- apply DLP to portal-routed traffic where supported;
- use service tokens for headless AGI/service authentication, scoped per service and environment.

Official references:

- Cloudflare, 2026-08-14: `https://blog.cloudflare.com/mcp-security-updates/`
- Cloudflare, 2026-08-14: `https://blog.cloudflare.com/workers-protected-by-access/`
- MCP Portal docs: `https://developers.cloudflare.com/cloudflare-one/access-controls/ai-controls/mcp-portals/`
- Service tokens: `https://developers.cloudflare.com/cloudflare-one/access-controls/service-credentials/service-tokens/`

## 4. Workers private-by-default target

For internal Workers, target account-level Access protection for previews and production. Exceptions must be explicit public bypasses with owner and reason. Agents/services authenticate through service tokens; humans through the approved identity flow.

This is a manual/provider configuration gate until Cloudflare is connected to the HOCKER control plane with a scoped management identity.

## 5. Definition of closure

Hocker One and the canonical AGI platform can be called ready for downstream product integration only when all of the following are true at the same frozen candidate SHA/configuration set:

1. required CI is green;
2. production/preview smoke is green;
3. 16/16 AGIs have current required eval evidence for their declared scope;
4. required tool assignments have current runtime evidence;
5. `allow_actions` remains fail-closed except for explicitly approved scoped capabilities;
6. Owner MFA/AAL2 is verified;
7. Supabase security findings are fixed, intentionally documented, or accepted with owner/date;
8. migration history/branch state is coherent;
9. PWA + Android final-candidate verification passes;
10. privileged credential remediation is complete for launch scope;
11. repository/app inventory drift is reconciled;
12. Cloudflare MCP/Worker controls are either verified in the account or explicitly tracked as a launch-blocking exception for affected internal endpoints;
13. rollback/runbooks/evidence references are current;
14. no critical open drift is hidden by documentation;
15. Context Bridge checkpoints/manifest reflect the frozen candidate evidence set and any activation is backed by Owner + MFA AAL2 evidence.

Until then, downstream repositories may continue **documentation, isolated development and non-production work**, but should not depend on Hocker One as a certified production action plane.

## 6. Reconciliation addendum — 2026-08-15

This addendum records facts observed after the original 2026-08-14 snapshot. It does not convert any open gate to PASS unless the named evidence requirement is met.

### 6.1 AGI evidence snapshot

Read-only query against the primary Supabase project for `project_id='hocker-one'`:

- registered AGI rows: **16/16**;
- `allow_actions=false`: **16/16 = 100% guarded configuration coverage**;
- AGIs with persisted `agi_eval_result`: **0/16 = 0% current runtime-eval evidence coverage**;
- AGIs with persisted `agi_tool_eval_result`: **0/16 = 0% current tool-eval evidence coverage**;
- AGIs with at least one completed `agi_runs` row: **2/16 = 12.5% run-presence coverage**.

These are evidence-coverage percentages only. They are not development/completion estimates. The certification implementation uses eight explicit gates per AGI.

### 6.2 Supabase inventory delta

Two Supabase projects are currently visible:

1. primary `Hocker AGI Technologies` — service-level `ACTIVE_HEALTHY`;
2. `chido-hardening-validation-20260806` — validation environment, also service-level `ACTIVE_HEALTHY` but **not security-clean**.

The validation project currently reports a Security Advisor **ERROR** for RLS disabled on `public.validation_settlement_marker` and WARN findings for exposed `SECURITY DEFINER` functions. It must remain validation-only until explicitly remediated/reclassified or retired through a controlled lifecycle decision.

The primary project still carries Security Advisor WARN/INFO findings and default-branch metadata `MIGRATIONS_FAILED`; no destructive reset/rebase is authorized without a demonstrated cause.

### 6.3 Code/history regression audit

PR #213 is based on the exact current `main` baseline and is ahead without being behind. Version comparison found one real capability-discoverability regression: unmounting the old `WorkspaceBar` hid the only visible `toggleTutorial()` and `resetWorkspace()` controls while their underlying `WorkspaceContext` remained intact.

The #213 branch now restores those controls compactly under `Más/Ajustes` instead of restoring the old persistent bar. CI/exact-SHA preview evidence remains required before merge.

Other removed Signal-era layers reviewed so far (`HockerLiveBackground`, `HockerVfxLayer`) are presentation layers; no functional dependency has been established. Detailed secondary routes remain defined/searchable even though persistent sidebar navigation was simplified.

### 6.4 Codex/context drift

The Hocker One root `AGENTS.md` and `src/lib/hocker-context-pack.ts` were stale relative to the current governance model. PR #214 updates the Codex operating contract, removes subjective manual progress values and adds a regression test so context progress can only come from observable gates.

`nova.agi` had no root `AGENTS.md`; PR #32 adds a runtime-specific Codex context contract without copying private-domain memory.

The old root `INTEGRATION_VERIFICATION.md` dated 2025-07-09 claimed a four-repo green integration state and documented a historical fail-open Chido condition. PR #214 reclassifies that file as historical evidence rather than current authority.

### 6.5 Formal canonical publication drift

The 2026-08-05 PDF publications remain the approved human editions but their factual inventories require a new formal edition. The reconciled evidence is tracked in PR #214 (`docs/operations/DOC_ALIGNMENT_2026-08-15.md`) until editable canonical masters are published through the governed document release process.
