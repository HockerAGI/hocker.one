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
    <div className="flex min-h-[520px] flex-col overflow-hidden rounded-[28px] border border-white/10 bg-slate-900/70 shadow-xl shadow-black/30 backdrop-blur-2xl">
      <div className="shrink-0 border-b border-white/5 bg-white/5 px-6 py-4">
        <h2 className="flex items-center gap-2 text-lg font-black tracking-tight text-white">
          <svg className="h-5 w-5 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Enlace de Comunicación NOVA
        </h2>
        <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-slate-400">
          Inteligencia General del Ecosistema
        </p>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="mx-auto flex max-w-3xl flex-col gap-6">
          {msgs.length === 0 ? (
            <Hint title="Bienvenido a la Mente Colmena">
              Soy NOVA. Puedes ordenarme tareas analíticas o de control. Si activas el permiso táctico abajo, podré disparar AGIs directamente a la red.
            </Hint>
          ) : null}

          {msgs.map((m, i) => {
            const isUser = m.role === "user";
            return (
              <div key={i} className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}>
                <div className={`flex max-w-[85%] items-end gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
                  {!isUser ? (
                    <div className="mb-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-500 text-white shadow-md shadow-sky-500/20">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                  ) : null}

                  <div
                    className={`relative rounded-2xl px-5 py-3.5 text-[15px] leading-relaxed shadow-sm ${
                      isUser
                        ? "rounded-br-sm bg-gradient-to-br from-sky-500 to-blue-500 text-white"
                        : "rounded-bl-sm border border-white/10 bg-white/5 text-slate-100"
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{m.content}</div>
                  </div>
                </div>
              </div>
            );
          })}

          {loading ? (
            <div className="flex w-full justify-start">
              <div className="flex max-w-[85%] items-end gap-2">
                <div className="mb-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-500 text-white shadow-md shadow-sky-500/20">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm border border-white/10 bg-white/5 px-5 py-4 shadow-sm">
                  <div className="h-2 w-2 animate-bounce rounded-full bg-sky-400" />
                  <div className="h-2 w-2 animate-bounce rounded-full bg-sky-400 [animation-delay:150ms]" />
                  <div className="h-2 w-2 animate-bounce rounded-full bg-sky-400 [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="shrink-0 border-t border-white/10 bg-slate-950/60 p-4 md:px-6 md:pb-6 md:pt-4">
        <div className="mx-auto max-w-3xl">
          <div className="mb-3 flex items-center justify-end">
            <label className="group flex cursor-pointer items-center gap-2">
              <span className={`text-[11px] font-bold uppercase tracking-widest ${allowActions ? "text-amber-300" : "text-slate-400"}`}>
                {allowActions ? "Protocolo de Ejecución Activo" : "Modo Analítico (Seguro)"}
              </span>
              <button
                type="button"
                onClick={() => setAllowActions((v) => !v)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  allowActions ? "bg-amber-500" : "bg-slate-600"
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                    allowActions ? "translate-x-4.5" : "translate-x-1"
                  }`}
                />
              </button>
            </label>
          </div>

          <form onSubmit={send} className="flex gap-2">
            <div className="flex flex-1 items-center rounded-2xl border border-white/10 bg-white/5 p-1.5 shadow-inner focus-within:border-sky-400 focus-within:ring-4 focus-within:ring-sky-500/10">
              <input
                className="w-full bg-transparent px-4 py-2 text-[15px] text-slate-100 outline-none placeholder:text-slate-500 disabled:opacity-50"
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
              className="inline-flex shrink-0 items-center justify-center rounded-2xl bg-sky-500 px-5 shadow-lg shadow-sky-500/20 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-50"
              title="Enviar transmisión"
            >
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}