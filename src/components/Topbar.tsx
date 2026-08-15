"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Bell,
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
  const pathname = usePathname() || "/app/nova";
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
      // Header stays usable if approvals are temporarily unavailable.
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
      <header className="fixed inset-x-0 top-0 z-[90] border-b border-white/[0.055] bg-[#030711]/90 backdrop-blur-xl lg:left-[264px]">
        <div className="mx-auto flex h-16 w-full max-w-[1600px] items-center gap-3 px-3 sm:px-5 lg:h-[60px]">
          <Link
            href="/app/nova"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-[13px] border border-white/[0.065] bg-white/[0.025] transition-colors hover:bg-white/[0.05] lg:hidden"
            aria-label="Abrir NOVA"
          >
            <Image
              src="/brand/hocker-one-isotype.png"
              alt="Hocker One"
              className="h-7 w-7 object-contain"
              width={40}
              height={40}
              priority
            />
          </Link>

          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-bold tracking-[-0.01em] text-slate-200 sm:text-[14px]">
              {title}
            </p>
            <div className="mt-0.5 hidden sm:block lg:hidden">
              <HealthIndicator />
            </div>
          </div>

          <div className="hidden flex-1 items-center overflow-hidden lg:flex">
            <HealthIndicator />
          </div>

          <nav className="flex shrink-0 items-center gap-1.5" aria-label="Accesos rápidos">
            <button
              type="button"
              onClick={triggerPalette}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-white/[0.065] bg-white/[0.025] px-3 text-slate-400 transition-colors hover:bg-white/[0.05] hover:text-slate-100"
              aria-label="Buscar en Hocker One"
            >
              <Search className="h-4 w-4" />
              <span className="hidden text-[11px] font-semibold xl:inline">Buscar</span>
              <kbd className="hidden rounded border border-white/[0.07] bg-white/[0.025] px-1.5 py-0.5 text-[8px] font-bold text-slate-600 2xl:inline">⌘K</kbd>
            </button>

            <button
              type="button"
              onClick={() => setShowApprovals((current) => !current)}
              className={[
                "relative inline-flex h-10 w-10 items-center justify-center rounded-xl border transition-colors",
                count > 0
                  ? "border-amber-300/20 bg-amber-300/[0.08] text-amber-300 hover:bg-amber-300/12"
                  : "border-white/[0.065] bg-white/[0.025] text-slate-500 hover:bg-white/[0.05] hover:text-slate-300",
              ].join(" ")}
              aria-label={`${count} aprobaciones pendientes`}
              aria-expanded={showApprovals}
            >
              <Bell className="h-4 w-4" />
              {count > 0 ? (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-amber-300 px-1 text-[8px] font-black text-[#241600]">
                  {count}
                </span>
              ) : null}
            </button>
          </nav>
        </div>
      </header>

      {showApprovals ? (
        <div className="fixed inset-x-3 top-[72px] z-[110] overflow-hidden rounded-[20px] border border-white/[0.08] bg-[#07101f]/98 shadow-[0_24px_64px_rgba(0,0,0,0.55)] backdrop-blur-2xl lg:left-auto lg:right-4 lg:top-[68px] lg:w-[400px]">
          <div className="flex items-start justify-between gap-4 border-b border-white/[0.06] px-5 py-4">
            <div>
              <p className="text-[12px] font-bold text-slate-100">Aprobaciones</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                {count === 0 ? "No hay decisiones esperando." : `${count} acción${count !== 1 ? "es" : ""} requiere${count === 1 ? "" : "n"} tu decisión.`}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowApprovals(false)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.025] text-slate-500 transition-colors hover:bg-white/[0.05] hover:text-slate-300"
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
                        className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.08] px-3 text-[10px] font-bold text-emerald-300 transition-colors hover:bg-emerald-400/12 disabled:opacity-50"
                      >
                        {processing === action.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3" />}
                        Aprobar
                      </button>
                      <button
                        type="button"
                        disabled={processing === action.id}
                        onClick={() => { void handleDecision(action.id, "reject"); }}
                        className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-red-400/18 bg-red-400/[0.07] px-3 text-[10px] font-bold text-red-300 transition-colors hover:bg-red-400/10 disabled:opacity-50"
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
              className="flex min-h-11 items-center justify-center rounded-xl border border-sky-300/15 bg-sky-300/[0.06] px-4 text-[11px] font-bold text-sky-200 transition-colors hover:bg-sky-300/10"
            >
              Ver contexto
            </Link>
          </div>
        </div>
      ) : null}
    </>
  );
}
