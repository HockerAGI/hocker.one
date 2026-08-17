import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Supabase Advisor exceptions are explicit, bounded, and keep provider gates open", async () => {
  const [register, publicFeeds, privateHistory] = await Promise.all([
    read("docs/security/SUPABASE_ADVISOR_EXCEPTION_REGISTER_2026-08-17.md"),
    read("supabase/migrations/20260731003804_privacy_safe_public_game_feeds_20260730.sql"),
    read("supabase/migrations/20260810184341_private_game_history_rpc_20260806.sql"),
  ]);

  assert.match(register, /OPEN_PROVIDER_GATE[\s\S]*Leaked Password Protection/i);
  assert.match(register, /GraphQL discoverability[\s\S]*RLS enabled/i);
  assert.match(register, /re-query|reconsult/i);
  assert.match(register, /leaderboard_opt_in/i);
  assert.match(register, /auth\.uid\(\)/i);

  assert.match(publicFeeds, /security definer set search_path=public,pg_temp/i);
  assert.match(publicFeeds, /leaderboard_opt_in=true/i);
  assert.match(publicFeeds, /least\(coalesce\(p_limit,25\),100\)/i);
  assert.match(publicFeeds, /limit greatest\(1,least\(coalesce\(p_limit,20\),100\)\)/i);
  assert.match(publicFeeds, /revoke all on function public\.get_public_leaderboard\(integer,integer\) from public/i);
  assert.match(publicFeeds, /grant execute on function public\.get_public_recent_wins\(integer\) to anon,authenticated,service_role/i);

  assert.match(privateHistory, /security definer/i);
  assert.match(privateHistory, /set search_path = public, pg_temp/i);
  assert.match(privateHistory, /where s\.user_id = auth\.uid\(\)/i);
  assert.match(privateHistory, /limit least\(greatest\(coalesce\(p_limit, 50\), 1\), 100\)/i);
  assert.match(privateHistory, /revoke all on function public\.get_my_slot_history\(integer\)[\s\S]*from public, anon/i);
  assert.match(privateHistory, /grant execute on function public\.get_my_slot_history\(integer\)[\s\S]*to authenticated, service_role/i);
});
