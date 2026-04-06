import type { Metadata } from "next";
import PageShell from "@/components/PageShell";
import Hint from "@/components/Hint";
import BrandMark from "@/components/BrandMark";
import { createAdminSupabase } from "@/lib/supabase-admin";
import type { AgiRow } from "@/lib/types";

export const metadata: Metadata = {
  title: "AGIs",
  description: "Registro operativo de inteligencias del ecosistema.",
};

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
      title="AGIs"
      subtitle="Registro real de inteligencias activas y módulos operativos."
    >
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between gap-4 rounded-[28px] border border-white/5 bg-slate-950/40 p-4 sm:p-5">
          <BrandMark compact />
          <div className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-emerald-300">
            Fuente real
          </div>
        </div>

        <Hint title="Registro real">
          Este listado sale desde Supabase, no desde simulación local.
        </Hint>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {agis.map((agi) => (
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
            </article>
          ))}
        </section>
      </div>
    </PageShell>
  );
}