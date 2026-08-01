"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Bell,
  Bot,
  CheckCircle,
  Loader2,
  Search,
  X,
  XCircle,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import HealthIndicator from "@/components/HealthIndicator";
import { getHockerRouteTitle } from "@/lib/hocker-navigation";

type PendingAction = {
  id: string;
  title?: string;
  action_type?: string;
  tool_key?: string | null;
  risk_level?: string;
  created_at: string;
  payload?: Record<string, unknown>;
};

export default function Topbar() {
  const pathname = usePathname() || "/owner";
  const title = getHockerRouteTitle(pathname);
  const [showApprovals, setShowApprovals] = useState(false);
  const [pendingActions, setPendingActions] = useState<PendingAction[]>([]);
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchPending = useCallback(async () => {
    try {
      const res = await fetch("/api/agi/runtime/actions?status=needs_approval", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json() as { actions?: PendingAction[] };
        setPendingActions(Array.isArray(data.actions) ? data.actions : []);
      }
    } catch {
      // The header remains usable if the approval counter is offline.
    }
  }, []);

  useEffect(() => {
    void fetchPending();
    const id = setInterval(() => { void fetchPending(); }, 20_000);
    return () => clearInterval(id);
  }, [fetchPending]);

  useEffect(() => {
    setShowApprovals(false);
  }, [pathname]);

  const handleDecision = useCallback(async (id: string, decision: "approve" | "reject") => {
    setProcessing(id);
    try {
      await fetch("/api/agi/runtime/actions/decision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action_id: id, decision }),
      });
      await fetchPending();
    } catch {
      // The detailed Owner view remains available for retry and evidence.
    } finally {
      setProcessing(null);
    }
  }, [fetchPending]);

  function triggerPalette() {
    window.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "k",
        metaKey: true,
        ctrlKey: !navigator.platform.includes("Mac"),
        bubbles: true,
      }),
    );
  }

  const count = pendingActions.length;

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-[90] border-b border-white/[0.06] bg-[#030711]/92 backdrop-blur-2xl lg:left-[290px]">
        <div className="mx-auto flex h-16 w-full max-w-[1800px] items-center gap-2 px-3 sm:gap-3 sm:px-4 lg:h-[60px]">
          <Link
            href="/owner"
            className="flex h-10 w-[96px] shrink-0 items-center justify-center rounded-[14px] border border-white/[0.07] bg-white/[0.03] transition-colors hover:bg-white/[0.05] sm:w-[110px]"
            aria-label="Ir al inicio"
          >
            <Image
              src="/brand/hocker-one-logo.png"
              alt="Hocker ONE"
              className="max-h-7 w-[78px] object-contain sm:w-[88px]"
              width={88}
              height={28}
              priority
            />
          </Link>

          <div className="min-w-0 flex-1">
            <p className="truncate text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 sm:text-[11px] sm:tracking-[0.22em]">
              {title}
            </p>
            <div className="mt-0.5 hidden sm:block lg:hidden">
              <HealthIndicator />
            </div>
          </div>

          <div className="hidden flex-1 items-center gap-2 overflow-hidden lg:flex">
            <HealthIndicator />
          </div>

          <nav className="flex shrink-0 items-center gap-1.5" aria-label="Accesos rápidos">
            <button
              type="button"
              onClick={triggerPalette}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-slate-100"
              aria-label="Buscar en Hocker ONE"
            >
              <Search className="h-4 w-4" />
              <span className="hidden text-[10px] font-bold tracking-[0.12em] xl:inline">Buscar</span>
              <kbd className="hidden rounded border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[8px] font-black text-slate-500 2xl:inline">⌘K</kbd>
            </button>

            <Link
              href="/chat"
              className={[
                "inline-flex h-10 items-center justify-center gap-2 rounded-xl border px-3 transition-colors",
                pathname === "/chat"
                  ? "border-sky-400/30 bg-sky-400/14 text-sky-200"
                  : "border-sky-400/18 bg-sky-400/8 text-sky-300 hover:bg-sky-400/12",
              ].join(" ")}
              aria-label="Abrir NOVA"
            >
              <Bot className="h-4 w-4" />
              <span className="hidden text-[10px] font-bold tracking-[0.12em] sm:inline">NOVA</span>
            </Link>

            <button
              type="button"
              onClick={() => setShowApprovals((current) => !current)}
              className={[
                "relative inline-flex h-10 w-10 items-center justify-center rounded-xl border transition-colors",
                count > 0
                  ? "border-amber-400/25 bg-amber-400/10 text-amber-300 hover:bg-amber-400/15"
                  : "border-white/[0.07] bg-white/[0.03] text-slate-500 hover:bg-white/[0.06] hover:text-slate-300",
              ].join(" ")}
              aria-label={`${count} aprobaciones pendientes`}
              aria-expanded={showApprovals}
            >
              <Bell className="h-4 w-4" />
              {count > 0 ? (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-amber-400 px-1 text-[8px] font-black text-black">
                  {count}
                </span>
              ) : null}
            </button>
          </nav>
        </div>
      </header>

      {showApprovals ? (
        <div className="fixed inset-x-3 top-[72px] z-[110] overflow-hidden rounded-[22px] border border-white/[0.08] bg-[#050d1a]/98 shadow-[0_24px_64px_rgba(0,0,0,0.6)] backdrop-blur-2xl lg:left-auto lg:right-4 lg:top-[68px] lg:w-[400px]">
          <div className="flex items-start justify-between gap-4 border-b border-white/[0.06] px-5 py-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-amber-300">
                Aprobaciones pendientes
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                {count === 0 ? "No hay decisiones esperando." : `${count} acción${count !== 1 ? "es" : ""} requiere${count === 1 ? "" : "n"} tu decisión.`}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowApprovals(false)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.03] text-slate-500 transition-colors hover:bg-white/[0.06] hover:text-slate-300"
              aria-label="Cerrar aprobaciones"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="max-h-[min(56dvh,440px)] overflow-y-auto hko-sidebar-scroll">
            {count === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10">
                <CheckCircle className="h-8 w-8 text-emerald-500/50" />
                <p className="text-[11px] text-slate-500">Todo al día</p>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.04]">
                {pendingActions.map((action) => (
                  <article key={action.id} className="px-5 py-4">
                    <p className="text-[12px] font-bold text-slate-200">
                      {action.title || action.action_type || "Acción AGI"}
                    </p>
                    <p className="mt-1 text-[10px] leading-5 text-slate-500">
                      {[action.action_type, action.tool_key, action.risk_level].filter(Boolean).join(" · ")}
                    </p>
                    <p className="mt-1 text-[9px] text-slate-700">
                      {new Date(action.created_at).toLocaleString("es-MX")}
                    </p>

                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        disabled={processing === action.id}
                        onClick={() => { void handleDecision(action.id, "approve"); }}
                        className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-emerald-400/25 bg-emerald-400/10 px-3 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-300 transition-colors hover:bg-emerald-400/15 disabled:opacity-50"
                      >
                        {processing === action.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3" />}
                        Aprobar
                      </button>
                      <button
                        type="button"
                        disabled={processing === action.id}
                        onClick={() => { void handleDecision(action.id, "reject"); }}
                        className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-red-400/20 bg-red-400/8 px-3 text-[10px] font-black uppercase tracking-[0.14em] text-red-400 transition-colors hover:bg-red-400/12 disabled:opacity-50"
                      >
                        <XCircle className="h-3 w-3" />
                        Rechazar
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-white/[0.06] p-4">
            <Link
              href="/owner/actions"
              onClick={() => setShowApprovals(false)}
              className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-sky-400/20 bg-sky-400/8 px-4 text-[10px] font-black uppercase tracking-[0.16em] text-sky-300 transition-colors hover:bg-sky-400/12"
            >
              Ver contexto y evidencia
            </Link>
          </div>
        </div>
      ) : null}
    </>
  );
}
