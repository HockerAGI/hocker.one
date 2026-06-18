"use client";

import dynamic from "next/dynamic";

// The realtime chat is the single largest client component (~1350 lines). It is
// browser-only, so we defer it and show an instant skeleton for a fast paint.
const NovaRealtimeChat = dynamic(() => import("@/components/NovaRealtimeChat"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[60dvh] flex-col items-center justify-center gap-3 text-slate-400">
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-300/30 border-t-cyan-300" />
      <p className="text-xs font-bold uppercase tracking-[0.18em]">Cargando NOVA…</p>
    </div>
  ),
});

export default function NovaRealtimeChatLazy() {
  return <NovaRealtimeChat />;
}
