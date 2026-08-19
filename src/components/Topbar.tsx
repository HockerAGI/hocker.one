"use client";

import Link from "next/link";
import { Bell, Bot, CheckCircle, Loader2, Search, X, XCircle } from "lucide-react";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { getHockerRouteTitle } from "@/lib/hocker-navigation";

type PendingAction = {
  id: string;
  title?: string;
  action_type?: string;
  tool_key?: string | null;
  risk_level?: string;
  created_at: string;
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
      // Header remains usable when the counter is unavailable.
    }
  }, []);

  useEffect(() => {
    void fetchPending();
    const id = setInterval(() => { void fetchPending(); }, 20_000);
    return () => clearInterval(id);
  }, [fetchPending]);
  useEffect(() => setShowApprovals(false), [pathname]);

  const handleDecision = useCallback(async (id: string, decision: "approve" | "reject") => {
    setProcessing(id);
    try {
      await fetch("/api/agi/runtime/actions/decision", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action_id: id, decision }),
      });
      await fetchPending();
    } finally {
      setProcessing(null);
    }
  }, [fetchPending]);

  function triggerPalette() {
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true, ctrlKey: !navigator.platform.includes("Mac"), bubbles: true }));
  }

  const count = pendingActions.length;
  return (
    <>
      <header className="fixed inset-x-0 top-0 z-[90] border-b border-white/[0.06] bg-[#030711]/92 backdrop-blur-2xl lg:left-[290px]">
        <div className="mx-auto flex h-16 w-full max-w-[1800px] items-center gap-2 px-3 sm:px-4 lg:h-[60px]">
          <p className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-100">{title}</p>
          <nav className="flex shrink-0 items-center gap-1.5" aria-label="Accesos rápidos">
            <button type="button" onClick={triggerPalette} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl px-3 text-slate-400 hover:bg-white/[0.05] hover:text-white" aria-label="Buscar">
              <Search className="h-4 w-4" /><span className="hidden text-xs sm:inline">Buscar</span>
            </button>
            {pathname !== "/chat" ? (
              <Link href="/chat" className="inline-flex h-10 items-center justify-center gap-2 rounded-xl px-3 text-sky-300 hover:bg-sky-400/10" aria-label="Abrir NOVA">
                <Bot className="h-4 w-4" /><span className="hidden text-xs sm:inline">NOVA</span>
              </Link>
            ) : null}
            <button type="button" onClick={() => setShowApprovals((value) => !value)} className={["relative grid h-10 w-10 place-items-center rounded-xl", count > 0 ? "bg-amber-400/10 text-amber-300" : "text-slate-500 hover:bg-white/[0.05]"].join(" ")} aria-label={`${count} aprobaciones pendientes`} aria-expanded={showApprovals}>
              <Bell className="h-4 w-4" />
              {count > 0 ? <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-400 px-1 text-[8px] font-black text-black">{count}</span> : null}
            </button>
          </nav>
        </div>
      </header>

      {showApprovals ? (
        <section className="fixed inset-x-3 top-[72px] z-[110] overflow-hidden rounded-[20px] border border-white/[0.08] bg-[#050d1a]/98 shadow-2xl backdrop-blur-2xl lg:left-auto lg:right-4 lg:top-[68px] lg:w-[390px]" aria-label="Aprobaciones">
          <header className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
            <div><p className="text-sm font-semibold text-white">Aprobaciones</p><p className="text-xs text-slate-500">{count ? `${count} por decidir` : "Todo al día"}</p></div>
            <button type="button" onClick={() => setShowApprovals(false)} className="grid h-10 w-10 place-items-center rounded-xl text-slate-500 hover:bg-white/[0.05]" aria-label="Cerrar"><X className="h-4 w-4" /></button>
          </header>
          <div className="max-h-[56dvh] overflow-y-auto">
            {count === 0 ? <div className="grid place-items-center gap-2 py-10 text-slate-500"><CheckCircle className="h-7 w-7" /><span className="text-xs">Sin pendientes</span></div> : pendingActions.map((action) => (
              <article key={action.id} className="border-b border-white/[0.05] px-4 py-3 last:border-0">
                <p className="text-sm font-medium text-slate-200">{action.title || action.action_type || "Acción"}</p>
                <p className="mt-1 text-xs text-slate-500">{[action.tool_key, action.risk_level].filter(Boolean).join(" · ")}</p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button type="button" disabled={processing === action.id} onClick={() => void handleDecision(action.id, "approve")} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-400/10 text-xs font-semibold text-emerald-300 disabled:opacity-50">{processing === action.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}Aprobar</button>
                  <button type="button" disabled={processing === action.id} onClick={() => void handleDecision(action.id, "reject")} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-rose-400/10 text-xs font-semibold text-rose-300 disabled:opacity-50"><XCircle className="h-4 w-4" />Rechazar</button>
                </div>
              </article>
            ))}
          </div>
          <div className="border-t border-white/[0.06] p-3"><Link href="/owner/actions" onClick={() => setShowApprovals(false)} className="flex min-h-11 items-center justify-center rounded-xl bg-white/[0.04] text-xs font-semibold text-slate-200">Ver detalles</Link></div>
        </section>
      ) : null}
    </>
  );
}
