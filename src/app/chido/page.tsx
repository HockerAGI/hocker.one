import type { Metadata } from "next";
import Link from "next/link";
import {
  Activity,
  Bot,
  Dices,
  DollarSign,
  ShieldAlert,
  Users,
  TrendingUp,
  LayoutDashboard,
  Settings,
  CheckSquare,
  ArrowRight,
  CircleDot,
  Wallet,
} from "lucide-react";
import { createAdminSupabase } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Chido Casino · Hocker ONE",
  description: "Panel de administración y monitoreo de Chido Casino.",
  robots: { index: false, follow: false },
};

async function loadChidoOverview() {
  const sb = createAdminSupabase();
  const [
    { count: players },
    { count: pendingDeposits },
    { count: pendingWithdrawals },
    { count: pendingKyc },
    { count: fraudEvents },
    { data: settings },
    { data: cashbackTiers },
  ] = await Promise.all([
    sb.from("profiles").select("*", { count: "exact", head: true }),
    sb.from("manual_deposit_requests").select("*", { count: "exact", head: true }).eq("status", "pending"),
    sb.from("withdraw_requests").select("*", { count: "exact", head: true }).eq("status", "pending"),
    sb.from("kyc_requests").select("*", { count: "exact", head: true }).eq("status", "pending"),
    sb.from("fraud_events").select("*", { count: "exact", head: true }),
    sb.from("casino_settings").select("*").limit(1).maybeSingle(),
    sb.from("cashback_tiers").select("*").order("min_xp"),
  ]);
  return {
    players: players ?? 0,
    pendingDeposits: pendingDeposits ?? 0,
    pendingWithdrawals: pendingWithdrawals ?? 0,
    pendingKyc: pendingKyc ?? 0,
    fraudEvents: fraudEvents ?? 0,
    settings: settings as Record<string, unknown> | null,
    cashbackTiers: (cashbackTiers ?? []) as Record<string, unknown>[],
  };
}

export default async function ChidoPage() {
  const data = await loadChidoOverview();

  const hasAlerts = data.pendingDeposits > 0 || data.pendingWithdrawals > 0 || data.pendingKyc > 0 || data.fraudEvents > 0;

  const quickLinks = [
    { href: "/chido/dashboard", icon: LayoutDashboard, label: "Dashboard completo", desc: "Métricas y tablas en tiempo real" },
    { href: "/chido/approvals", icon: CheckSquare, label: "Aprobaciones", desc: "Acciones pendientes de revisión", badge: data.pendingDeposits + data.pendingWithdrawals },
    { href: "/chido/actions", icon: Activity, label: "Dry-run / Acciones", desc: "Simulación y ejecución controlada" },
    { href: "/chido/signatures", icon: ShieldAlert, label: "Firmas", desc: "Verificación HMAC de comandos" },
    { href: "/chido/preflight", icon: CircleDot, label: "Preflight", desc: "Checklist antes de ejecutar" },
    { href: "/chido/ops", icon: Settings, label: "Operaciones", desc: "Config, mantenimiento, soporte" },
    { href: "/chido/admin", icon: Users, label: "Admin", desc: "Panel administrativo completo" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2.5 text-xl font-black tracking-tight text-slate-100">
            <Dices className="h-5 w-5 text-sky-300" />
            Chido Casino
          </h1>
          <p className="mt-0.5 text-[11px] text-slate-500">
            Panel de administración y monitoreo integrado · Hocker ONE
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-400/20 bg-emerald-400/8 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Operativo
          </span>
          <a
            href="https://chidocasino.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-1.5 text-[10px] font-bold text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-slate-200"
          >
            Ver sitio <ArrowRight className="h-3 w-3" />
          </a>
        </div>
      </div>

      {/* Alerts */}
      {hasAlerts && (
        <div className="rounded-[18px] border border-amber-400/20 bg-amber-400/8 p-4">
          <p className="mb-2 text-[10px] font-black uppercase tracking-[0.22em] text-amber-300">
            Requiere atención
          </p>
          <div className="flex flex-wrap gap-3">
            {data.pendingDeposits > 0 && (
              <Link href="/chido/dashboard" className="inline-flex items-center gap-1.5 rounded-xl border border-amber-400/20 bg-amber-400/8 px-3 py-1.5 text-[11px] font-bold text-amber-200 transition-colors hover:bg-amber-400/12">
                <DollarSign className="h-3.5 w-3.5" />
                {data.pendingDeposits} depósito{data.pendingDeposits !== 1 ? "s" : ""} pendiente{data.pendingDeposits !== 1 ? "s" : ""}
              </Link>
            )}
            {data.pendingWithdrawals > 0 && (
              <Link href="/chido/dashboard" className="inline-flex items-center gap-1.5 rounded-xl border border-amber-400/20 bg-amber-400/8 px-3 py-1.5 text-[11px] font-bold text-amber-200 transition-colors hover:bg-amber-400/12">
                <Wallet className="h-3.5 w-3.5" />
                {data.pendingWithdrawals} retiro{data.pendingWithdrawals !== 1 ? "s" : ""} por aprobar
              </Link>
            )}
            {data.pendingKyc > 0 && (
              <Link href="/chido/dashboard" className="inline-flex items-center gap-1.5 rounded-xl border border-amber-400/20 bg-amber-400/8 px-3 py-1.5 text-[11px] font-bold text-amber-200 transition-colors hover:bg-amber-400/12">
                <Users className="h-3.5 w-3.5" />
                {data.pendingKyc} KYC{data.pendingKyc !== 1 ? "s" : ""} pendiente{data.pendingKyc !== 1 ? "s" : ""}
              </Link>
            )}
            {data.fraudEvents > 0 && (
              <Link href="/chido/dashboard" className="inline-flex items-center gap-1.5 rounded-xl border border-red-400/20 bg-red-400/8 px-3 py-1.5 text-[11px] font-bold text-red-300 transition-colors hover:bg-red-400/12">
                <ShieldAlert className="h-3.5 w-3.5" />
                {data.fraudEvents} evento{data.fraudEvents !== 1 ? "s" : ""} de fraude
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Metrics overview */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Jugadores", value: data.players, icon: Users, color: "sky" },
          { label: "Dep. pendientes", value: data.pendingDeposits, icon: DollarSign, color: data.pendingDeposits > 0 ? "amber" : "slate" },
          { label: "Retiros pendientes", value: data.pendingWithdrawals, icon: TrendingUp, color: data.pendingWithdrawals > 0 ? "amber" : "slate" },
          { label: "KYC pendiente", value: data.pendingKyc, icon: ShieldAlert, color: data.pendingKyc > 0 ? "amber" : "slate" },
        ].map((m) => (
          <div key={m.label} className="rounded-[18px] border border-white/[0.07] bg-[#07101f] p-4">
            <div className={`mb-2 inline-flex h-8 w-8 items-center justify-center rounded-xl ${
              m.color === "sky" ? "bg-sky-400/12 text-sky-300" :
              m.color === "amber" ? "bg-amber-400/12 text-amber-300" :
              "bg-white/[0.04] text-slate-500"
            }`}>
              <m.icon className="h-4 w-4" />
            </div>
            <p className="text-2xl font-black text-slate-100">{m.value}</p>
            <p className="mt-0.5 text-[10px] font-semibold text-slate-500">{m.label}</p>
          </div>
        ))}
      </div>

      {/* Quick links grid */}
      <div>
        <p className="mb-3 text-[9px] font-black uppercase tracking-[0.26em] text-slate-600">Módulos</p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {quickLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group flex items-center gap-3.5 rounded-[16px] border border-white/[0.06] bg-white/[0.02] p-4 transition-all hover:border-sky-400/15 hover:bg-sky-400/5"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] border border-white/[0.07] bg-white/[0.03] transition-colors group-hover:border-sky-400/20 group-hover:bg-sky-400/10">
                <item.icon className="h-4 w-4 text-slate-400 transition-colors group-hover:text-sky-300" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-[12px] font-bold text-slate-200 group-hover:text-slate-100">{item.label}</p>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-amber-400 px-1 text-[8px] font-black text-black">
                      {item.badge}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 truncate text-[10px] text-slate-600">{item.desc}</p>
              </div>
              <ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-700 transition-colors group-hover:text-sky-400/60" />
            </Link>
          ))}
        </div>
      </div>

      {/* AGIs responsables + NOVA chat directo */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* AGIs */}
        <div className="lg:col-span-2 rounded-[18px] border border-white/[0.07] bg-[#07101f] p-5">
          <p className="mb-4 text-[9px] font-black uppercase tracking-[0.26em] text-slate-600">AGIs responsables</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {[
              { id: "CHIDO_GERENTE", label: "Chido Gerente", role: "Operación" },
              { id: "CHIDO_WINS", label: "Chido Wins", role: "Predicción / Riesgo" },
              { id: "NUMIA", label: "NUMIA", role: "Finanzas" },
              { id: "VERTX", label: "VERTX", role: "Seguridad" },
              { id: "JURIX", label: "JURIX", role: "Cumplimiento" },
              { id: "NOVA", label: "NOVA", role: "Dirección central" },
            ].map((agi) => (
              <div key={agi.id} className="flex items-center gap-3 rounded-[12px] border border-white/[0.05] bg-white/[0.02] px-3.5 py-2.5">
                <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400" />
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-slate-200">{agi.label}</p>
                  <p className="text-[9px] text-slate-600">{agi.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* NOVA shortcut */}
        <div className="rounded-[18px] border border-sky-400/12 bg-gradient-to-b from-sky-400/8 to-transparent p-5">
          <div className="mb-3 flex items-center gap-2.5">
            <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] bg-sky-400/15">
              <Bot className="h-4.5 w-4.5 text-sky-300" />
              <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#07101f] bg-emerald-400" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-sky-200">NOVA</p>
              <p className="text-[10px] text-slate-500">Activa</p>
            </div>
          </div>
          <p className="mb-4 text-[11px] leading-relaxed text-slate-400">
            Habla directamente con NOVA para gestionar Chido Casino, aprobar acciones o pedir reportes en tiempo real.
          </p>
          <Link
            href="/chat"
            className="flex w-full items-center justify-center gap-2 rounded-[14px] border border-sky-400/25 bg-sky-400/10 py-2.5 text-[10px] font-black uppercase tracking-[0.18em] text-sky-300 transition-colors hover:bg-sky-400/15"
          >
            <Bot className="h-3.5 w-3.5" />
            Abrir NOVA
          </Link>
        </div>
      </div>
    </div>
  );
}
