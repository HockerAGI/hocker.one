-- Cover the canonical AGI foreign-key columns with dedicated leading indexes.
-- Existing composite/unique indexes remain unchanged.

create index if not exists agi_agents_agi_id_idx
  on public.agi_agents (agi_id);

create index if not exists agi_agent_tools_agi_id_idx
  on public.agi_agent_tools (agi_id);

create index if not exists agi_memory_mirror_agi_id_idx
  on public.agi_memory_mirror (agi_id);
