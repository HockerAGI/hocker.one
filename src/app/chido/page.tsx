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
import {
  getHockerOperationalSnapshot,
  type OperationalStatus,
} from "@/lib/hocker-operational-state";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Chido Casino · Hocker ONE",
  description: "Lectura administrativa y evidencia operativa de Chido Casino.",
  robots: { index: false, follow: false, noarchive: true },
};

type ChidoOverview = {
  ok: boolean;
  error: string | null;
  checkedAt: string;
  players: number;
  pendingDeposits: number;
  pendingWithdrawals: number;
  pendingKyc: number;
  fraudEvents: number;
};

const RESPONSIBLE_AGIS = [
  ["chido-gerente", "Chido Gerente", "Operación"],
  ["chido-wins", "Chido Wins", "Predicción y riesgo"],
  ["numia", "NUMIA", "Finanzas"],
  ["vertx", "VERTX", "Seguridad"],
  ["jurix", "JURIX", "Cumplimiento"],
  ["nova", "NOVA", "Orquestación"],
] as const;

function canonical(value: string) {
  return value.trim().toLowerCase().replaceAll("_", "-");
}

function statusLabel(status: OperationalStatus) {
  if (status === "online") return "Señal verificada";
  if (status === "configured") return "Configurado";
  if (status === "stale") return "Sin señal reciente";
  if (status === "degraded") return "Degradado";
  if (status === "offline") return "Sin conexión";
  if (status === "not_created") return "Sin worker";
  return "Sin verificar";
}

function statusTone(status: OperationalStatus) {
  if (status === "online") return "border-emerald-400/20 bg-emerald-400/8 text-emerald-300";
  if (status === "configured") return "border-cyan-400/20 bg-cyan-400/8 text-cyan-300";
  if (status === "stale") return "border-amber-400/20 bg-amber-400/8 text-amber-300";
  if (status === "degraded" || status === "offline") return "border-rose-400/20 bg-rose-400/8 text-rose-300";
  return "border-white/10 bg-white/[0.04] text-slate-400";
}

function formatDate(value: string | null) {
  if (!value) return "Sin fecha";
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Tijuana",
  }).format(new Date(value));
}

async function loadChidoOverview(): Promise<ChidoOverview> {
  const checkedAt = new Date().toISOString();
  try {
    const sb = createAdminSupabase();
    const [players, deposits, withdrawals, kyc, fraud] = await Promise.all([
      sb.from("profiles").select("*", { count: "exact", head: true }),
      sb.from("manual_deposit_requests").select("*", { count: "exact", head: true }).eq("status", "pending"),
      sb.from("withdraw_requests").select("*", { count: "exact", head: true }).eq("status", "pending"),
      sb.from("kyc_requests").select("*", { count: "exact", head: true }).eq("status", "pending"),
      sb.from("fraud_events").select("*", { count: "exact", head: true }),
    ]);
    const firstError = [players.error, deposits.error, withdrawals.error, kyc.error, fraud.error].find(Boolean);
    return {
      ok: !firstError,
      error: firstError?.message ?? null,
      checkedAt,
      players: players.count ?? 0,
      pendingDeposits: deposits.count ?? 0,
      pendingWithdrawals: withdrawals.count ?? 0,
      pendingKyc: kyc.count ?? 0,
      fraudEvents: fraud.count ?? 0,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "No se pudo consultar Chido Casino.",
      checkedAt,
      players: 0,
      pendingDeposits: 0,
      pendingWithdrawals: 0,
      pendingKyc: 0,
      fraudEvents: 0,
    };
  }
}

export default async function ChidoPage() {
  const [data, operational] = await Promise.all([
    loadChidoOverview(),
    getHockerOperationalSnapshot(),
  ]);
  const chido = operational.apps.find((app) => app.key === "chido-casino");
  const chidoStatus = chido?.status ?? "unknown";
  const nova = operational.agis.find((agi) => canonical(agi.key) === "nova");
  const agiByKey = new Map(operational.agis.map((agi) => [canonical(agi.key), agi]));
  const hasAlerts = data.ok && (
    data.pendingDeposits > 0 ||
    data.pendingWithdrawals > 0 ||
    data.pendingKyc > 0 ||
    data.fraudEvents > 0
  );

  const quickLinks = [
    { href: "/chido/dashboard", icon: LayoutDashboard, label: "Dashboard completo", desc: "Métricas y tablas registradas" },
    { href: "/chido/approvals", icon: CheckSquare, label: "Aprobaciones", desc: "Acciones pendientes de revisión", badge: data.pendingDeposits + data.pendingWithdrawals },
    { href: "/chido/actions", icon: Activity, label: "Dry-run / Acciones", desc: "Simulación y ejecución controlada" },
    { href: "/chido/signatures", icon: ShieldAlert, label: "Firmas", desc: "Verificación HMAC de comandos" },
    { href: "/chido/preflight", icon: CircleDot, label: "Preflight", desc: "Checklist antes de ejecutar" },
    { href: "/chido/ops", icon: Settings, label: "Operaciones", desc: "Configuración, mantenimiento y soporte" },
    { href: "/chido/admin", icon: Users, label: "Admin", desc: "Panel administrativo" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2.5 text-xl font-black tracking-tight text-slate-100">
            <Dices className="h-5 w-5 text-sky-300" /> Chido Casino
          </h1>
          <p className="mt-1 text-[11px] text-slate-500">Lectura administrativa integrada en Hocker ONE</p>
          <p className="mt-1 text-[10px] text-slate-600">Consultado: {formatDate(data.checkedAt)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] ${statusTone(chidoStatus)}`}>
            {statusLabel(chidoStatus)}
          </span>
          <a href="https://chidocasino.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-1.5 text-[10px] font-bold text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-slate-200">
            Abrir sitio <ArrowRight className="h-3 w-3" />
          </a>
        </div>
      </div>

      <section className="rounded-[18px] border border-white/[0.07] bg-[#07101f] p-4">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Evidencia operativa</p>
        <p className="mt-2 text-sm leading-6 text-slate-300">{chido?.evidence ?? "No hay evidencia operativa disponible para este módulo."}</p>
        <p className="mt-2 text-xs text-slate-500">Última señal: {formatDate(chido?.last_activity_at ?? null)}</p>
      </section>

      {!data.ok ? (
        <section className="rounded-[18px] border border-rose-400/20 bg-rose-400/8 p-4 text-sm text-rose-200">
          La lectura de tablas de Chido no pudo verificarse. Los valores inferiores se muestran en cero y no deben interpretarse como datos reales. {data.error}
        </section>
      ) : null}

      {hasAlerts ? (
        <div className="rounded-[18px] border border-amber-400/20 bg-amber-400/8 p-4">
          <p className="mb-2 text-[10px] font-black uppercase tracking-[0.22em] text-amber-300">Registros que requieren atención</p>
          <div className="flex flex-wrap gap-3">
            {data.pendingDeposits > 0 ? <Link href="/chido/dashboard" className="inline-flex items-center gap-1.5 rounded-xl border border-amber-400/20 bg-amber-400/8 px-3 py-1.5 text-[11px] font-bold text-amber-200"><DollarSign className="h-3.5 w-3.5" />{data.pendingDeposits} depósito(s) pendientes</Link> : null}
            {data.pendingWithdrawals > 0 ? <Link href="/chido/dashboard" className="inline-flex items-center gap-1.5 rounded-xl border border-amber-400/20 bg-amber-400/8 px-3 py-1.5 text-[11px] font-bold text-amber-200"><Wallet className="h-3.5 w-3.5" />{data.pendingWithdrawals} retiro(s) pendientes</Link> : null}
            {data.pendingKyc > 0 ? <Link href="/chido/dashboard" className="inline-flex items-center gap-1.5 rounded-xl border border-amber-400/20 bg-amber-400/8 px-3 py-1.5 text-[11px] font-bold text-amber-200"><Users className="h-3.5 w-3.5" />{data.pendingKyc} KYC pendientes</Link> : null}
            {data.fraudEvents > 0 ? <Link href="/chido/dashboard" className="inline-flex items-center gap-1.5 rounded-xl border border-red-400/20 bg-red-400/8 px-3 py-1.5 text-[11px] font-bold text-red-300"><ShieldAlert className="h-3.5 w-3.5" />{data.fraudEvents} eventos registrados</Link> : null}
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Perfiles", value: data.players, icon: Users },
          { label: "Depósitos pendientes", value: data.pendingDeposits, icon: DollarSign },
          { label: "Retiros pendientes", value: data.pendingWithdrawals, icon: TrendingUp },
          { label: "KYC pendiente", value: data.pendingKyc, icon: ShieldAlert },
        ].map((metric) => (
          <div key={metric.label} className="rounded-[18px] border border-white/[0.07] bg-[#07101f] p-4">
            <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-xl bg-white/[0.04] text-slate-400"><metric.icon className="h-4 w-4" /></div>
            <p className="text-2xl font-black text-slate-100">{metric.value}</p>
            <p className="mt-0.5 text-[10px] font-semibold text-slate-500">{metric.label}</p>
          </div>
        ))}
      </div>

      <div>
        <p className="mb-3 text-[9px] font-black uppercase tracking-[0.26em] text-slate-600">Módulos</p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {quickLinks.map((item) => (
            <Link key={item.href} href={item.href} className="group flex items-center gap-3.5 rounded-[16px] border border-white/[0.06] bg-white/[0.02] p-4 transition-all hover:border-sky-400/15 hover:bg-sky-400/5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] border border-white/[0.07] bg-white/[0.03]"><item.icon className="h-4 w-4 text-slate-400" /></div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-[12px] font-bold text-slate-200">{item.label}</p>
                  {item.badge !== undefined && item.badge > 0 ? <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-amber-400 px-1 text-[8px] font-black text-black">{item.badge}</span> : null}
                </div>
                <p className="mt-0.5 truncate text-[10px] text-slate-600">{item.desc}</p>
              </div>
              <ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-700" />
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-[18px] border border-white/[0.07] bg-[#07101f] p-5 lg:col-span-2">
          <p className="mb-4 text-[9px] font-black uppercase tracking-[0.26em] text-slate-600">Perfiles responsables</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {RESPONSIBLE_AGIS.map(([key, label, role]) => {
              const state = agiByKey.get(key);
              const status = state?.status ?? "unknown";
              return (
                <div key={key} className="rounded-[12px] border border-white/[0.05] bg-white/[0.02] px-3.5 py-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-[11px] font-bold text-slate-200">{label}</p>
                      <p className="text-[9px] text-slate-600">{role}</p>
                    </div>
                    <span className={`rounded-full border px-2 py-1 text-[8px] font-black uppercase tracking-[0.1em] ${statusTone(status)}`}>{statusLabel(status)}</span>
                  </div>
                  <p className="mt-2 text-[10px] leading-4 text-slate-500">{state?.evidence ?? "Sin evidencia disponible."}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-[18px] border border-sky-400/12 bg-gradient-to-b from-sky-400/8 to-transparent p-5">
          <div className="mb-3 flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] bg-sky-400/15"><Bot className="h-4 w-4 text-sky-300" /></div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-sky-200">NOVA</p>
              <p className="text-[10px] text-slate-500">{statusLabel(nova?.status ?? "unknown")}</p>
            </div>
          </div>
          <p className="mb-4 text-[11px] leading-relaxed text-slate-400">{nova?.evidence ?? "El estado de NOVA no pudo verificarse."}</p>
          <Link href="/chat" className="flex w-full items-center justify-center gap-2 rounded-[14px] border border-sky-400/25 bg-sky-400/10 py-2.5 text-[10px] font-black uppercase tracking-[0.18em] text-sky-300 transition-colors hover:bg-sky-400/15">
            <Bot className="h-3.5 w-3.5" /> Abrir NOVA
          </Link>
        </div>
      </div>
    </div>
  );
}
