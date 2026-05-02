import type { Metadata } from "next";
import Link from "next/link";
import Hint from "@/components/Hint";
import PageShell from "@/components/PageShell";
import { createAdminSupabase } from "@/lib/supabase-admin";
import type { JsonObject } from "@/lib/types";

export const metadata: Metadata = {
  title: "Memoria · Hocker ONE",
  description: "Memoria operativa viva de SYNTIA para continuidad del ecosistema HOCKER.",
};

type MemoryEvent = {
  id: string;
  project_id: string;
  level: string | null;
  type: string;
  message: string | null;
  data: JsonObject | null;
  created_at: string;
};

function safeDate(input: string): string {
  const d = new Date(input);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("es-MX");
}

function memoryLabel(type: string): string {
  if (type === "memory.state") return "Estado";
  if (type === "memory.decision") return "Decisión";
  if (type === "memory.next") return "Pendiente";
  if (type === "memory.interaction") return "Interacción";
  return type.replace("memory.", "");
}

function memoryClass(type: string): string {
  if (type === "memory.state") return "border-emerald-400/20 bg-emerald-500/10 text-emerald-300";
  if (type === "memory.decision") return "border-sky-400/20 bg-sky-500/10 text-sky-300";
  if (type === "memory.next") return "border-amber-400/20 bg-amber-500/10 text-amber-300";
  if (type === "memory.interaction") return "border-violet-400/20 bg-violet-500/10 text-violet-300";
  return "border-slate-400/20 bg-slate-500/10 text-slate-300";
}

function getAgi(data: JsonObject | null): string {
  if (!data) return "SYNTIA";
  const value = data.agi_id ?? data.agi ?? data.primary_agi;
  return typeof value === "string" && value.trim() ? value : "SYNTIA";
}

async function loadMemory(): Promise<MemoryEvent[]> {
  const sb = createAdminSupabase();

  const { data, error } = await sb
    .from("events")
    .select("id,project_id,level,type,message,data,created_at")
    .eq("project_id", "hocker-one")
    .like("type", "memory.%")
    .order("created_at", { ascending: false })
    .limit(80);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as MemoryEvent[];
}

export default async function MemoryPage() {
  const events = await loadMemory();

  const stateCount = events.filter((event) => event.type === "memory.state").length;
  const decisionCount = events.filter((event) => event.type === "memory.decision").length;
  const nextCount = events.filter((event) => event.type === "memory.next").length;
  const interactionCount = events.filter((event) => event.type === "memory.interaction").length;

  const latestState = events.find((event) => event.type === "memory.state");
  const latestNext = events.find((event) => event.type === "memory.next");

  return (
    <PageShell
      title="Memoria"
      subtitle="Bitácora viva de SYNTIA: estado, decisiones, pendientes e interacciones del ecosistema HOCKER."
      actions={
        <div className="flex flex-wrap gap-2">
          <Link href="/agis" className="hocker-button-secondary">
            AGIs
          </Link>
          <Link href="/dashboard" className="hocker-button-primary">
            Panel
          </Link>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        <section className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <div className="hocker-panel-pro p-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Eventos</p>
            <p className="mt-1 text-2xl font-black text-white">{events.length}</p>
          </div>

          <div className="hocker-panel-pro p-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-emerald-400">Estado</p>
            <p className="mt-1 text-2xl font-black text-white">{stateCount}</p>
          </div>

          <div className="hocker-panel-pro p-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-sky-400">Decisiones</p>
            <p className="mt-1 text-2xl font-black text-white">{decisionCount}</p>
          </div>

          <div className="hocker-panel-pro p-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-amber-400">Pendientes</p>
            <p className="mt-1 text-2xl font-black text-white">{nextCount + interactionCount}</p>
          </div>
        </section>

        <Hint title="SYNTIA activa">
          Esta memoria sale de Supabase. NOVA la usa para mantener continuidad y responder sin perder contexto.
        </Hint>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <article className="hocker-panel-pro p-5">
            <p className="text-[9px] font-black uppercase tracking-widest text-emerald-400">Estado actual</p>
            <h2 className="mt-2 text-lg font-black text-white">
              {latestState?.message ?? "Sin estado registrado todavía."}
            </h2>
            <p className="mt-3 text-xs font-bold uppercase tracking-widest text-slate-500">
              Última actualización: {latestState ? safeDate(latestState.created_at) : "—"}
            </p>
          </article>

          <article className="hocker-panel-pro p-5">
            <p className="text-[9px] font-black uppercase tracking-widest text-amber-400">Siguiente movimiento</p>
            <h2 className="mt-2 text-lg font-black text-white">
              {latestNext?.message ?? "Sin pendiente registrado todavía."}
            </h2>
            <p className="mt-3 text-xs font-bold uppercase tracking-widest text-slate-500">
              Responsable base: SYNTIA + NOVA
            </p>
          </article>
        </section>

        <section className="hocker-panel-pro overflow-hidden">
          <div className="border-b border-white/5 p-5">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Bitácora</p>
            <h2 className="mt-1 text-lg font-black text-white">Memoria operativa reciente</h2>
          </div>

          <div className="divide-y divide-white/5">
            {events.map((event) => (
              <article key={event.id} className="p-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="max-w-4xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-widest ${memoryClass(event.type)}`}>
                        {memoryLabel(event.type)}
                      </span>

                      <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-slate-300">
                        {getAgi(event.data)}
                      </span>
                    </div>

                    <p className="mt-3 text-sm leading-6 text-slate-200">
                      {event.message ?? "Sin mensaje."}
                    </p>
                  </div>

                  <div className="shrink-0 text-left lg:text-right">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                      {safeDate(event.created_at)}
                    </p>
                    <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-slate-600">
                      {event.project_id}
                    </p>
                  </div>
                </div>
              </article>
            ))}

            {events.length === 0 ? (
              <div className="p-5 text-sm text-slate-400">
                SYNTIA todavía no tiene eventos de memoria para este proyecto.
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </PageShell>
  );
}
