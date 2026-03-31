"use client";

import { getErrorMessage } from "@/lib/errors";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useWorkspace } from "@/components/WorkspaceContext";
import VoiceInput from "@/components/VoiceInput";

type Msg = {
  role: "user" | "assistant";
  content: string;
};

export default function NovaChat() {
  const { projectId: pid } = useWorkspace();
  const [text, setText] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(false);
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
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ project_id: pid, message: userMsg }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Falla en la respuesta de NOVA");

      setMsgs((prev) => [...prev, { role: "assistant", content: data.reply || data.content }]);
    } catch (err: unknown) {
      setMsgs((prev) => [...prev, { role: "assistant", content: `Error Crítico: ${getErrorMessage(err)}` }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-full flex-col bg-slate-950/20 backdrop-blur-md">
      <div ref={scrollRef} className="flex-1 space-y-6 overflow-y-auto p-4 custom-scrollbar">
        {msgs.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center text-center p-8">
            <div className="h-16 w-16 rounded-full border border-sky-500/20 bg-sky-500/5 flex items-center justify-center mb-4 animate-float">
               <div className="h-3 w-3 rounded-full bg-sky-400 animate-ping" />
            </div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Esperando Instrucción de Mando...</p>
          </div>
        )}
        {msgs.map((m, idx) => (
          <div key={idx} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2`}>
            <div className={`max-w-[85%] rounded-[24px] px-5 py-3 text-sm font-medium ${m.role === "user" ? "bg-sky-500 text-white shadow-lg shadow-sky-500/20" : "bg-white/5 border border-white/10 text-slate-200"}`}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white/5 border border-white/10 rounded-full px-4 py-2 flex gap-1 items-center">
              <span className="w-1 h-1 bg-sky-400 rounded-full animate-bounce" />
              <span className="w-1 h-1 bg-sky-400 rounded-full animate-bounce [animation-delay:0.2s]" />
              <span className="w-1 h-1 bg-sky-400 rounded-full animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-white/5">
        <form onSubmit={send} className="relative flex items-center gap-2">
          <input
            className="w-full rounded-[20px] border border-white/10 bg-slate-900/80 px-5 py-4 text-sm text-white placeholder:text-slate-600 outline-none focus:border-sky-500/50 transition-all shadow-inner"
            placeholder="Escribe un comando..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div className="absolute right-2 flex items-center gap-1">
             <VoiceInput onText={setText} />
             <button type="submit" className="p-3 bg-sky-500 rounded-2xl shadow-lg shadow-sky-500/20 hover:bg-sky-400 active:scale-95 transition-all">
                <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
             </button>
          </div>
        </form>
      </div>
    </div>
  );
}
