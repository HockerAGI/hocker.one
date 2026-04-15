"use client";

import React, { useEffect, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase-browser";

type SystemState = "online" | "syncing" | "error";

export default function SystemStatus() {
  const [status, setStatus] = useState<SystemState>("online");
  const [activeTasks, setActiveTasks] = useState(0);

  useEffect(() => {
    const supabase = createBrowserSupabase();

    // Suscripción silenciosa en tiempo real. 0 consumo pasivo de red.
    const channel = supabase.channel('system_status_metrics')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'commands' },
        () => {
          setStatus("syncing");
          setActiveTasks((prev) => prev + 1);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'commands' },
        (payload) => {
          if (payload.new.status === 'done' || payload.new.status === 'error') {
            setActiveTasks((prev) => Math.max(0, prev - 1));
          }
        }
      )
      .subscribe();

    return () => {
      // Limpieza táctica en desmontaje para evitar fugas
      supabase.removeChannel(channel);
    };
  }, []);

  // Auto-regulador: Si no hay tareas activas, el estado vuelve a normal.
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (activeTasks === 0 && status === "syncing") {
      timeout = setTimeout(() => setStatus("online"), 1500);
    }
    return () => clearTimeout(timeout);
  }, [activeTasks, status]);

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-slate-900/40 border border-slate-700/50 rounded-lg backdrop-blur-sm transition-all duration-300">
      <div className="relative flex items-center justify-center">
        <div className={`w-2.5 h-2.5 rounded-full transition-colors duration-300 ${
          status === 'online' ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.6)]' : 
          status === 'syncing' ? 'bg-cyan-400 animate-pulse shadow-[0_0_12px_rgba(34,211,238,0.8)]' : 
          'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]'
        }`} />
        {status === 'syncing' && (
          <div className="absolute w-4 h-4 rounded-full border border-cyan-400/50 animate-ping" />
        )}
      </div>
      
      <div className="flex flex-col">
        <span className="text-[10px] font-semibold tracking-widest text-slate-400 uppercase">
          Estado del Núcleo
        </span>
        <span className={`text-xs font-mono tracking-wide ${
          status === 'online' ? 'text-blue-100' : 
          status === 'syncing' ? 'text-cyan-200' : 
          'text-red-200'
        }`}>
          {status === 'online' ? 'ÓPTIMO EN LÍNEA' : 
           status === 'syncing' ? `PROCESANDO (${activeTasks})` : 
           'ANOMALÍA DETECTADA'}
        </span>
      </div>
    </div>
  );
}