import type { Metadata } from "next";
import Link from "next/link";
import Hint from "@/components/Hint";
import PageShell from "@/components/PageShell";
import { createAdminSupabase } from "@/lib/supabase-admin";
import type { AgiRow, JsonObject, JsonValue } from "@/lib/types";

export const metadata: Metadata = {
  title: "AGIs · Hocker ONE",
  description: "Registro operativo real de inteligencias del ecosistema HOCKER.",
};

function asMeta(value: unknown): JsonObject {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonObject)
    : {};
}

function asString(value: JsonValue | undefined, fallback = "—"): string {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function asNumber(value: JsonValue | undefined, fallback = 99): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asStringArray(value: JsonValue | undefined): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

function safeDate(input: string): string {
  const d = new Date(input);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("es-MX");
}

function statusLabel(status: string): string {
  if (status === "active") return "Activa";
  if (status === "guarded") return "Protegida";
  if (status === "planned") return "Planeada";
  return status || "Sin estado";
}

function statusClass(status: string): string {
  if (status === "active") {
    return "border-emerald-400/20 bg-emerald-500/10 text-emerald-300";
  }

  if (status === "guarded") {
    return "border-amber-400/20 bg-amber-500/10 text-amber-300";
  }

  if (status === "planned") {
    return "border-slate-400/20 bg-slate-500/10 text-slate-300";
  }

  return "border-sky-400/20 bg-sky-500/10 text-sky-300";
}

async function loadAgis(): Promise<AgiRow[]> {
  const sb = createAdminSupabase();

  const { data, error } = await sb
    .from("agis")
    .select("id, name, description, version, tags, meta, created_at")
    .limit(100);

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as AgiRow[]).sort((a, b) => {
    const am = asMeta(a.meta);
    const bm = asMeta(b.meta);

    const ap = asNumber(am.priority, 99);
    const bp = asNumber(bm.priority, 99);

    if (ap !== bp) return ap - bp;

    return String(a.name ?? a.id).localeCompare(String(b.name ?? b.id), "es");
  });
}

export default async function AgisPage() {
  const agis = await loadAgis();

  const activeCount = agis.filter((agi) => asString(asMeta(agi.meta).status, "") === "active").length;
  const guardedCount = agis.filter((agi) => asString(asMeta(agi.meta).status, "") === "guarded").length;
  const plannedCount = agis.filter((agi) => asString(asMeta(agi.meta).status, "") === "planned").length;

  return (
    <PageShell
      title="AGIs"
      subtitle="Registro operativo real de inteligencias, misiones, límites y funciones del ecosistema HOCKER."
      actions={
        <Link href="/dashboard" className="hocker-button-primary">
          Panel
        </Link>
      }
    >
      <div className="flex flex-col gap-6">
        <section className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <div className="hocker-panel-pro p-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">
              Total
            </p>
            <p className="mt-1 text-2xl font-black text-white">{agis.length}</p>
          </div>

          <div className="hocker-panel-pro p-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-emerald-400">
              Activas
            </p>
            <p className="mt-1 text-2xl font-black text-white">{activeCount}</p>
          </div>

          <div className="hocker-panel-pro p-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-amber-400">
              Protegidas
            </p>
            <p className="mt-1 text-2xl font-black text-white">{guardedCount}</p>
          </div>

          <div className="hocker-panel-pro p-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
              Planeadas
            </p>
            <p className="mt-1 text-2xl font-black text-white">{plannedCount}</p>
          </div>
        </section>

        <Hint title="Fuente real">
          Este registro sale de Supabase. NOVA usa este mapa para ordenar apoyos, límites y funciones de cada AGI.
        </Hint>

        <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          {agis.map((agi) => {
            const meta = asMeta(agi.meta);
            const status = asString(meta.status, "unknown");
            const ownerArea = asString(meta.owner_area);
            const mission = asString(meta.mission, agi.description ?? "Sin misión registrada.");
            const objectives = asStringArray(meta.objectives);
            const functions = asStringArray(meta.functions);
            const limits = asStringArray(meta.limits);
            const commands = asStringArray(meta.allowed_commands);
            const priority = asNumber(meta.priority, 99);
            const kind = asString(meta.kind);
            const parent = asString(meta.parent_id, "NOVA");

            return (
              <article key={agi.id} className="hocker-panel-pro p-5">
                <div className="flex flex-col gap-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-black text-white">
                          {agi.name ?? agi.id}
                        </h3>

                        <span className={`rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-widest ${statusClass(status)}`}>
                          {statusLabel(status)}
                        </span>
                      </div>

                      <p className="mt-1 text-[11px] font-bold uppercase tracking-widest text-slate-500">
                        {ownerArea} · prioridad {priority}
                      </p>
                    </div>

                    <span className="rounded-full border border-sky-500/20 bg-sky-500/10 px-2.5 py-1 text-[9px] font-black uppercase text-sky-300">
                      {agi.version ?? "—"}
                    </span>
                  </div>

                  <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                      Misión
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-200">
                      {mission}
                    </p>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                        Objetivos
                      </p>
                      <ul className="mt-3 space-y-2">
                        {objectives.slice(0, 4).map((item) => (
                          <li key={item} className="text-xs leading-5 text-slate-300">
                            • {item}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                        Funciones
                      </p>
                      <ul className="mt-3 space-y-2">
                        {functions.slice(0, 4).map((item) => (
                          <li key={item} className="text-xs leading-5 text-slate-300">
                            • {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-red-400/10 bg-red-500/[0.04] p-4">
                    <p className="text-[9px] font-black uppercase tracking-widest text-red-300">
                      Límites
                    </p>
                    <ul className="mt-3 space-y-2">
                      {limits.slice(0, 4).map((item) => (
                        <li key={item} className="text-xs leading-5 text-slate-300">
                          • {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                        Jerarquía
                      </p>
                      <p className="mt-2 text-xs text-slate-300">
                        Tipo: <strong className="text-white">{kind}</strong>
                      </p>
                      <p className="mt-1 text-xs text-slate-300">
                        Depende de: <strong className="text-white">{parent}</strong>
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                        Creada
                      </p>
                      <p className="mt-2 text-xs text-slate-100">{safeDate(agi.created_at)}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {(agi.tags ?? []).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-slate-300"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {commands.length > 0 ? (
                    <div className="flex flex-wrap gap-2 border-t border-white/5 pt-4">
                      {commands.map((command) => (
                        <span
                          key={command}
                          className="rounded-lg border border-cyan-400/10 bg-cyan-500/10 px-2.5 py-1 text-[9px] font-black text-cyan-200"
                        >
                          {command}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              </article>
            );
          })}
        </section>
      </div>
    </PageShell>
  );
}
