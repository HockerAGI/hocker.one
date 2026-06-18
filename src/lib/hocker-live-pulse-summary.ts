import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type HockerLivePulseSummary = {
  ok: boolean;
  source: "supabase" | "no_config" | "error";
  checked_at: string;
  counts: {
    approved_learning: number;
    active_memory: number;
    active_agi_updates: number;
    prevented_errors: number;
    repeated_seen: number;
  };
  latest_memory: {
    title: string | null;
    source_agi_id: string | null;
    target_agi_ids: string[];
    times_seen: number;
    created_at: string | null;
  } | null;
  message: string;
};

function num(value: unknown) {
  const n = Number(value || 0);
  return Number.isFinite(n) ? n : 0;
}

function arr(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((x): x is string => typeof x === "string") : [];
}

function empty(source: HockerLivePulseSummary["source"], message: string): HockerLivePulseSummary {
  return {
    ok: source === "supabase",
    source,
    checked_at: new Date().toISOString(),
    counts: {
      approved_learning: 0,
      active_memory: 0,
      active_agi_updates: 0,
      prevented_errors: 0,
      repeated_seen: 0,
    },
    latest_memory: null,
    message,
  };
}

type CountQuery = ReturnType<ReturnType<SupabaseClient["from"]>["select"]>;

async function safeCount(
  sb: SupabaseClient,
  table: string,
  apply?: (q: CountQuery) => CountQuery,
) {
  try {
    let q: CountQuery = sb.from(table).select("*", { count: "exact", head: true });
    if (apply) q = apply(q);
    const { count, error } = await q;
    if (error) return 0;
    return count || 0;
  } catch {
    return 0;
  }
}

export async function getHockerLivePulseSummary(): Promise<HockerLivePulseSummary> {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    return empty("no_config", "Sin conexión privada a Supabase.");
  }

  try {
    const sb = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const [
      approvedLearning,
      activeMemory,
      activeAgiUpdates,
      preventedErrors,
      learningSeen,
      memorySeen,
      errorSeen,
      latestMemoryRes,
    ] = await Promise.all([
      safeCount(sb, "agi_learning_events", (q) => q.eq("status", "approved")),
      safeCount(sb, "agi_memory_mirror", (q) => q.eq("active", true)),
      safeCount(sb, "agi_update_feed", (q) => q.eq("status", "active")),
      safeCount(sb, "agi_error_patterns"),
      sb.from("agi_learning_events").select("times_seen").limit(100),
      sb.from("agi_memory_mirror").select("times_seen").limit(100),
      sb.from("agi_error_patterns").select("times_seen").limit(100),
      sb
        .from("agi_memory_mirror")
        .select("title,source_agi_id,target_agi_ids,times_seen,created_at")
        .eq("active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    const repeatedSeen =
      (learningSeen.data || []).reduce((sum: number, row: { times_seen?: unknown }) => sum + Math.max(0, num(row.times_seen) - 1), 0) +
      (memorySeen.data || []).reduce((sum: number, row: { times_seen?: unknown }) => sum + Math.max(0, num(row.times_seen) - 1), 0) +
      (errorSeen.data || []).reduce((sum: number, row: { times_seen?: unknown }) => sum + Math.max(0, num(row.times_seen) - 1), 0);

    const latest = latestMemoryRes.data as {
      title?: unknown;
      source_agi_id?: unknown;
      target_agi_ids?: unknown;
      times_seen?: unknown;
      created_at?: unknown;
    } | null;

    return {
      ok: true,
      source: "supabase",
      checked_at: new Date().toISOString(),
      counts: {
        approved_learning: approvedLearning,
        active_memory: activeMemory,
        active_agi_updates: activeAgiUpdates,
        prevented_errors: preventedErrors,
        repeated_seen: repeatedSeen,
      },
      latest_memory: latest
        ? {
            title: typeof latest.title === "string" ? latest.title : null,
            source_agi_id: typeof latest.source_agi_id === "string" ? latest.source_agi_id : null,
            target_agi_ids: arr(latest.target_agi_ids),
            times_seen: num(latest.times_seen),
            created_at: typeof latest.created_at === "string" ? latest.created_at : null,
          }
        : null,
      message: "Datos reales leídos desde Supabase.",
    };
  } catch {
    return empty("error", "No se pudo leer el pulso real.");
  }
}
