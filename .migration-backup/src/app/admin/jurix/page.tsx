"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { Download, FileText, ShieldCheck } from "lucide-react";
import PageShell from "@/components/PageShell";

type RecentLog = {
  id?: string;
  action?: string;
  message?: string;
  created_at?: string;
};

function createJurixClient() {
  const supabaseUrl = String(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
  const supabaseKey = String(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase no está configurado para JURIX.");
  }

  return createClient(supabaseUrl, supabaseKey);
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <article className="rounded-[24px] border border-white/10 bg-[#0b1526] p-5">
      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">
        {label}
      </p>
      <p className="mt-3 text-4xl font-black tracking-tight text-white">
        {value}
      </p>
    </article>
  );
}

export default function JurixAdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [systemStats, setSystemStats] = useState({
    activeNodes: 0,
    pendingCommands: 0,
    totalProjects: 0,
  });
  const [recentLogs, setRecentLogs] = useState<RecentLog[]>([]);

  useEffect(() => {
    let mounted = true;

    async function fetchJurixData() {
      try {
        setLoading(true);
        setErrorMessage("");

        const supabase = createJurixClient();

        const [
          nodesResult,
          queuedResult,
          approvalResult,
          projectsResult,
          logsResult,
        ] = await Promise.all([
          supabase.from("nodes").select("*", { count: "exact", head: true }).eq("status", "online"),
          supabase.from("commands").select("*", { count: "exact", head: true }).eq("status", "queued"),
          supabase.from("commands").select("*", { count: "exact", head: true }).eq("status", "needs_approval"),
          supabase.from("projects").select("*", { count: "exact", head: true }),
          supabase.from("command_logs").select("*").order("created_at", { ascending: false }).limit(10),
        ]);

        if (!mounted) return;

        setSystemStats({
          activeNodes: nodesResult.count ?? 0,
          pendingCommands: (queuedResult.count ?? 0) + (approvalResult.count ?? 0),
          totalProjects: projectsResult.count ?? 0,
        });

        setRecentLogs((logsResult.data ?? []) as RecentLog[]);
      } catch (error) {
        if (!mounted) return;
        const message = error instanceof Error ? error.message : String(error);
        setErrorMessage(message);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void fetchJurixData();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <PageShell
      eyebrow="JURIX"
      title="Panel de auditoría"
      description="Control legal, trazabilidad y revisión operativa con datos reales de Supabase."
      actions={
        <button
          type="button"
          onClick={() => router.push("/admin/jurix/export")}
          className="hocker-button-brand"
        >
          <Download size={16} />
          Exportar
        </button>
      }
    >
      {loading ? (
        <div className="rounded-[24px] border border-white/10 bg-[#0b1526] p-5 text-sm text-slate-400">
          Cargando lectura JURIX...
        </div>
      ) : errorMessage ? (
        <div className="rounded-[24px] border border-rose-400/20 bg-rose-500/10 p-5 text-sm text-rose-200">
          {errorMessage}
        </div>
      ) : (
        <div className="space-y-5">
          <section className="grid gap-4 md:grid-cols-3">
            <StatCard label="Nodos activos" value={systemStats.activeNodes} />
            <StatCard label="Comandos pendientes" value={systemStats.pendingCommands} />
            <StatCard label="Proyectos" value={systemStats.totalProjects} />
          </section>

          <section className="rounded-[28px] border border-white/10 bg-[#07101f] p-5">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-2xl border border-sky-300/20 bg-sky-400/10 text-sky-200">
                  <ShieldCheck size={19} />
                </div>

                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-sky-300">
                    Registro
                  </p>
                  <h2 className="mt-1 text-2xl font-black tracking-tight text-white">
                    Últimos registros
                  </h2>
                </div>
              </div>

              <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-400">
                {recentLogs.length} items
              </span>
            </div>

            <div className="space-y-3">
              {recentLogs.length === 0 ? (
                <div className="rounded-[22px] border border-white/10 bg-[#0b1526] p-4 text-sm text-slate-500">
                  Sin registros recientes.
                </div>
              ) : (
                recentLogs.map((log, index) => (
                  <article
                    key={log.id ?? index}
                    className="rounded-[22px] border border-white/10 bg-[#0b1526] p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/[0.035] text-sky-200">
                        <FileText size={17} />
                      </div>

                      <div>
                        <h3 className="text-sm font-black text-white">
                          {log.action ?? log.message ?? "Registro"}
                        </h3>
                        <p className="mt-1 text-xs text-slate-500">
                          {log.created_at ?? "sin fecha"}
                        </p>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
        </div>
      )}
    </PageShell>
  );
}
