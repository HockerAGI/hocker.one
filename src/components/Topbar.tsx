"use client";

import Link from "next/link";
import { Activity, Bell, Bot, ChevronDown, Map, X, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import HealthIndicator from "@/components/HealthIndicator";
import { useState, useEffect, useCallback } from "react";

const titles: Record<string, string> = {
  "/": "Sitio público",
  "/owner": "Inicio",
  "/map": "Mapa",
  "/live": "Sistema en vivo",
  "/dashboard": "Sistema",
  "/chat": "NOVA",
  "/apps": "Apps",
  "/agis": "AGIs",
  "/commands": "Tareas",
  "/nodes": "Nodos",
  "/governance": "Gobierno",
  "/supply": "Supply",
  "/servicios": "Servicios",
  "/security": "Seguridad",
  "/chido": "Chido Casino",
  "/integrations": "Integraciones",
  "/memory": "Memoria IA",
  "/empresa": "Empresa",
  "/launch": "Lanzamiento",
  "/mobile": "Móvil",
};

function getTitle(pathname: string) {
  const exact = titles[pathname];
  if (exact) return exact;
  const match = Object.entries(titles)
    .filter(([href]) => href !== "/" && pathname.startsWith(`${href}/`))
    .sort((a, b) => b[0].length - a[0].length)[0];
  return match?.[1] || "Hocker ONE";
}

type PendingAction = {
  id: string;
  command: string;
  description?: string;
  created_at: string;
  payload?: Record<string, unknown>;
};

export default function Topbar() {
  const pathname = usePathname() || "/";
  const title = getTitle(pathname);

  const [showApprovals, setShowApprovals] = useState(false);
  const [pendingActions, setPendingActions] = useState<PendingAction[]>([]);
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchPending = useCallback(async () => {
    try {
      const res = await fetch("/api/agi/runtime/actions?status=pending", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json() as { actions?: PendingAction[] };
        setPendingActions(Array.isArray(data.actions) ? data.actions : []);
      }
    } catch { /* silencioso */ }
  }, []);

  useEffect(() => {
    void fetchPending();
    const id = setInterval(() => { void fetchPending(); }, 20_000);
    return () => clearInterval(id);
  }, [fetchPending]);

  const handleDecision = useCallback(async (id: string, decision: "approve" | "reject") => {
    setProcessing(id);
    try {
      await fetch("/api/agi/runtime/actions/decision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action_id: id, decision }),
      });
      await fetchPending();
    } catch { /* silencioso */ } finally {
      setProcessing(null);
    }
  }, [fetchPending]);

  const count = pendingActions.length;

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-[90] hidden border-b border-white/[0.06] bg-[#030711]/95 backdrop-blur-xl lg:left-[290px] lg:block">
        <div className="mx-auto flex h-[60px] w-full max-w-[1800px] items-center gap-3 px-4">

          {/* Logo pequeño + título */}
          <div className="flex items-center gap-3">
            <Link
              href="/owner"
              className="flex h-10 w-[110px] items-center justify-center rounded-[14px] border border-white/[0.07] bg-white/[0.03] transition-colors hover:bg-white/[0.05]"
              aria-label="Ir al inicio"
            >
              <Image
                src="/brand/hocker-one-logo.png"
                alt="Hocker ONE"
                className="max-h-7 w-[88px] object-contain"
                width={88}
                height={28}
              />
            </Link>
            <strong className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">
              {title}
            </strong>
          </div>

          {/* Health + spacer */}
          <div className="flex flex-1 items-center gap-2 overflow-hidden">
            <HealthIndicator />
            <span className="hidden text-[9px] font-bold tracking-[0.2em] text-slate-700 xl:block">
              <kbd className="rounded border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[8px] font-black text-slate-500">⌘K</kbd>
              {" "}Buscar
            </span>
          </div>

          {/* Right actions */}
          <nav className="flex items-center gap-1.5" aria-label="Accesos rápidos">
            <Link
              href="/map"
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 text-[10px] font-bold tracking-[0.12em] text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-slate-200"
            >
              <Map size={14} />
              <span className="hidden xl:inline">Mapa</span>
            </Link>
            <Link
              href="/live"
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 text-[10px] font-bold tracking-[0.12em] text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-slate-200"
            >
              <Activity size={14} />
              <span className="hidden xl:inline">En vivo</span>
            </Link>
            <Link
              href="/chat"
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-sky-400/20 bg-sky-400/8 px-3 text-[10px] font-bold tracking-[0.12em] text-sky-300 transition-colors hover:bg-sky-400/12"
            >
              <Bot size={14} />
              <span className="hidden xl:inline">NOVA</span>
            </Link>

            {/* Approvals bell */}
            <button
              type="button"
              onClick={() => setShowApprovals((v) => !v)}
              className={[
                "relative inline-flex h-9 w-9 items-center justify-center rounded-xl border transition-colors",
                count > 0
                  ? "border-amber-400/25 bg-amber-400/10 text-amber-300 hover:bg-amber-400/15"
                  : "border-white/[0.07] bg-white/[0.03] text-slate-500 hover:bg-white/[0.06] hover:text-slate-300",
              ].join(" ")}
              aria-label={`${count} aprobaciones pendientes`}
            >
              <Bell size={15} />
              {count > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-amber-400 px-1 text-[8px] font-black text-black">
                  {count}
                </span>
              )}
            </button>
          </nav>
        </div>
      </header>

      {/* Approvals dropdown panel */}
      {showApprovals && (
        <div className="fixed right-4 top-[68px] z-[100] hidden w-[380px] overflow-hidden rounded-[20px] border border-white/[0.08] bg-[#050d1a]/98 shadow-[0_24px_64px_rgba(0,0,0,0.6)] backdrop-blur-2xl lg:block">
          <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-amber-300">
                Aprobaciones pendientes
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                {count === 0 ? "Sin acciones pendientes" : `${count} acción${count !== 1 ? "es" : ""} esperando tu aprobación`}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowApprovals(false)}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.03] text-slate-500 transition-colors hover:bg-white/[0.06] hover:text-slate-300"
            >
              <X size={14} />
            </button>
          </div>

          <div className="max-h-[420px] overflow-y-auto">
            {count === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10">
                <CheckCircle size={28} className="text-emerald-500/50" />
                <p className="text-[11px] text-slate-600">Todo al día</p>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.04]">
                {pendingActions.map((action) => (
                  <div key={action.id} className="px-5 py-4">
                    <div className="mb-3">
                      <p className="text-[11px] font-bold text-slate-200">{action.command}</p>
                      {action.description && (
                        <p className="mt-0.5 text-[10px] text-slate-500">{action.description}</p>
                      )}
                      <p className="mt-1 text-[9px] text-slate-700">
                        {new Date(action.created_at).toLocaleString("es-MX")}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={processing === action.id}
                        onClick={() => { void handleDecision(action.id, "approve"); }}
                        className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-emerald-400/25 bg-emerald-400/10 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-300 transition-colors hover:bg-emerald-400/15 disabled:opacity-50"
                      >
                        {processing === action.id ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <CheckCircle size={12} />
                        )}
                        Aprobar
                      </button>
                      <button
                        type="button"
                        disabled={processing === action.id}
                        onClick={() => { void handleDecision(action.id, "reject"); }}
                        className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-red-400/20 bg-red-400/8 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-red-400 transition-colors hover:bg-red-400/12 disabled:opacity-50"
                      >
                        <XCircle size={12} />
                        Rechazar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-white/[0.06] p-4">
            <Link
              href="/chat"
              onClick={() => setShowApprovals(false)}
              className="flex items-center justify-center gap-2 rounded-xl border border-sky-400/20 bg-sky-400/8 py-2.5 text-[10px] font-black uppercase tracking-[0.18em] text-sky-300 transition-colors hover:bg-sky-400/12"
            >
              <Bot size={13} />
              Abrir NOVA para contexto completo
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
