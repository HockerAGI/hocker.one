"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useWorkspace } from "@/components/WorkspaceContext";
import Hint from "@/components/Hint";
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
  const [allowActions, setAllowActions] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [msgs, loading]); // También hace scroll cuando está cargando

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
          "x-allow-actions": allowActions ? "1" : "0",
        },
        body: JSON.stringify({
          project_id: pid,
          message: userMsg,
        }),
      });

      const txt = await res.text();
      if (!res.ok) {
        setMsgs((p) => [...p, { role: "assistant", content: `Error: ${txt}` }]);
        return;
      }
      setMsgs((p) => [...p, { role: "assistant", content: txt }]);
    } catch (err: any) {
      setMsgs((p) => [...p, { role: "assistant", content: `Error: ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] min-h-[500px] flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
      <div className="shrink-0 border-b border-slate-100 bg-slate-50/50 px-6 py-4 backdrop-blur-md">
        <h2 className="text-lg font-black tracking-tight text-slate-900 flex items-center gap-2">
          <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          Enlace de Comunicación NOVA
        </h2>
        <p className="mt-1 text-xs font-semibold text-slate-500 uppercase tracking-widest">Inteligencia General del Ecosistema</p>
      </div>

      <div className="flex-1 overflow-y-auto bg-slate-50/30 p-4 md:p-6" ref={scrollRef}>
        <div className="mx-auto flex max-w-3xl flex-col gap-6">
          {msgs.length === 0 && (
             <div className="mt-8">
               <Hint title="Bienvenido a la Mente Colmena">
                 Soy NOVA. Puedes ordenarme tareas analíticas o de control. Si activas el permiso táctico abajo, podré disparar AGIs directamente a la red.
               </Hint>
             </div>
          )}

          {msgs.map((m, i) => {
            const isUser = m.role === "user";
            return (
              <div key={i} className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}>
                <div className={`flex max-w-[85%] items-end gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
                  
                  {/* Icono del asistente */}
                  {!isUser && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white shadow-md shadow-blue-500/20 mb-1">
                       <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    </div>
                  )}

                  <div
                    className={`relative rounded-2xl px-5 py-3.5 text-[15px] leading-relaxed shadow-sm ${
                      isUser
                        ? "bg-gradient-to-br from-blue-600 to-blue-500 text-white rounded-br-sm"
                        : "bg-white border border-slate-200 text-slate-800 rounded-bl-sm"
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{m.content}</div>
                  </div>
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex w-full justify-start">
              <div className="flex max-w-[85%] items-end gap-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white shadow-md shadow-blue-500/20 mb-1">
                   <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                </div>
                <div className="rounded-2xl rounded-bl-sm border border-slate-200 bg-white px-5 py-4 shadow-sm flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-blue-500 animate-bounce"></div>
                  <div className="h-2 w-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: "0.15s" }}></div>
                  <div className="h-2 w-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: "0.3s" }}></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="shrink-0 border-t border-slate-200 bg-white p-4 md:px-6 md:pb-6 md:pt-4">
        <div className="mx-auto max-w-3xl">
          <div className="mb-3 flex items-center justify-end">
             <label className="group flex cursor-pointer items-center gap-2">
              <span className={`text-[11px] font-bold uppercase tracking-widest transition-colors ${allowActions ? "text-amber-600" : "text-slate-400"}`}>
                {allowActions ? "Protocolo de Ejecución Activo" : "Modo Analítico (Seguro)"}
              </span>
              <button
                type="button"
                onClick={() => setAllowActions((v) => !v)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
                  allowActions ? "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.4)]" : "bg-slate-300"
                }`}
              >
                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${allowActions ? "translate-x-4.5" : "translate-x-1"}`} />
              </button>
            </label>
          </div>

          <form onSubmit={send} className="flex gap-2">
            <div className="relative flex flex-1 items-center rounded-2xl border border-slate-300 bg-slate-50/50 p-1.5 shadow-inner transition-colors focus-within:border-blue-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-500/10">
              <input
                className="w-full bg-transparent px-4 py-2 text-[15px] outline-none placeholder:text-slate-400 disabled:opacity-50"
                placeholder="Transmite tu instrucción a la matriz..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                disabled={loading}
              />
              <div className="shrink-0 pr-1">
                 <VoiceInput onText={setText} disabled={loading} />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading || !text.trim()}
              className="flex shrink-0 items-center justify-center rounded-2xl bg-blue-600 px-5 shadow-lg shadow-blue-500/25 transition-all hover:scale-[1.02] hover:bg-blue-500 hover:shadow-blue-500/40 active:scale-[0.95] disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              title="Enviar transmisión"
            >
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
