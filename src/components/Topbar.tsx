"use client";

import Image from "next/image";
import Link from "next/link";
import { Bell, Bot, CheckCircle, Search, X } from "lucide-react";
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
  const [pendingVerified, setPendingVerified] = useState(false);

  const fetchPending = useCallback(async () => {
    try {
      const res = await fetch("/api/agi/runtime/actions?status=needs_approval", { cache: "no-store" });
      const data = await res.json() as { ok?: boolean; actions?: PendingAction[] };
      if (!res.ok || data.ok !== true || !Array.isArray(data.actions)) throw new Error("Cola no disponible");
      setPendingActions(data.actions);
      setPendingVerified(true);
    } catch {
      setPendingActions([]);
      setPendingVerified(false);
    }
  }, []);

  useEffect(() => {
    void fetchPending();
    const id = setInterval(() => { void fetchPending(); }, 20_000);
    return () => clearInterval(id);
  }, [fetchPending]);
  useEffect(() => setShowApprovals(false), [pathname]);

  function triggerPalette() {
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true, ctrlKey: !navigator.platform.includes("Mac"), bubbles: true }));
  }

  const count = pendingActions.length;
  return (
    <>
      <header className="fixed inset-x-0 top-0 z-[90] border-b border-white/[0.06] bg-[#030711]/92 backdrop-blur-2xl lg:left-[290px]">
        <div className="mx-auto flex h-16 w-full max-w-[1800px] items-center gap-2 px-3 sm:px-4 lg:h-[60px]">
          <Link href="/owner" aria-label="Inicio Hocker ONE" className="mr-1 grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-white/[0.06] bg-white/[0.03] lg:hidden">
            <Image src="/ecosystem/apps/hocker-one/icon.png" alt="" width={36} height={36} className="h-9 w-9 object-contain" priority />
          </Link>
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
            <button type="button" onClick={() => setShowApprovals((value) => !value)} className={["relative grid h-11 w-11 place-items-center rounded-xl", count > 0 ? "bg-amber-400/10 text-amber-300" : "text-slate-500 hover:bg-white/[0.05]"].join(" ")} aria-label={pendingVerified ? `${count === 30 ? "30+" : count} aprobaciones pendientes` : "Aprobaciones sin verificar"} aria-expanded={showApprovals}>
              <Bell className="h-4 w-4" />
              {count > 0 ? <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-400 px-1 text-[8px] font-black text-black">{count === 30 ? "30+" : count}</span> : null}
            </button>
          </nav>
        </div>
      </header>

      {showApprovals ? (
        <section className="fixed inset-x-3 top-[72px] z-[110] overflow-hidden rounded-[20px] border border-white/[0.08] bg-[#050d1a]/98 shadow-2xl backdrop-blur-2xl lg:left-auto lg:right-4 lg:top-[68px] lg:w-[390px]" aria-label="Aprobaciones">
          <header className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
            <div><p className="text-sm font-semibold text-white">Aprobaciones</p><p className="text-xs text-slate-500">{!pendingVerified ? "Sin verificar" : count ? `${count === 30 ? "30+" : count} por decidir` : "Sin pendientes"}</p></div>
            <button type="button" onClick={() => setShowApprovals(false)} className="grid h-10 w-10 place-items-center rounded-xl text-slate-500 hover:bg-white/[0.05]" aria-label="Cerrar"><X className="h-4 w-4" /></button>
          </header>
          <div className="max-h-[56dvh] overflow-y-auto">
            {!pendingVerified ? <p role="status" className="p-4 text-sm text-amber-200">No se pudo verificar la cola. <button type="button" onClick={() => void fetchPending()} className="underline">Reintentar</button></p> : count === 0 ? <div className="grid place-items-center gap-2 py-10 text-slate-500"><CheckCircle className="h-7 w-7" /><span className="text-xs">Sin pendientes</span></div> : pendingActions.map((action) => (
              <article key={action.id} className="border-b border-white/[0.05] px-4 py-3 last:border-0">
                <p className="text-sm font-medium text-slate-200">{action.title || action.action_type || "Acción"}</p>
                <p className="mt-1 text-xs text-slate-500">{[action.tool_key, action.risk_level].filter(Boolean).join(" · ")}</p>
                <Link href={"/owner/actions?action_id=" + encodeURIComponent(action.id)} onClick={() => setShowApprovals(false)} className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-amber-300/20 bg-amber-300/[0.06] px-3 text-xs font-semibold text-amber-100 hover:bg-amber-300/10">
                  Revisar alcance, riesgo y aprobación
                </Link>
              </article>
            ))}
          </div>
          <div className="border-t border-white/[0.06] p-3"><Link href="/owner/actions" onClick={() => setShowApprovals(false)} className="flex min-h-11 items-center justify-center rounded-xl bg-white/[0.04] text-xs font-semibold text-slate-200">Ver detalles</Link></div>
        </section>
      ) : null}
    </>
  );
}
