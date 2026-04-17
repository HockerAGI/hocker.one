"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

// Configuración de cliente Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

export default function JurixAdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [systemStats, setSystemStats] = useState({
    activeNodes: 0,
    pendingCommands: 0,
    totalProjects: 0,
  });
  const [recentLogs, setRecentLogs] = useState<any[]>([]);

  useEffect(() => {
    async function fetchJurixData() {
      try {
        setLoading(true);
        // Extracción de datos maestros
        const [{ count: nodesCount }, { count: cmdsCount }, { data: logsData }] = await Promise.all([
          supabase.from("nodes").select("*", { count: "exact", head: true }).eq("status", "online"),
          supabase.from("commands").select("*", { count: "exact", head: true }).eq("status", "pending"),
          supabase.from("command_logs").select("*").order("created_at", { ascending: false }).limit(10)
        ]);

        setSystemStats({
          activeNodes: nodesCount || 0,
          pendingCommands: cmdsCount || 0,
          totalProjects: 3, // hocker-one, hkr-supply, chido-casino
        });

        setRecentLogs(logsData || []);
      } catch (error) {
        console.error("[NOVA:Jurix] Error de sincronización con la matriz:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchJurixData();
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-white font-mono p-8">
      <header className="mb-8 border-b border-[#00bfff]/30 pb-4 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-widest text-[#00bfff]">JURIX_ADMIN_PANEL</h1>
          <p className="text-sm opacity-60">Operando bajo jurisdicción de HKR Supply - God Mode Activo</p>
        </div>
        <button 
          onClick={() => router.push("/admin/jurix/export")}
          className="bg-[#00bfff] text-black px-6 py-2 rounded-sm font-bold shadow-[0_0_10px_rgba(0,191,255,0.5)] hover:bg-white hover:text-black transition-all"
        >
          EXPORTAR AUDITORÍA
        </button>
      </header>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <span className="animate-pulse text-[#00bfff]">Sincronizando con nodos físicos...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Tarjeta de Estadísticas: Nodos */}
          <div className="bg-[#0a0a0a] border border-[#00bfff]/30 p-6 rounded-md shadow-lg">
            <h3 className="text-lg text-[#00bfff] mb-2">Nodos Activos</h3>
            <p className="text-4xl font-bold">{systemStats.activeNodes}</p>
            <span className="text-xs text-green-400 mt-2 block">Conexión Estable</span>
          </div>

          {/* Tarjeta de Estadísticas: Comandos */}
          <div className="bg-[#0a0a0a] border border-[#00bfff]/30 p-6 rounded-md shadow-lg">
            <h3 className="text-lg text-[#00bfff] mb-2">Comandos en Cola</h3>
            <p className="text-4xl font-bold">{systemStats.pendingCommands}</p>
            <span className="text-xs text-yellow-400 mt-2 block">Esperando ejecución</span>
          </div>

          {/* Tarjeta de Estadísticas: Proyectos */}
          <div className="bg-[#0a0a0a] border border-[#00bfff]/30 p-6 rounded-md shadow-lg">
            <h3 className="text-lg text-[#00bfff] mb-2">Proyectos (Topología)</h3>
            <p className="text-4xl font-bold">{systemStats.totalProjects}</p>
            <span className="text-xs opacity-50 mt-2 block">Ecosistema Centralizado</span>
          </div>

          {/* Panel de Logs */}
          <div className="col-span-1 md:col-span-3 mt-6">
            <div className="bg-[#0a0a0a] border border-[#00bfff]/30 p-6 rounded-md">
              <h3 className="text-xl text-[#00bfff] mb-4 border-b border-[#00bfff]/20 pb-2">Registro de Comandos (Live)</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-[#00bfff]/70">
                      <th className="py-2">ID_LOG</th>
                      <th className="py-2">NIVEL</th>
                      <th className="py-2">MENSAJE</th>
                      <th className="py-2">TIMESTAMP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentLogs.length > 0 ? (
                      recentLogs.map((log) => (
                        <tr key={log.id} className="border-b border-gray-800 hover:bg-[#00bfff]/5">
                          <td className="py-3 font-mono text-xs opacity-60">{log.id.substring(0, 8)}...</td>
                          <td className="py-3">
                            <span className={`px-2 py-1 text-xs rounded-sm ${log.level === 'error' ? 'bg-red-900/50 text-red-400' : 'bg-[#00bfff]/20 text-[#00bfff]'}`}>
                              {log.level.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-3">{log.message}</td>
                          <td className="py-3 opacity-60">{new Date(log.created_at).toLocaleString()}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-4 text-center opacity-50">No hay registros recientes en la matriz.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
