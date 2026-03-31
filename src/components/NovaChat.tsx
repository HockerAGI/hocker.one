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
  const [allowActions, setAllowActions] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
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
          "x-allow-actions": allowActions ? "1" : "0"
        },
        body: JSON.stringify({ project_id: pid, message: userMsg }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Falla en la respuesta de NOVA");

      setMsgs((prev) => [...prev, { role: "assistant", content: data.reply || data.content }]);
    } catch (err: unknown) {
      setMsgs((prev) => [...prev, { role: "assistant", content: `Error táctico: ${getErrorMessage(err)}` }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-slate-950/40 backdrop-blur-2xl rounded-[32px] border border-white/5 shadow-2xl">
      {/* CABECERA NOVA */}
      <div className="flex items-center justify-between border-b border-white/5 bg-sky-500/5 px-5 py-4">
        <div className="flex items-center gap-3">
           <div className="relative flex h-3 w-3 items-center justify-center">
             <span className="absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75 animate-ping" />
             <span className="relative inline-flex h-2 w-2 rounded-full bg-sky-500" />
           </div>
           <div className="flex flex-col">
             <span className="text-[11px] font-black uppercase tracking-widest text-sky-400">NOVA Core</span>
             <span className="text-[9px] font-bold text-slate-500">Conciencia Operativa Activa</span>
           </div>
        </div>
        
        <button 
          onClick={() => setAllowActions(!allowActions)}
          className={`flex items-center gap-2 rounded-full border px-3 py-1.5 transition-all ${allowActions ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]' : 'border-white/10 bg-white/5 text-slate-400 hover:bg-white/10'}`}
          title="Permitir a NOVA ejecutar comandos tácticos"
        >
          <span className="text-[9px] font-black uppercase tracking-widest">
            {allowActions ? 'Ejecución ON' : 'Solo Lectura'}
          </span>
          <div className={`h-1.5 w-1.5 rounded-full ${allowActions ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
        </button>
      </div>

      {/* MONITOR DE MENSAJES */}
      <div ref={scrollRef} className="flex-1 space-y-6 overflow-y-auto p-5 custom-scrollbar">
        {msgs.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center text-center opacity-70">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl border border-sky-500/20 bg-sky-500/5 shadow-[0_0_30px_rgba(14,165,233,0.1)]">
               <svg className="h-8 w-8 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Canal Seguro Establecido</p>
            <p className="mt-1 text-xs text-slate-500">A la espera de tus órdenes, Director.</p>
          </div>
        )}
        
        {msgs.map((m, idx) => (
          <div key={idx} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2`}>
            <div className={`max-w-[85%] sm:max-w-[75%] rounded-[24px] px-5 py-3.5 text-[13px] leading-relaxed font-medium shadow-md ${
              m.role === "user" 
                ? "bg-sky-500 text-white shadow-sky-500/20 rounded-tr-sm" 
                : "border border-white/10 bg-slate-900/80 text-slate-200 rounded-tl-sm"
            }`}>
              {m.content}
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="flex justify-start animate-in fade-in">
            <div className="flex items-center gap-1.5 rounded-[20px] border border-white/10 bg-slate-900/80 px-5 py-4">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-400 animate-bounce" />
              <span className="h-1.5 w-1.5 rounded-full bg-sky-400 animate-bounce" style={{ animationDelay: "0.2s" }} />
              <span className="h-1.5 w-1.5 rounded-full bg-sky-400 animate-bounce" style={{ animationDelay: "0.4s" }} />
            </div>
          </div>
        )}
      </div>

      {/* CONSOLA DE INGRESO */}
      <div className="border-t border-white/5 bg-slate-950/80 p-4">
        <form onSubmit={send} className="relative flex items-center gap-2">
          <div className="relative flex-1">
            <input
              className="w-full rounded-[24px] border border-white/10 bg-white/5 py-4 pl-5 pr-14 text-sm text-white placeholder:text-slate-500 outline-none transition-all focus:border-sky-500/50 focus:bg-slate-900/80 shadow-inner disabled:opacity-50"
              placeholder="Instrucción de mando..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={loading}
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
               <VoiceInput onText={setText} disabled={loading} />
            </div>
          </div>
          <button 
            type="submit" 
            disabled={loading || !text.trim()} 
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sky-500 text-white shadow-lg shadow-sky-500/20 transition-all hover:bg-sky-400 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7"/></svg>
          </button>
        </form>
      </div>
    </div>
  );
}
