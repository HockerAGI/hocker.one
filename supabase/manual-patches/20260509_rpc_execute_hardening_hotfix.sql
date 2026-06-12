-- HOCKER ONE / CHIDO :: RPC EXECUTE HARDENING HOTFIX
-- Applied manually in Supabase SQL Editor on 2026-05-09.
-- Purpose: block direct anon/authenticated execution of sensitive RPCs.
-- service_role execution preserved for backend-only flows.

-- Functions hardened:
-- _distribute_affiliate_commission
-- crash_play_round
-- place_bet
-- profiles_add_free_spins
-- request_withdrawal

-- Verified result:
-- anon: false
-- authenticated: false
-- service_role: true
