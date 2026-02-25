"use client";

import React, { useEffect, useState } from "react";
import AppNav from "@/components/AppNav";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);

  // Simulamos carga de telemetría de la Matriz
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen bg-hocker-900 text-slate-200">
      <AppNav />
      
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Centro de Mando Operativo</h1>
            <p className="mt-1 text-sm text-slate-400">Telemetría unificada de Hocker Ads, ChidoCasino y Seguridad AGI.</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
              </span>
              NOVA AGI Online
            </span>
            <span className="flex items-center gap-2 rounded-full border border-hocker-cyan/30 bg-hocker-cyan/10 px-3 py-1 text-xs font-medium text-hocker-cyan">
              Modo Fantasma Activo
            </span>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-32 animate-pulse rounded-2xl bg-hocker-800"></div>
            ))}
          </div>
        ) : (
          <div className="space-y-8">
            
            {/* SECCIÓN: HOCKER ADS (Marketing & Ventas) */}
            <section>
              <h2 className="mb-4 text-lg font-bold text-white border-b border-hocker-800 pb-2">Hocker Ads (Candy & REVIA)</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <MetricCard title="ROAS Global" value="4.2x" trend="+12% vs ayer" color="text-emerald-400" />
                <MetricCard title="Costo por Lead (CPL)" value="$12.50 MXN" trend="-5% vs ayer" color="text-emerald-400" />
                <MetricCard title="Creativos Ganadores" value="8" subtitle="Rotación activa por Candy" color="text-hocker-blue" />
                <MetricCard title="Conversión REVIA" value="22%" subtitle="Cierres en WhatsApp" color="text-white" />
              </div>
            </section>

            {/* SECCIÓN: CHIDOCASINO (Arbitraje y Rentabilidad) */}
            <section>
              <h2 className="mb-4 text-lg font-bold text-hocker-gold border-b border-hocker-800 pb-2">ChidoCasino & Chido Wins</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <MetricCard title="Retención D1 / D7" value="45% / 18%" subtitle="Cohorte actual" color="text-hocker-gold" />
                <MetricCard title="ARPU Activo" value="$450.00" trend="+2% vs mes" color="text-emerald-400" />
                <MetricCard title="Profit Skimming (Numia)" value="$12,450" subtitle="Retiros orgánicos hoy" color="text-emerald-400" />
                <MetricCard title="Edge Matemático" value="+4.5%" subtitle="Ventaja Chido Wins" color="text-white" />
              </div>
            </section>

            {/* SECCIÓN: SEGURIDAD Y OPSEC (Nexpa, Vertx, Hostia) */}
            <section>
              <h2 className="mb-4 text-lg font-bold text-red-400 border-b border-hocker-800 pb-2">Supervisión y Seguridad (OpSec)</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-2xl border border-hocker-800 bg-hocker-800/50 p-5">
                  <div className="text-sm font-semibold text-slate-400">NEXPA Flags (Riesgo Baneo)</div>
                  <div className="mt-2 flex items-baseline gap-2 text-3xl font-bold text-emerald-400">
                    0 <span className="text-sm font-medium text-slate-500">Alertas</span>
                  </div>
                  <div className="mt-1 text-xs text-slate-400">Mouse jitter y horarios orgánicos: OK</div>
                </div>
                <div className="rounded-2xl border border-hocker-800 bg-hocker-800/50 p-5">
                  <div className="text-sm font-semibold text-slate-400">Rotación VERTX</div>
                  <div className="mt-2 text-xl font-bold text-white">12 Proxies Activos</div>
                  <div className="mt-1 text-xs text-slate-400">Fingerprint canvas camuflado.</div>
                </div>
                <div className="rounded-2xl border border-hocker-800 bg-hocker-800/50 p-5">
                  <div className="text-sm font-semibold text-slate-400">Hostia Uptime</div>
                  <div className="mt-2 text-xl font-bold text-emerald-400">99.99%</div>
                  <div className="mt-1 text-xs text-slate-400">Latencia promedio: 45ms</div>
                </div>
              </div>
            </section>

          </div>
        )}
      </main>
    </div>
  );
}

function MetricCard({ title, value, subtitle, trend, color }: any) {
  return (
    <div className="rounded-2xl border border-hocker-800 bg-hocker-800/30 p-5 backdrop-blur-sm transition-all hover:bg-hocker-800/50">
      <div className="text-sm font-medium text-slate-400">{title}</div>
      <div className={`mt-2 text-2xl font-bold ${color}`}>{value}</div>
      {trend && <div className="mt-1 text-xs font-medium text-emerald-400">{trend}</div>}
      {subtitle && <div className="mt-1 text-xs text-slate-500">{subtitle}</div>}
    </div>
  );
}