# Supabase Security Advisor — Exception Register — 2026-08-17

Status: **ACTIVE EVIDENCE REGISTER — NOT A SECURITY WAIVER**  
Scope: primary Supabase project `yvuibbcuntqpyqiuqggd` and Hocker One / shared CHIDO data contracts.  
Authority rule: production/configuration > `main` migrations > executable tests > this register.

This register exists so an Advisor warning is never closed merely because it is inconvenient. An entry is accepted only when the exposed capability is intentional, bounded by a product/security contract, and supported by current production evidence. **Re-query production after any relevant DDL, grant, RLS, function, view, or Auth configuration change.**

## 1. OPEN_PROVIDER_GATE — Leaked Password Protection

**Leaked Password Protection remains OPEN_PROVIDER_GATE.** It is not an accepted exception.

Current Security Advisor reports `auth_leaked_password_protection`. The authenticated Supabase connector available to this workflow does not expose the Auth configuration mutation required to enable it. Closure requires provider-side evidence that the setting is enabled, followed by a fresh Security Advisor read.

Do not mark this gate closed from documentation, SQL, or application code alone.

## 2. GraphQL discoverability — authenticated role

Advisor lint `pg_graphql_authenticated_table_exposed` reports schema discoverability whenever `authenticated` has `SELECT`. Discoverability is accepted only where row access remains governed by RLS and the read grant is part of a product contract.

Production read-only verification on 2026-08-17 confirmed **RLS enabled** and at least one policy on every currently reported authenticated table in this set:

- `audit_chain`
- `audit_exports`
- `balances`
- `bets`
- `cashback_events`
- `cashback_tiers`
- `commands`
- `deposit_intents`
- `events`
- `free_round_entitlements`
- `free_round_tiers`
- `hocker_dashboard_snapshot`
- `hocker_portal_grants`
- `kyc_requests`
- `llm_usage`
- `manual_deposit_requests`
- `memory_archive_manifest`
- `node_heartbeats`
- `nodes`
- `observability_alerts`
- `observability_incidents`
- `profiles`
- `project_members`
- `promo_offers`
- `supply_products`

This is **not** permission to add broad policies. Reopen this exception immediately if any listed relation loses RLS, gains an unconditional client write/read policy beyond its approved contract, or receives broader grants.

## 3. GraphQL discoverability — anonymous/public catalog

The following anonymous reads are intentional product/catalog surfaces:

### `agis_public_catalog`

The production view exposes only `id`, `name`, `description`, `version`, `tags`, and `created_at` from the AGI catalog. It is not an operational/runtime-secret view.

Reopen if the view adds credentials, internal prompts, provider configuration, private memory, action scopes, or other non-public fields.

### `cashback_tiers` and `free_round_tiers`

Production policies explicitly define public read contracts (`*_read_all`) while service-role retains its separate administrative path. These tier definitions are public product configuration.

Reopen if private/customer-specific fields are added to either table without a separate public projection.

### `promo_offers`

Anonymous/authenticated SELECT is restricted by policy to offers where `active is true`, `starts_at <= now()`, and the offer has not ended. Service-role administration remains separate.

Reopen if the public policy ceases to enforce the active time window or private campaign/operator fields are added without projection.

## 4. SECURITY DEFINER — public game projections

Source authority: `supabase/migrations/20260731003804_privacy_safe_public_game_feeds_20260730.sql`.

`get_public_leaderboard(integer, integer)` and `get_public_recent_wins(integer)` deliberately use SECURITY DEFINER so callers do not require direct SELECT access to underlying game-history tables.

Required invariants:

- fixed `search_path=public,pg_temp`;
- public output requires `leaderboard_opt_in=true`;
- public display name must be non-empty;
- leaderboard window is bounded to 1–30 days;
- result limits are bounded to 1–100 rows;
- PUBLIC function privilege is revoked before explicit `anon`, `authenticated`, and `service_role` execution is granted.

Reopen if any invariant is removed, if raw private identifiers are returned, or if underlying tables become broadly client-readable as a side effect.

## 5. SECURITY DEFINER — authenticated own-history projections

`get_my_slot_history(integer)` source authority is `supabase/migrations/20260810184341_private_game_history_rpc_20260806.sql`.

Required invariants:

- fixed `search_path = public, pg_temp`;
- row ownership filter `s.user_id = auth.uid()`;
- result limit bounded to 1–100;
- PUBLIC and `anon` execution revoked;
- execution granted only to `authenticated` and `service_role`.

Production read-only inspection also verified the current `get_my_crash_history(integer)` contract uses fixed `search_path`, filters by `auth.uid()`, clamps results to 100, and is executable by `authenticated` / `service_role` rather than anonymous callers. Because this is runtime/provider evidence, **re-query the function definition and ACL before relying on it after any function migration**.

Reopen either own-history exception if ownership filtering, fixed search path, bounded limits, or role restrictions are weakened.

## 6. What this register does not close

This register does not close:

- Leaked Password Protection;
- Owner AAL2 / 16-of-16 AGI eval evidence;
- current physical Node Agent heartbeat;
- current dedicated Railway fallback certification;
- secret rotation;
- any future Advisor ERROR or new WARN not enumerated here.

A future Advisor run that reports a new object or a changed contract is a new finding until reviewed.

## 7. 2026-08-19 revalidation and performance classification

Fresh production Advisor review continued to report the same classes of contract-governed GraphQL discoverability and SECURITY DEFINER warnings, plus Leaked Password Protection disabled. This revalidation does **not** broaden any exception; each object remains subject to the invariants above.

Performance Advisor also reports multiple `unused_index` findings with INFO severity. These are optimization candidates, not deletion instructions. Before dropping any index require:

1. sufficient observation window and representative workload;
2. query-plan / `pg_stat_*` evidence;
3. foreign-key, uniqueness, audit, provider-managed and incident/rollback dependency review;
4. reversible validation outside production first;
5. post-change regression and Advisor/query-performance verification.

No production index, RLS policy, grant or SECURITY DEFINER function was mutated as part of this revalidation.
