"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

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
    <div className="min-h-screen bg-[#050505] p-6 text-white sm:p-8">
      <header className="mb-8 flex flex-col gap-4 border-b border-sky-400/20 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.35em] text-sky-300">JURIX</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">Panel de auditoría</h1>
          <p className="mt-2 text-sm text-slate-400">Control legal, trazabilidad y revisión operativa.</p>
        </div>

        <button
          type="button"
          onClick={() => router.push("/admin/jurix/export")}
          className="rounded-2xl bg-sky-400 px-5 py-3 text-xs font-black uppercase tracking-[0.25em] text-slate-950 hover:bg-white"
        >
          Exportar
        </button>
      </header>

      {loading ? (
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 text-sm text-slate-400">
          Cargando lectura JURIX...
        </div>
      ) : errorMessage ? (
        <div className="rounded-3xl border border-rose-400/20 bg-rose-500/10 p-6 text-sm text-rose-200">
          {errorMessage}
        </div>
      ) : (
        <main className="space-y-6">
          <section className="grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Nodos activos</p>
              <p className="mt-3 text-4xl font-black">{systemStats.activeNodes}</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Comandos pendientes</p>
              <p className="mt-3 text-4xl font-black">{systemStats.pendingCommands}</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Proyectos</p>
              <p className="mt-3 text-4xl font-black">{systemStats.totalProjects}</p>
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-black">Últimos registros</h2>
              <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-400">
                {recentLogs.length} items
              </span>
            </div>

            <div className="space-y-3">
              {recentLogs.length === 0 ? (
                <p className="text-sm text-slate-500">Sin registros recientes.</p>
              ) : (
                recentLogs.map((log, index) => (
                  <div key={log.id ?? index} className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                    <p className="text-sm font-bold text-white">{log.action ?? log.message ?? "Registro"}</p>
                    <p className="mt-1 text-xs text-slate-500">{log.created_at ?? "sin fecha"}</p>
                  </div>
                ))
              )}
            </div>
          </section>
        </main>
      )}
    </div>
  );
}

