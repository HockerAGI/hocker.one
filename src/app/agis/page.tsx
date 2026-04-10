import type { Metadata } from "next";
import Link from "next/link";
import Hint from "@/components/Hint";
import PageShell from "@/components/PageShell";
import { createAdminSupabase } from "@/lib/supabase-admin";
import type { AgiRow, JsonObject } from "@/lib/types";

export const metadata: Metadata = {
  title: "Módulos",
  description: "Registro operativo de inteligencias del ecosistema.",
};

function asMeta(value: unknown): JsonObject {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonObject)
    : {};
}

function safeDate(input: string): string {
  const d = new Date(input);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("es-MX");
}

async function loadAgis(): Promise<AgiRow[]> {
  const sb = createAdminSupabase();

  const { data, error } = await sb
    .from("agis")
    .select("id, name, description, version, tags, meta, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as AgiRow[];
}

export default async function AgisPage() {
  const agis = await loadAgis();

  return (
    <PageShell
      title="Módulos"
      subtitle="Registro real de inteligencias activas y módulos operativos."
      actions={
        <Link href="/dashboard" className="hocker-button-primary">
          Panel
        </Link>
      }
    >
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between gap-4 rounded-[28px] border border-white/5 bg-slate-950/40 p-4 sm:p-5">
          <div className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-emerald-300">
            Fuente real
          </div>
        </div>

        <Hint title="Listado en vivo">
          Esto sale de Supabase, no de un demo local.
        </Hint>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {agis.map((agi) => {
            const meta = asMeta(agi.meta);
            const load = typeof meta.load === "string" ? meta.load : "0%";

            return (
              <article key={agi.id} className="hocker-panel-pro p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-black text-white">
                      {agi.name ?? agi.id}
                    </h3>
                    <p className="mt-1 text-[11px] text-slate-400">
                      {agi.description ?? "Sin descripción."}
                    </p>
                  </div>

                  <span className="rounded-full border border-sky-500/20 bg-sky-500/10 px-2.5 py-1 text-[9px] font-black uppercase text-sky-300">
                    {agi.version ?? "—"}
                  </span>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
                  <div className="h-1.5 overflow-hidden rounded-full bg-black/50">
                    <div
                      className="h-full rounded-full bg-sky-500 shadow-[0_0_10px_#0ea5ff]"
                      style={{ width: load }}
                    />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-sky-400">
                    {load}
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {(agi.tags ?? []).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-slate-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-3">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                      Carga
                    </p>
                    <p className="mt-1 text-xs text-slate-100">{load}</p>
                  </div>
                  <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-3">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                      Creada
                    </p>
                    <p className="mt-1 text-xs text-slate-100">{safeDate(agi.created_at)}</p>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      </div>
    </PageShell>
  );
}