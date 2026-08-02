import type { Metadata } from "next";
import Link from "next/link";
import { Database, RefreshCw } from "lucide-react";

import HockerPageHeader from "@/components/ui-hocker/HockerPageHeader";
import { createAdminSupabase } from "@/lib/supabase-admin";
import type { JsonObject } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Memoria | Hocker ONE",
  description: "Registros persistidos de memoria, decisiones, pendientes e interacciones.",
  robots: { index: false, follow: false, noarchive: true },
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

function safeDate(input: string | null): string {
  if (!input) return "Sin fecha";
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return "Fecha inválida";
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Tijuana",
  }).format(date);
}

function memoryLabel(type: string): string {
  if (type === "memory.state") return "Estado registrado";
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
  if (!data) return "Sin responsable";
  const value = data.agi_id ?? data.agi ?? data.primary_agi;
  return typeof value === "string" && value.trim() ? value : "Sin responsable";
}

async function loadMemory(): Promise<{ events: MemoryEvent[]; error: string | null }> {
  try {
    const sb = createAdminSupabase();
    const { data, error } = await sb
      .from("events")
      .select("id,project_id,level,type,message,data,created_at")
      .eq("project_id", "hocker-one")
      .like("type", "memory.%")
      .order("created_at", { ascending: false })
      .limit(80);

    if (error) return { events: [], error: error.message };
    return { events: (data ?? []) as MemoryEvent[], error: null };
  } catch (error) {
    return { events: [], error: error instanceof Error ? error.message : "No se pudo consultar la memoria." };
  }
}

export default async function MemoryPage() {
  const checkedAt = new Date().toISOString();
  const { events, error } = await loadMemory();
  const counts = {
    state: events.filter((event) => event.type === "memory.state").length,
    decisions: events.filter((event) => event.type === "memory.decision").length,
    pending: events.filter((event) => event.type === "memory.next").length,
    interactions: events.filter((event) => event.type === "memory.interaction").length,
  };
  const latest = events[0] ?? null;

  return (
    <div className="hko-page-flow space-y-5">
      <HockerPageHeader
        eyebrow="Registros persistidos"
        title="Memoria"
        text="Esta vista muestra eventos almacenados en Supabase. La existencia de registros no prueba que SYNTIA esté ejecutándose en este momento."
      />

      <section className="hko-map-panel">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="hko-kicker">Lectura de base de datos</p>
            <p className="mt-2 text-sm text-slate-300">Consultado: {safeDate(checkedAt)}</p>
            <p className="mt-1 text-xs text-slate-500">Último registro: {safeDate(latest?.created_at ?? null)}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/memory" className="hko-action-secondary inline-flex items-center gap-2"><RefreshCw className="h-4 w-4" /> Actualizar</Link>
            <Link href="/memory/review" className="hko-action-primary">Revisar aprendizajes</Link>
          </div>
        </div>
      </section>

      {error ? (
        <section className="rounded-2xl border border-rose-300/20 bg-rose-300/10 p-4 text-sm text-rose-100">
          No se pudo verificar la memoria: {error}
        </section>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <article className="hko-mini-stat"><span>Registros consultados</span><strong>{events.length}</strong></article>
        <article className="hko-mini-stat"><span>Estados</span><strong>{counts.state}</strong></article>
        <article className="hko-mini-stat"><span>Decisiones</span><strong>{counts.decisions}</strong></article>
        <article className="hko-mini-stat"><span>Pendientes</span><strong>{counts.pending}</strong></article>
        <article className="hko-mini-stat"><span>Interacciones</span><strong>{counts.interactions}</strong></article>
      </section>

      <section className="hko-map-panel">
        <div className="mb-4 flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] text-cyan-100"><Database className="h-5 w-5" /></span>
          <div>
            <p className="hko-kicker">Bitácora</p>
            <h2 className="mt-1 text-xl font-black text-white">Eventos de memoria</h2>
          </div>
        </div>

        <div className="space-y-3">
          {events.map((event) => (
            <article key={event.id} className="rounded-2xl border border-white/8 bg-slate-950/40 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.14em] ${memoryClass(event.type)}`}>{memoryLabel(event.type)}</span>
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-slate-300">{getAgi(event.data)}</span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-200">{event.message ?? "Sin mensaje almacenado."}</p>
                </div>
                <p className="shrink-0 text-xs text-slate-500">{safeDate(event.created_at)}</p>
              </div>
            </article>
          ))}

          {!error && events.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-white/10 p-6 text-sm text-slate-500">No existen eventos de memoria para este proyecto.</p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
