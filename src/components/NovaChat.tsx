"use client";

import { useEffect, useRef, useState } from "react";
import { useWorkspace } from "@/components/WorkspaceContext";
import Hint from "@/components/Hint";

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
  }, [msgs]);

  async function send(e?: React.FormEvent) {
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
      let answer = txt;

      if (!res.ok) {
        try {
          const j = JSON.parse(txt);
          answer = `Error: ${j.error || "Falla en la comunicación con NOVA."}`;
        } catch {
          answer = `Error de conexión: ${res.status}`;
        }
      }

      setMsgs((prev) => [...prev, { role: "assistant", content: answer }]);
    } catch (err: any) {
      setMsgs((prev) => [...prev, { role: "assistant", content: `Error local: ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <Hint title="Tip rápido">
        Proyecto activo: <b>{pid}</b>. Si quieres cambiarlo, hazlo arriba en la barra global.
      </Hint>

      <div className="flex h-[75vh] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50 p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 font-bold text-white shadow-md">
                N
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Asistente NOVA</h2>
                <p className="text-xs text-slate-500">Orquestación y respuestas</p>
              </div>
            </div>

            <label className="text-xs font-semibold text-slate-700 flex items-center gap-2 rounded-lg bg-white px-3 py-2 shadow-sm border border-slate-200">
              <input
                type="checkbox"
                checked={allowActions}
                onChange={(e) => setAllowActions(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              Permitir acciones
            </label>
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
          {msgs.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-slate-400">
              Escribe una instrucción. NOVA responde y puede encolar acciones si está permitido.
            </div>
          ) : (
            msgs.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-2xl px-5 py-3 text-sm shadow-sm ${m.role === "user" ? "bg-blue-600 text-white" : "bg-white border border-slate-200 text-slate-800"}`}>
                  <div className="whitespace-pre-wrap leading-relaxed font-medium">{m.content}</div>
                </div>
              </div>
            ))
          )}

          {loading && (
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-2xl bg-white border border-slate-200 px-5 py-3 text-sm shadow-sm flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-blue-400 animate-bounce"></div>
                <div className="h-2 w-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: "0.15s" }}></div>
                <div className="h-2 w-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: "0.3s" }}></div>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-slate-200 bg-white p-4">
          <form onSubmit={send} className="flex gap-2">
            <input
              className="flex-1 rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition-colors focus:border-blue-500 focus:bg-white"
              placeholder="Escribe tu instrucción para NOVA..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !text.trim()}
              className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-slate-800 disabled:opacity-50"
            >
              Enviar
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}