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
14. no critical open drift is hidden by documentation.

Until then, downstream repositories may continue **documentation, isolated development and non-production work**, but should not depend on Hocker One as a certified production action plane.