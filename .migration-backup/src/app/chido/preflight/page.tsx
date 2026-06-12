import type { Metadata } from "next";
import Link from "next/link";
import Hint from "@/components/Hint";
import PageShell from "@/components/PageShell";
import { createAdminSupabase } from "@/lib/supabase-admin";
import type { JsonObject } from "@/lib/types";
import {
  CHIDO_EXECUTION_PREFLIGHT_EVENT,
  CHIDO_EXECUTION_PREFLIGHT_VERSION,
} from "@/lib/chido-execution-preflight";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Preflight Chido · Hocker ONE",
  description: "Execution Preflight Layer para Chido Actions sin ejecución real.",
};

type EventRow = {
  id: string;
  type: string;
  message: string | null;
  created_at: string;
  data: JsonObject | null;
};

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

async function loadPreflightEvents() {
  const sb = createAdminSupabase();

  const { data } = await sb
    .from("events")
    .select("id,type,message,created_at,data")
    .eq("project_id", "chido-casino")
    .eq("type", CHIDO_EXECUTION_PREFLIGHT_EVENT)
    .order("created_at", { ascending: false })
    .limit(30);

  return (data ?? []) as EventRow[];
}

export default async function ChidoPreflightPage() {
  const events = await loadPreflightEvents();
  const passed = events.filter((event) => asRecord(event.data).preflight_passed === true).length;
  const blocked = events.length - passed;

  return (
    <PageShell
      title="Preflight Chido"
      subtitle="Último filtro antes de ejecución real. Actualmente valida, audita y mantiene bloqueo."
      actions={
        <div className="flex flex-wrap gap-2">
          <Link href="/chido/signatures" className="hocker-button-secondary">Firmas</Link>
          <Link href="/chido/approvals" className="hocker-button-secondary">Aprobaciones</Link>
          <Link href="/chido" className="hocker-button-primary">Chido</Link>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        <Hint title="Preflight no ejecuta">
          Aunque el preflight pase, la ejecución real permanece desactivada. Este layer solo demuestra que Research Gate, approvals, guardianes y firma HMAC están completos.
        </Hint>

        <section className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <div className="hocker-panel-pro p-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Versión</p>
            <p className="mt-1 text-xs font-black text-white">{CHIDO_EXECUTION_PREFLIGHT_VERSION}</p>
          </div>

          <div className="hocker-panel-pro p-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Preflight passed</p>
            <p className="mt-1 text-3xl font-black text-emerald-300">{passed}</p>
          </div>

          <div className="hocker-panel-pro p-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Bloqueados</p>
            <p className="mt-1 text-3xl font-black text-rose-300">{blocked}</p>
          </div>

          <div className="hocker-panel-pro p-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Ejecución real</p>
            <p className="mt-1 text-sm font-black text-rose-300">Bloqueada</p>
          </div>
        </section>

        <section className="hocker-panel-pro overflow-hidden">
          <div className="border-b border-white/5 p-5">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Eventos</p>
            <h2 className="mt-1 text-lg font-black text-white">Execution preflight reciente</h2>
          </div>

          <div className="divide-y divide-white/5">
            {events.map((event) => {
              const data = asRecord(event.data);
              const ok = data.preflight_passed === true;

              return (
                <article key={event.id} className="p-5">
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className={ok ? "text-[10px] font-black uppercase tracking-widest text-emerald-300" : "text-[10px] font-black uppercase tracking-widest text-rose-300"}>
                        {ok ? "preflight passed" : "preflight blocked"}
                      </p>
                      <h3 className="mt-1 text-base font-black text-white">{asText(data.action_id)}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-300">{asText(event.message, "Sin mensaje.")}</p>
                      <p className="mt-2 text-xs text-slate-500">
                        Guardianes aprobados: {Array.isArray(data.approved_guardians) ? data.approved_guardians.join(", ") : "—"}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Bloqueos: {Array.isArray(data.blockers) && data.blockers.length ? data.blockers.join(", ") : "ninguno"}
                      </p>
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{safeDate(event.created_at)}</p>
                  </div>
                </article>
              );
            })}

            {events.length === 0 ? (
              <div className="p-5 text-sm text-slate-400">
                Todavía no hay preflights registrados.
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </PageShell>
  );
}
