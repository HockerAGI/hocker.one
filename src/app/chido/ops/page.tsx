import type { Metadata } from "next";
import Link from "next/link";
import Hint from "@/components/Hint";
import PageShell from "@/components/PageShell";
import { createAdminSupabase } from "@/lib/supabase-admin";
import type { JsonObject } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Operación Chido · Hocker ONE",
  description: "Monitoreo read-only avanzado de Chido Casino.",
};

type TableState = {
  table: string;
  label: string;
  owner: string;
  ok: boolean;
  count: number;
  rows: JsonObject[];
  error?: string;
};

const TABLES = [
  { table: "kyc_requests", label: "KYC pendientes", owner: "JURIX" },
  { table: "manual_deposit_requests", label: "Depósitos manuales", owner: "NUMIA" },
  { table: "withdraw_requests", label: "Retiros", owner: "NUMIA + VERTX" },
  { table: "profiles", label: "Usuarios recientes", owner: "Chido Gerente" },
  { table: "transactions", label: "Transacciones", owner: "NUMIA" },
  { table: "balances", label: "Balances", owner: "NUMIA" },
] as const;

function asRecord(value: unknown): JsonObject {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as JsonObject) : {};
}

function asText(value: unknown, fallback = "—"): string {
  if (value === null || value === undefined) return fallback;
  const text = String(value).trim();
  return text ? text : fallback;
}

function safeDate(value: unknown): string {
  const text = asText(value, "");
  if (!text) return "—";
  const d = new Date(text);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("es-MX");
}

function redact(value: unknown): string {
  const text = asText(value);
  if (text === "—") return text;
  if (text.length <= 10) return text;
  return `${text.slice(0, 8)}…`;
}

function pick(row: JsonObject, keys: string[]): unknown {
  for (const key of keys) {
    const value = row[key];
    if (value !== null && value !== undefined && String(value).trim() !== "") return value;
  }
  return undefined;
}

function statusClass(value: unknown): string {
  const status = asText(value, "").toLowerCase();

  if (["approved", "confirmed", "completed", "success", "active", "verified", "online"].includes(status)) {
    return "border-emerald-400/20 bg-emerald-500/10 text-emerald-300";
  }

  if (["pending", "submitted", "review", "manual_review", "processing", "waiting"].includes(status)) {
    return "border-amber-400/20 bg-amber-500/10 text-amber-300";
  }

  if (["rejected", "failed", "blocked", "canceled", "cancelled", "error"].includes(status)) {
    return "border-rose-400/20 bg-rose-500/10 text-rose-300";
  }

  return "border-slate-400/20 bg-slate-500/10 text-slate-300";
}

function pendingLike(row: JsonObject): boolean {
  const status = asText(pick(row, ["status", "state", "kyc_status", "payment_status"]), "").toLowerCase();
  return ["pending", "submitted", "review", "manual_review", "processing", "waiting"].some((word) => status.includes(word));
}

async function loadTable(table: string, label: string, owner: string): Promise<TableState> {
  const sb = createAdminSupabase();

  const orderCandidates = ["created_at", "updated_at", "submitted_at", "requested_at"];

  for (const column of orderCandidates) {
    const { data, error, count } = await sb
      .from(table)
      .select("*", { count: "exact" })
      .order(column, { ascending: false })
      .limit(12);

    if (!error) {
      return {
        table,
        label,
        owner,
        ok: true,
        count: count ?? data?.length ?? 0,
        rows: (data ?? []) as JsonObject[],
      };
    }
  }

  const { data, error, count } = await sb.from(table).select("*", { count: "exact" }).limit(12);

  if (error) {
    return {
      table,
      label,
      owner,
      ok: false,
      count: 0,
      rows: [],
      error: error.message,
    };
  }

  return {
    table,
    label,
    owner,
    ok: true,
    count: count ?? data?.length ?? 0,
    rows: (data ?? []) as JsonObject[],
  };
}


async function recordChidoOpsView(tables: TableState[], eventsCount: number, node: JsonObject | null): Promise<void> {
  const sb = createAdminSupabase();

  const { data: latest } = await sb
    .from("events")
    .select("id,created_at")
    .eq("project_id", "chido-casino")
    .eq("type", "chido.ops.view")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const latestAt = asText((latest as JsonObject | null)?.created_at, "");
  const latestTime = latestAt ? new Date(latestAt).getTime() : 0;
  const fiveMinutes = 5 * 60 * 1000;

  if (latestTime && Date.now() - latestTime < fiveMinutes) return;

  await sb.from("events").insert({
    project_id: "chido-casino",
    level: "info",
    type: "chido.ops.view",
    message: "Hocker ONE consultó Operación Chido en modo read-only.",
    data: {
      source: "hocker.one",
      route: "/chido/ops",
      mode: "read_only",
      node_status: asText(node?.status, "unknown"),
      tables: tables.map((table) => ({
        table: table.table,
        ok: table.ok,
        count: table.count,
        owner: table.owner
      })),
      events_count: eventsCount,
      responsible_agis: ["chido_gerente", "numia", "jurix", "vertx", "syntia"]
    }
  });
}

async function loadOps() {
  const sb = createAdminSupabase();

  const [tables, events, node] = await Promise.all([
    Promise.all(TABLES.map((item) => loadTable(item.table, item.label, item.owner))),
    sb
      .from("events")
      .select("id,project_id,node_id,level,type,message,data,created_at")
      .eq("project_id", "chido-casino")
      .like("type", "chido.%")
      .order("created_at", { ascending: false })
      .limit(20),
    sb
      .from("nodes")
      .select("id,project_id,name,type,status,last_seen_at,updated_at,meta")
      .eq("project_id", "chido-casino")
      .eq("id", "chido-casino-web")
      .maybeSingle(),
  ]);

  const result = {
    tables,
    events: (events.data ?? []) as JsonObject[],
    node: (node.data ?? null) as JsonObject | null,
  };

  await recordChidoOpsView(result.tables, result.events.length, result.node).catch(() => undefined);

  return result;
}

function rowSummary(row: JsonObject) {
  return {
    id: pick(row, ["id", "user_id", "profile_id", "transaction_id", "request_id"]),
    status: pick(row, ["status", "state", "kyc_status", "payment_status"]),
    amount: pick(row, ["amount", "value", "total", "balance", "bonus_balance", "locked_balance"]),
    currency: pick(row, ["currency", "asset"]),
    created: pick(row, ["created_at", "updated_at", "submitted_at", "requested_at"]),
  };
}

export default async function ChidoOpsPage() {
  const { tables, events, node } = await loadOps();

  const totalRows = tables.reduce((acc, table) => acc + table.count, 0);
  const pendingDetected = tables.reduce((acc, table) => acc + table.rows.filter(pendingLike).length, 0);
  const unavailable = tables.filter((table) => !table.ok).length;

  return (
    <PageShell
      title="Operación Chido"
      subtitle="Monitoreo read-only avanzado. Sin aprobar, rechazar, pagar, retirar ni modificar balances."
      actions={
        <div className="flex flex-wrap gap-2">
          <Link href="/chido" className="hocker-button-secondary">Chido</Link>
          <Link href="/agis" className="hocker-button-secondary">AGIs</Link>
          <Link href="/dashboard" className="hocker-button-primary">Panel</Link>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        <section className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <div className="hocker-panel-pro p-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Nodo Chido</p>
            <p className={`mt-3 inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${statusClass(node?.status)}`}>
              {asText(node?.status, "sin señal")}
            </p>
          </div>

          <div className="hocker-panel-pro p-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Registros leídos</p>
            <p className="mt-1 text-2xl font-black text-white">{totalRows}</p>
          </div>

          <div className="hocker-panel-pro p-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Pendientes</p>
            <p className="mt-1 text-2xl font-black text-white">{pendingDetected}</p>
          </div>

          <div className="hocker-panel-pro p-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Sin lectura</p>
            <p className="mt-1 text-2xl font-black text-white">{unavailable}</p>
          </div>
        </section>

        <Hint title="Modo solo lectura">
          Esta vista no muestra datos personales completos ni ejecuta acciones sensibles. Chido Gerente observa operación, NUMIA revisa dinero, JURIX cuida KYC y VERTX vigila riesgo.
        </Hint>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {tables.map((table) => {
            const pending = table.rows.filter(pendingLike).length;

            return (
              <article key={table.table} className="hocker-panel-pro overflow-hidden">
                <div className="border-b border-white/5 p-5">
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">{table.table}</p>
                      <h2 className="mt-1 text-lg font-black text-white">{table.label}</h2>
                      <p className="mt-1 text-xs font-bold uppercase tracking-widest text-cyan-300">{table.owner}</p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span className={`rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-widest ${table.ok ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-300" : "border-rose-400/20 bg-rose-500/10 text-rose-300"}`}>
                        {table.ok ? "lectura ok" : "sin lectura"}
                      </span>
                      <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-slate-300">
                        total {table.count}
                      </span>
                      <span className="rounded-full border border-amber-400/20 bg-amber-500/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-amber-300">
                        pendientes {pending}
                      </span>
                    </div>
                  </div>

                  {table.error ? (
                    <p className="mt-3 rounded-xl border border-rose-400/20 bg-rose-500/10 p-3 text-xs text-rose-200">{table.error}</p>
                  ) : null}
                </div>

                <div className="divide-y divide-white/5">
                  {table.rows.map((row, index) => {
                    const summary = rowSummary(row);

                    return (
                      <div key={`${table.table}-${index}`} className="grid grid-cols-1 gap-3 p-4 md:grid-cols-4">
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">ID</p>
                          <p className="mt-1 text-xs font-bold text-white">{redact(summary.id)}</p>
                        </div>

                        <div>
                          <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Estado</p>
                          <p className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-widest ${statusClass(summary.status)}`}>
                            {asText(summary.status)}
                          </p>
                        </div>

                        <div>
                          <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Monto/valor</p>
                          <p className="mt-1 text-xs font-bold text-white">{asText(summary.amount)} {asText(summary.currency, "")}</p>
                        </div>

                        <div>
                          <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Fecha</p>
                          <p className="mt-1 text-xs font-bold text-white">{safeDate(summary.created)}</p>
                        </div>
                      </div>
                    );
                  })}

                  {table.rows.length === 0 ? (
                    <div className="p-4 text-sm text-slate-400">Sin registros recientes.</div>
                  ) : null}
                </div>
              </article>
            );
          })}
        </section>

        <section className="hocker-panel-pro overflow-hidden">
          <div className="border-b border-white/5 p-5">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Eventos</p>
            <h2 className="mt-1 text-lg font-black text-white">Bitácora Chido reciente</h2>
          </div>

          <div className="divide-y divide-white/5">
            {events.map((event, index) => {
              const e = asRecord(event);

              return (
                <article key={asText(e.id, String(index))} className="p-5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-cyan-300">{asText(e.type)}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-200">{asText(e.message, "Sin mensaje.")}</p>
                  <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">{safeDate(e.created_at)}</p>
                </article>
              );
            })}

            {events.length === 0 ? (
              <div className="p-5 text-sm text-slate-400">Chido todavía no tiene eventos recientes.</div>
            ) : null}
          </div>
        </section>
      </div>
    </PageShell>
  );
}
