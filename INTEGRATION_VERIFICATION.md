# Inter-Repo Integration Verification

**Date:** 2025-07-09
**Scope:** hocker.one ↔ nova.agi ↔ hocker-node-agent ↔ chido.casino
**Result:** ✅ All integration contracts verified and aligned

---

## 1. hocker.one ↔ nova.agi (HTTP Orchestrator)

### Contract
| Item | hocker.one (caller) | nova.agi (receiver) | Aligned |
|------|---------------------|---------------------|---------|
| Base URL | `process.env.NOVA_AGI_URL` | binds to `0.0.0.0:PORT` | ✅ |
| Auth header | `Authorization: Bearer ${NOVA_ORCHESTRATOR_KEY}` | validates `auth === Bearer ${config.orchestratorKey}` | ✅ |
| Chat endpoint | `POST ${baseUrl}/api/v1/chat` | `app.post("/api/v1/chat", handleChat)` | ✅ |
| Health check | `GET ${NOVA_AGI_HEALTH_URL || NOVA_AGI_URL}/health` | preHandler skips auth for `GET /health*` | ✅ |
| Key env var | `NOVA_ORCHESTRATOR_KEY` | `config.orchestratorKey` ← `env.NOVA_ORCHESTRATOR_KEY` | ✅ |

### Verified Paths
- `src/app/api/nova/chat/route.ts` → fetch `${NOVA_AGI_URL}/api/v1/chat` with `Bearer ${NOVA_ORCHESTRATOR_KEY}`
- `src/app/api/nova/chat/stream/route.ts` → streaming variant
- `src/app/api/system/status/route.ts` → health check to nova
- `src/lib/external-services.ts` → service registry health probing

---

## 2. hocker.one ↔ hocker-node-agent (Command Queue + Polling)

### Contract
| Item | hocker.one (dispatcher) | node-agent (executor) | Aligned |
|------|------------------------|----------------------|---------|
| Shared table | `.from("commands").insert(row)` | `.from("commands").select("*")` polling | ✅ |
| HMAC secret | `HOCKER_COMMAND_HMAC_SECRET` (fallback `COMMAND_HMAC_SECRET`) | `HOCKER_COMMAND_HMAC_SECRET` (fallback `COMMAND_HMAC_SECRET`) | ✅ |
| Signature algorithm | `HMAC-SHA256`, base = `id|project_id|node_id|command|signedCreatedAt|canonicalJson(payload)` | `HMAC-SHA256`, base = `id|project_id|node_id|command|signedCreatedAt|stableJson(payload)` | ✅ |
| Canonical JSON | sorted keys, recursive arrays, circular→`[Circular]` | sorted keys, recursive arrays (no circular guard) | ✅* |
| Timestamp tolerance | 5 min (`MAX_TIME_DRIFT_MS`) | 5 min (`maxCommandAgeMs` default 300000) | ✅ |
| Kill switch | reads `system_controls` | reads `system_controls.kill_switch, allow_write` before executing | ✅ |
| Heartbeat | reads `nodes` table | upserts `nodes` table every 15s | ✅ |
| Events | reads `events` table | inserts into `events` table | ✅ |
| Health URL | `HOCKER_NODE_AGENT_HEALTH_URL` (fallback `HOCKER_NODE_AGENT_URL`) | exposes `GET /health` | ✅ |

\* For non-circular payloads (all command payloads), both canonical JSON implementations produce identical output. The hocker.one version adds circular reference protection that node-agent lacks, but this is a superset — it doesn't change output for normal payloads.

### Verified Paths
- `src/app/api/commands/route.ts` → inserts into `commands` table with HMAC signature
- `src/lib/security.ts` → `signCommand()` / `verifyCommandSignature()`
- `src/lib/stable-json.ts` → `canonicalJson` (sorted-key deterministic serialization)
- node-agent `src/index.ts` → poll loop, `system_controls` check, heartbeat, `nodes` upsert
- node-agent `src/lib/signature.ts` → `signCommand()` / `verifyCommandSignature()`
- node-agent `src/stable-json.ts` → `stableJson` (sorted-key deterministic serialization)

---

## 3. hocker.one ↔ chido.casino (Admin Controls)

### Contract
| Item | hocker.one (admin) | chido.casino (standalone) | Aligned |
|------|---------------------|--------------------------|---------|
| Shared DB | Same Supabase project (service role key) | Same Supabase project (service role key) | ✅ |
| Kill switch write | `POST /api/chido/admin {action:"games_pause"}` → upserts `system_controls(id="chido-casino-games", kill_switch=true)` | reads `system_controls(id="chido-casino-games").kill_switch` via `gamesPaused.ts` | ✅ |
| Kill switch read | admin page loads `system_controls` status | `assertGamesNotPaused()` in crash/play + taco-slot/spin | ✅ |
| Casino settings | admin updates `casino_settings` (cashback caps, wager multipliers) | reads `casino_settings` in `promoLimits.ts`, `applyPromoForDeposit.ts` | ✅ |
| KYC management | admin updates `kyc_requests.status` + `profiles.kyc_status` | reads `kyc_requests` in admin API, `profiles.kyc_status` in UI | ✅ |
| Deposits/withdrawals | admin updates `manual_deposit_requests`, `withdraw_requests`, `balances` | standalone deposit/withdraw APIs use same tables | ✅ |

### Games Paused Integration (NEW)
- `chido.casino/src/lib/gamesPaused.ts` — shared utility (fail-open design)
- `chido.casino/src/app/api/games/crash/play/route.ts` — calls `assertGamesNotPaused()` before processing bet
- `chido.casino/src/app/api/games/taco-slot/spin/route.ts` — calls `assertGamesNotPaused()` before processing spin
- Returns HTTP 423 Locked with `{error: "GAMES_PAUSED", message: ...}` when paused

### No Breakage Verification
- chido.casino typecheck: ✅ 0 errors
- Standalone operation unaffected: gamesPaused fails-open (returns not-paused) on any Supabase error, so the casino never accidentally locks itself out
- All existing chido.casino admin APIs remain intact (separate `ADMIN_API_TOKEN` auth)
- hocker.one admin uses `requireOwnerOrInternal()` gate — independent auth path, no conflict

---

## 4. Supabase Shared Database

All four repos share the same Supabase project (`yvuibbcuntqpyqiuqggd`):
- **hocker.one**: service role key for admin operations, publishable key for browser reads
- **nova.agi**: service role key for AGI memory/state
- **hocker-node-agent**: service role key for command queue polling
- **chido.casino**: service role key for admin, publishable key for client reads

### Shared Tables
- `commands` — command queue (hocker.one writes, node-agent polls)
- `nodes` — node presence registry (node-agent upserts, hocker.one reads)
- `events` — audit/event log (all repos write, hocker.one reads)
- `system_controls` — kill switch (hocker.one admin writes, node-agent + chido.casino reads)
- `casino_settings` — casino config (hocker.one admin writes, chido.casino reads)
- `kyc_requests`, `manual_deposit_requests`, `withdraw_requests`, `balances`, `transactions`, `profiles` — casino operations (shared)

---

## 5. Conclusion

All inter-repo integration contracts are verified and aligned. The newly added kill-switch bridge between hocker.one admin and chido.casino games closes the last integration gap: admin pause/resume from Hocker ONE now takes immediate effect on the standalone casino app. No breaking changes were introduced — all modifications are additive and fail-safe.
