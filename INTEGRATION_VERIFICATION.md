# Inter-Repo Integration Verification — HISTORICAL SNAPSHOT

> **STATUS: RETIRED AS CURRENT EVIDENCE.** This document records a verification performed on **2025-07-09** against four repositories. It must not be used to claim current integration readiness. The ecosystem, security posture and fail-closed contracts changed materially after this snapshot. Current closure evidence lives in `docs/operations/PLATFORM_CLOSURE_GATE_2026-08-14.md` and the Context Bridge/evidence reconciliation documents.
>
> In particular, the historical `gamesPaused` fail-open behavior described below is **not** the current HOCKER security principle. Current policy is fail-closed for protected/high-impact operations unless an explicitly approved availability exception exists.

**Historical date:** 2025-07-09  
**Historical scope:** hocker.one ↔ nova.agi ↔ hocker-node-agent ↔ chido.casino  
**Current authority:** historical comparison only

---

## 1. hocker.one ↔ nova.agi (historical HTTP Orchestrator contract)

At the 2025-07-09 snapshot the following contract was reviewed:

| Item | hocker.one (caller) | nova.agi (receiver) |
|------|---------------------|---------------------|
| Base URL | `process.env.NOVA_AGI_URL` | binds to `0.0.0.0:PORT` |
| Auth header | `Authorization: Bearer ${NOVA_ORCHESTRATOR_KEY}` | validates orchestrator key |
| Chat endpoint | `POST ${baseUrl}/api/v1/chat` | `/api/v1/chat` handler |
| Health check | `GET ${NOVA_AGI_HEALTH_URL || NOVA_AGI_URL}/health` | `/health*` |

These paths/contracts must be revalidated against the current `nova.agi` deployment and the current Hocker One caller before any live-readiness claim. A Docker/Railway deployment contract exists in `nova.agi`, but current connected evidence has not established a healthy dedicated NOVA production runtime.

---

## 2. hocker.one ↔ hocker-node-agent (historical command queue contract)

The 2025 snapshot reviewed the shared `commands`, `nodes`, `events` and `system_controls` contracts plus HMAC command signing. These remain useful historical evidence, but current authorization, migration and runtime behavior must be verified from `main`, Supabase and current node-agent tests before release.

---

## 3. hocker.one ↔ chido.casino (historical admin controls)

The 2025 snapshot reviewed shared database controls including casino pause state, settings, KYC/admin and payment-related tables.

### Retired assertion

The old document explicitly described `gamesPaused` as **fail-open** when Supabase failed. That assertion is retained in Git history only and is not approved as the current safety model. Protected casino/payment actions must follow the current security/legal canon and current Chido hardening evidence.

Real-money operation remains a separate legal/regulatory gate and is not authorized by this document.

---

## 4. Supabase shared database — current interpretation

Sharing a Supabase project does **not** imply shared authorization. Each domain must be reconciled through grants, RLS, tenant/project boundaries, `SECURITY DEFINER` review and explicit consumers. Security Advisor findings must be classified object by object; broad policies must not be introduced merely to silence warnings.

A separate project named `chido-hardening-validation-20260806` also exists as of 2026-08-15 and is not a second production backend. Its lifecycle and security findings must be treated as validation-environment evidence until explicitly reclassified.

---

## 5. Current conclusion

This file is **not a current green gate**. It is a version-history marker that helps detect regressions and understand earlier contracts.

For current readiness use, in order:

1. production/configuration and connected evidence;
2. current `main`, migrations and executable tests;
3. `docs/operations/PLATFORM_CLOSURE_GATE_2026-08-14.md` and later addenda;
4. Context Bridge current checkpoints/manifests;
5. current canonical documentation after reconciliation.

Do not infer current health, security, deployment or 100% completion from this historical snapshot.
