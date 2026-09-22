# HOCKER ONE — Platform closure gate — 2026-08-30

Status: **ACTIVE — EXPANSION_READY / PRODUCTION-READINESS HARDENING**

> This file remains the single closure gate by governance policy. Its filename is historical; its contents below are reconciled to the current evidence cut.

## Current verified baseline — 2026-09-21

- Hocker One `main`: `b9df00dc7f74c3c4dec3c6c5778cab959a6d2fbe`.
- Vercel production: `dpl_6NFU9DKVh1GQSj5XoihkoE8dex3D` — READY on that exact SHA.
- Supabase migration head: `20260918081119` / `20260913170000_hocker_operating_loop_work_sessions`.
- Canonical AGI catalog: 16/16.
- Current production AGI evaluation evidence: 16/16 complete `score-v5` records, 48/48 referenced runs valid, latest Aug 30; **fresh September recertification is still required**.
- Tool certification evidence: 19/19 read-only PASS, `external_writes_executed=false`.
- `allow_actions=true`: 0/16.
- Vercel Hocker One production runtime-error query: no errors returned in the available 7-day request; longer raw-log inspection is limited by plan retention.

## Gate status

| Gate | Status | Current meaning |
| --- | --- | --- |
| Baseline / state reconciliation | **CLOSED** | Current Hocker One SHA, Vercel deployment, Supabase migration head and five canonical repo SHAs re-queried. |
| Core AGI certification | **OPEN — RECERTIFICATION** | August `2026.08.21-8 + score-v5` package is intact and valid as history, but current runtime evidence must be regenerated through the protected Owner AAL2 ceremony. |
| Tool certification | **HISTORICAL CLOSED / FRESH CHECK PENDING** | 19/19 read-only records are intact; no current re-check has been run since August. |
| Agentic security pack | **OPEN** | No single fresh evidence pack closes the required threat suite for the current runtime/configuration. |
| NOVA primary runtime | **OPEN / CURRENT PRIMARY HEALTHY** | Hocker One production is READY; dedicated `nova.agi` fallback remains unverified. |
| Node Agent | **OPEN** | Last physical heartbeat remains April 21, 2026. |
| Owner AAL1/AAL2 | **OPEN** | Real human negative-path/containment evidence remains absent from durable current evidence. |
| Context Bridge AAL2 | **OPEN** | Current issue #167 still requires real Owner AAL2 activation ceremony and closure of the legacy path. |
| Supabase security | **OPEN** | Advisor warnings remain and require object-by-object authorization review; no blanket revoke is permitted. |
| Leaked-password protection | **EXTERNAL BLOCKER** | Provider/Auth setting is not exposed safely by the current connected management surface; issue #200 remains the gate. |
| Android API 36 | **OPEN** | Current issue #203 still requires a run on the final main if mobile release is in scope. |
| Dedicated `nova.agi` fallback | **OPEN** | `nova.agi#31` still requires exact revision, health/ready, heartbeat, read-only MCP, authenticated E2E, safe mutation deferral, no secret leakage and rollback proof. |
| Supabase isolated validation | **OPEN / PLAN LIMITED** | Current Hobby project does not expose branching; no fake branch/evidence is allowed. |
| Cloudflare MCP/Worker hardening | **OPEN IF APPLICABLE** | Provider-side work only if the affected current traffic path is actually in use. |
| PUNTO·G governance | **OPEN** | Repository classification must be resolved without widening production permissions. |
| Final RC | **OPEN** | No final frozen release/evidence package covers every applicable gate. |
| Final production closure | **OPEN** | Do not mark `production_ready` until the applicable gates have current evidence on one frozen release/configuration. |

## Supabase security posture

Current Security Advisor continues to report:
- anonymous GraphQL exposure on bounded/public catalog-style surfaces;
- authenticated GraphQL discoverability across sensitive operational/financial/audit relations;
- intended SECURITY DEFINER public/user functions requiring continued function-level review;
- leaked-password protection disabled.

No blanket revoke or broad destructive permission change is authorized by this closure gate. Existing RLS and real consumers must be preserved while the affected objects are reviewed one by one.

## External / human work — consolidated final batch

The following are intentionally kept together and should not be executed piecemeal during development:

1. Owner AAL1/AAL2 negative-path + containment smoke in Hocker One.
2. Context Bridge AAL2 activation ceremony and evidence.
3. Android API 36 final-main run if mobile release is still in scope.
4. Current Node Agent heartbeat/readiness check.
5. Dedicated `nova.agi` fallback hosting/verification on the selected supported provider, only if the fallback is still required.
6. Real isolated backup/restore drill and measured RPO/RTO with Owner signoff.
7. Supabase leaked-password protection setting, only if the current plan supports it.
8. Cloudflare provider-side MCP/Worker hardening only where applicable.
9. PUNTO·G classification decision.
10. Final freeze: record exact SHAs, fresh AGI results, tool results, security evidence and production smoke, then close only gates with current traceable evidence.

Credential rotation is not re-requested here because the current project record already treats that remediation as completed unless new contradictory evidence appears.

## Closure rule

The platform remains **EXPANSION_READY** for development.

It is not `PRODUCTION_READY / FINAL` until all applicable rows above are backed by current, traceable evidence tied to the actual release/configuration.
