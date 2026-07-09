import type { Metadata } from "next";
import Link from "next/link";
import { Activity, Users, DollarSign, Dice5, TrendingUp, ShieldAlert, Clock } from "lucide-react";
import Hint from "@/components/Hint";
import PageShell from "@/components/PageShell";
import { createAdminSupabase } from "@/lib/supabase-admin";
import type { JsonObject } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Dashboard Chido · Hocker ONE",
  description: "Métricas en tiempo real de Chido Casino: jugadores, transacciones, apuestas y juegos.",
  robots: { index: false, follow: false, noarchive: true, nosnippet: true },
};

type MetricRow = {
  ok: boolean;
  count: number;
  sample: JsonObject[];
  error?: string;
};

function asRecord(value: unknown): JsonObject {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as JsonObject) : {};
}

function asText(value: unknown, fallback = "—"): string {
  if (value === null || value === undefined) return fallback;
  const text = String(value).trim();
  return text || fallback;
}

function safeDate(value: unknown): string {
  const text = asText(value, "");
  if (!text) return "—";
  const d = new Date(text);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("es-MX");
}

function statusColor(status: string): string {
  const s = status.toLowerCase();
  if (["approved", "confirmed", "completed", "success", "active", "verified", "online", "won", "paid"].includes(s)) {
    return "text-emerald-300";
  }
  if (["pending", "submitted", "review", "processing", "waiting", "queued", "open"].includes(s)) {
    return "text-amber-300";
  }
  if (["rejected", "failed", "blocked", "cancelled", "canceled", "error", "lost", "closed"].includes(s)) {
    return "text-rose-300";
  }
  return "text-slate-300";
}

function redact(value: unknown): string {
  const text = asText(value);
  if (text === "—") return text;
  if (text.length <= 8) return text;
  return `${text.slice(0, 6)}…`;
}

async function loadMetric(table: string, limit = 8): Promise<MetricRow> {
  const sb = createAdminSupabase();
  const orderCols = ["created_at", "updated_at", "submitted_at", "requested_at", "played_at", "placed_at", "spun_at"];

  for (const col of orderCols) {
    const { data, error, count } = await sb
      .from(table)
      .select("*", { count: "exact" })
      .order(col, { ascending: false })
      .range(0, limit - 1);

    if (!error) {
      return { ok: true, count: count ?? 0, sample: (data ?? []) as JsonObject[] };
    }

    // If the error is about the order column not existing, try the next one
    if (String(error.message).includes("Could not find") || String(error.message).includes("column")) {
      continue;
    }

    return { ok: false, count: 0, sample: [], error: error.message };
  }

  // Fallback: no known order column, just select without ordering
  const { data, error, count } = await sb
    .from(table)
    .select("*", { count: "exact" })
    .range(0, limit - 1);

  if (error) {
    return { ok: false, count: 0, sample: [], error: error.message };
  }

  return { ok: true, count: count ?? 0, sample: (data ?? []) as JsonObject[] };
}

type DashboardData = {
  profiles: MetricRow;
  transactions: MetricRow;
  balances: MetricRow;
  bets: MetricRow;
  gameHistory: MetricRow;
  slotSpins: MetricRow;
  crashBets: MetricRow;
  kycPending: MetricRow;
  deposits: MetricRow;
  withdrawals: MetricRow;
  nodeStatus: { online: boolean; status: string | null; lastSeen: string | null };
};

async function loadDashboard(): Promise<DashboardData> {
  const sb = createAdminSupabase();

  const [
    profiles,
    transactions,
    balances,
    bets,
    gameHistory,
    slotSpins,
    crashBets,
    kycPending,
    deposits,
    withdrawals,
  ] = await Promise.all([
    loadMetric("profiles", 8),
    loadMetric("transactions", 10),
    loadMetric("balances", 8),
    loadMetric("bets", 10),
    loadMetric("game_history", 10),
    loadMetric("slot_spins", 10),
    loadMetric("crash_bets", 10),
    loadMetric("kyc_requests", 8),
    loadMetric("manual_deposit_requests", 8),
    loadMetric("withdraw_requests", 8),
  ]);

  let nodeStatus: DashboardData["nodeStatus"] = { online: false, status: null, lastSeen: null };
  try {
    const { data: node } = await sb
      .from("nodes")
      .select("status,last_seen_at")
      .eq("project_id", "chido-casino")
      .eq("id", "chido-casino-web")
      .maybeSingle();

    if (node) {
      nodeStatus = {
        online: (node as { status?: string }).status === "online",
        status: (node as { status?: string }).status ?? null,
        lastSeen: (node as { last_seen_at?: string }).last_seen_at ?? null,
      };
    }
  } catch {
    // non-fatal
  }

  return {
    profiles,
    transactions,
    balances,
    bets,
    gameHistory,
    slotSpins,
    crashBets,
    kycPending,
    deposits,
    withdrawals,
    nodeStatus,
  };
}

type StatCardProps = {
  label: string;
  value: string | number;
  icon: typeof Activity;
  tone?: "emerald" | "amber" | "rose" | "sky" | "violet";
  hint?: string;
};

function StatCard({ label, value, icon: Icon, tone = "sky", hint }: StatCardProps) {
  const tones: Record<string, string> = {
    emerald: "border-emerald-400/20 bg-emerald-500/8 text-emerald-300",
    amber: "border-amber-400/20 bg-amber-500/8 text-amber-300",
    rose: "border-rose-400/20 bg-rose-500/8 text-rose-300",
    sky: "border-sky-400/20 bg-sky-500/8 text-sky-300",
    violet: "border-violet-400/20 bg-violet-500/8 text-violet-300",
  };

  return (
    <div className={`rounded-[24px] border p-4 ${tones[tone]}`}>
      <div className="flex items-center justify-between">
        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-500">{label}</p>
        <Icon className="h-4 w-4 opacity-70" />
      </div>
      <p className="mt-3 text-3xl font-black text-white">{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

function RowList({ title, rows, columns }: { title: string; rows: JsonObject[]; columns: Array<{ key: string; label: string; format?: (v: unknown) => string }> }) {
  return (
    <div className="hocker-panel-pro overflow-hidden">
      <div className="border-b border-white/5 p-4">
        <h3 className="text-sm font-black uppercase tracking-widest text-slate-300">{title}</h3>
      </div>
      {rows.length === 0 ? (
        <p className="p-4 text-sm text-slate-500">Sin datos recientes.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/[0.02] text-slate-500">
              <tr>
                {columns.map((col) => (
                  <th key={col.key} className="whitespace-nowrap px-3 py-2 font-black uppercase tracking-wider">
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {rows.map((row, i) => (
                <tr key={i} className="hover:bg-white/[0.02]">
                  {columns.map((col) => {
                    const raw = row[col.key];
                    const text = col.format ? col.format(raw) : asText(raw);
                    return (
                      <td key={col.key} className="whitespace-nowrap px-3 py-2 text-slate-300">
                        {col.key === "status" || col.key === "kyc_status" || col.key === "state" || col.key === "result" || col.key === "payment_status" ? (
                          <span className={statusColor(text)}>{text}</span>
                        ) : (
                          text
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default async function ChidoDashboardPage() {
  const data = await loadDashboard();

  const pendingKyc = data.kycPending.sample.filter((r) => {
    const s = asText(r["status"]).toLowerCase();
    return ["pending", "submitted", "review", "processing"].some((w) => s.includes(w));
  }).length;

  const pendingDeposits = data.deposits.sample.filter((r) => {
    const s = asText(r["status"]).toLowerCase();
    return ["pending", "submitted", "processing", "waiting"].some((w) => s.includes(w));
  }).length;

  const pendingWithdrawals = data.withdrawals.sample.filter((r) => {
    const s = asText(r["status"]).toLowerCase();
    return ["pending", "processing", "waiting", "queued"].some((w) => s.includes(w));
  }).length;

  const totalPending = pendingKyc + pendingDeposits + pendingWithdrawals;

  return (
    <PageShell
      title="Dashboard Chido"
      subtitle="Métricas en tiempo real del casino: jugadores, transacciones, apuestas, juegos y solicitudes pendientes."
      actions={
        <div className="flex flex-wrap gap-2">
          <Link href="/chido" className="hocker-button-secondary">
            Resumen
          </Link>
          <Link href="/chido/ops" className="hocker-button-secondary">
            Operación
          </Link>
          <Link href="/chido/actions" className="hocker-button-secondary">
            Acciones
          </Link>
          <Link href="/chido/research-gate" className="hocker-button-secondary">
            Research Gate
          </Link>
        </div>
      }
    >
      <div className="flex flex-col gap-5">
        <section className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6">
          <StatCard
            label="Jugadores"
            value={data.profiles.count}
            icon={Users}
            tone="sky"
            hint={data.profiles.ok ? "Total registrados" : "Sin acceso"}
          />
          <StatCard
            label="Transacciones"
            value={data.transactions.count}
            icon={DollarSign}
            tone="emerald"
            hint={data.transactions.ok ? "Histórico" : "Sin acceso"}
          />
          <StatCard
            label="Apuestas"
            value={data.bets.count}
            icon={Dice5}
            tone="violet"
            hint={data.bets.ok ? "Total apuestas" : "Sin acceso"}
          />
          <StatCard
            label="Partidas"
            value={data.gameHistory.count}
            icon={TrendingUp}
            tone="sky"
            hint={data.gameHistory.ok ? "Game history" : "Sin acceso"}
          />
          <StatCard
            label="Pendientes"
            value={totalPending}
            icon={ShieldAlert}
            tone={totalPending > 0 ? "amber" : "emerald"}
            hint="KYC + Depósitos + Retiros"
          />
          <StatCard
            label="Nodo"
            value={data.nodeStatus.status ?? "sin señal"}
            icon={Activity}
            tone={data.nodeStatus.online ? "emerald" : "rose"}
            hint={data.nodeStatus.lastSeen ? safeDate(data.nodeStatus.lastSeen) : "—"}
          />
        </section>

        {data.nodeStatus.status !== "online" ? (
          <Hint title="Nodo Chido no reporta señal en vivo" tone="rose">
            El nodo chido-casino-web no está online o no ha reportado heartbeat recientemente.
            Los conteos provienen directamente de la base de datos compartida en Supabase.
          </Hint>
        ) : (
          <Hint title="Lectura en tiempo real">
            Datos obtenidos directamente de la base de datos compartida en Supabase.
            Toda la información es de solo lectura: Hocker ONE no ejecuta acciones sobre el casino.
          </Hint>
        )}

        <section className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <StatCard
            label="Slots"
            value={data.slotSpins.count}
            icon={Dice5}
            tone="violet"
          />
          <StatCard
            label="Crash"
            value={data.crashBets.count}
            icon={TrendingUp}
            tone="amber"
          />
          <StatCard
            label="Balances"
            value={data.balances.count}
            icon={DollarSign}
            tone="emerald"
          />
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <RowList
            title="Transacciones recientes"
            rows={data.transactions.sample}
            columns={[
              { key: "id", label: "ID", format: redact },
              { key: "type", label: "Tipo" },
              { key: "status", label: "Estado" },
              { key: "amount", label: "Monto" },
              { key: "created_at", label: "Fecha", format: (v) => safeDate(v) },
            ]}
          />
          <RowList
            title="Apuestas recientes"
            rows={data.bets.sample}
            columns={[
              { key: "id", label: "ID", format: redact },
              { key: "game", label: "Juego" },
              { key: "amount", label: "Monto" },
              { key: "status", label: "Estado" },
              { key: "created_at", label: "Fecha", format: (v) => safeDate(v) },
            ]}
          />
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <RowList
            title="Game History"
            rows={data.gameHistory.sample}
            columns={[
              { key: "id", label: "ID", format: redact },
              { key: "game", label: "Juego" },
              { key: "result", label: "Resultado" },
              { key: "payout", label: "Pago" },
              { key: "created_at", label: "Fecha", format: (v) => safeDate(v) },
            ]}
          />
          <RowList
            title="Solicitudes KYC"
            rows={data.kycPending.sample}
            columns={[
              { key: "id", label: "ID", format: redact },
              { key: "kyc_status", label: "Estado" },
              { key: "status", label: "Status" },
              { key: "submitted_at", label: "Enviado", format: (v) => safeDate(v) },
            ]}
          />
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <RowList
            title="Depósitos manuales"
            rows={data.deposits.sample}
            columns={[
              { key: "id", label: "ID", format: redact },
              { key: "status", label: "Estado" },
              { key: "amount", label: "Monto" },
              { key: "created_at", label: "Fecha", format: (v) => safeDate(v) },
            ]}
          />
          <RowList
            title="Retiros"
            rows={data.withdrawals.sample}
            columns={[
              { key: "id", label: "ID", format: redact },
              { key: "status", label: "Estado" },
              { key: "amount", label: "Monto" },
              { key: "created_at", label: "Fecha", format: (v) => safeDate(v) },
            ]}
          />
        </section>

        <section className="flex flex-wrap items-center gap-2 rounded-[24px] border border-white/10 bg-black/20 px-4 py-3">
          <Clock className="h-4 w-4 text-slate-500" />
          <p className="text-xs text-slate-500">
            Última lectura: {new Date().toLocaleString("es-MX")} · Read-only · Sin ejecución
          </p>
        </section>
      </div>
    </PageShell>
  );
}
