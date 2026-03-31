"use client";

import { getErrorMessage } from "@/lib/errors";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useWorkspace } from "@/components/WorkspaceContext";
import VoiceInput from "@/components/VoiceInput";

type Msg = { role: "user" | "assistant"; content: string; };

export default function NovaChat() {
  const { projectId: pid } = useWorkspace();
  const [text, setText] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(false);
  const [allowActions, setAllowActions] = useState(false); // Lógica original recuperada
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [msgs, loading]);

  async function send(e?: FormEvent) {
    if (e) e.preventDefault();
    if (!text.trim() || loading) return;

    const userMsg = text.trim();
    setText("");
    setMsgs((prev) => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    try {
      const res = await fetch("/api/nova/chat", {
        method: "POST",
        headers: { 
          "content-type": "application/json",
          "x-allow-actions": allowActions ? "1" : "0" // Header original recuperado
        },
        body: JSON.stringify({ project_id: pid, message: userMsg }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Falla en la respuesta de NOVA");

      setMsgs((prev) => [...prev, { role: "assistant", content: data.reply || data.content }]);
    } catch (err: unknown) {
      setMsgs((prev) => [...prev, { role: "assistant", content: `Protocolo fallido: ${getErrorMessage(err)}` }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-full flex-col bg-slate-950/20 backdrop-blur-md rounded-[32px] border border-white/5 overflow-hidden">
      <div className="p-4 border-b border-white/5 flex items-center justify-between bg-sky-500/5">
        <div className="flex items-center gap-2">
           <div className="h-2 w-2 rounded-full bg-sky-500 animate-pulse" />
           <span className="text-[10px] font-black uppercase tracking-widest text-sky-400">Canal Seguro NOVA</span>
        </div>
        {/* CONTROL DE ACCIONES ORIGINAL */}
        <button 
          onClick={() => setAllowActions(!allowActions)}
          className={`flex items-center gap-2 rounded-full px-3 py-1 border transition-all ${allowActions ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-white/10 text-slate-500'}`}
        >
          <span className="text-[9px] font-black uppercase tracking-widest">{allowActions ? 'Acciones ON' : 'Solo Lectura'}</span>
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-6 overflow-y-auto p-6 custom-scrollbar">
        {msgs.map((m, idx) => (
          <div key={idx} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-[24px] px-5 py-3 text-sm font-medium ${m.role === "user" ? "bg-sky-500 text-white" : "bg-white/5 border border-white/10 text-slate-200"}`}>
              {m.content}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-white/5 bg-slate-900/40">
        <form onSubmit={send} className="relative flex items-center gap-2">
          <input className="w-full rounded-[20px] border border-white/10 bg-slate-950/80 px-5 py-4 text-sm text-white placeholder:text-slate-600 outline-none" placeholder="Instrucción de mando..." value={text} onChange={(e) => setText(e.target.value)} disabled={loading} />
          <div className="absolute right-2 flex items-center gap-1">
             <VoiceInput onText={setText} disabled={loading} />
             <button type="submit" disabled={loading || !text.trim()} className="p-3 bg-sky-500 rounded-2xl text-white shadow-lg shadow-sky-500/20 hover:bg-sky-400 transition-all">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
             </button>
          </div>
        </form>
      </div>
    </div>
  );
}
