"use client";

import { getErrorMessage } from "@/lib/errors";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useWorkspace } from "@/components/WorkspaceContext";
import VoiceInput from "@/components/VoiceInput";

type Msg = { role: "user" | "assistant"; content: string };

const STORAGE_KEY = "nova_chat_history";

export default function NovaChat() {
  const { projectId: pid } = useWorkspace();

  const [text, setText] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(false);
  const [allowActions, setAllowActions] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 🔹 Load historial
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setMsgs(JSON.parse(saved));
  }, []);

  // 🔹 Save historial
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(msgs));
  }, [msgs]);

  // 🔹 Auto scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [msgs, loading]);

  // 🔹 Auto focus
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

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

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Falla en NOVA");

      setMsgs((prev) => [
        ...prev,
        { role: "assistant", content: data.reply || data.content },
      ]);
    } catch (err: unknown) {
      setMsgs((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `⚠️ Error táctico: ${getErrorMessage(err)}`,
        },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-slate-950/40 backdrop-blur-2xl rounded-[32px] border border-white/5 shadow-2xl">

      {/* HEADER */}
      <div className="flex items-center justify-between border-b border-white/5 bg-sky-500/5 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75 animate-ping" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-sky-500" />
          </div>

          <div>
            <div className="text-[11px] font-black uppercase tracking-widest text-sky-400">
              NOVA Core
            </div>
            <div className="text-[9px] text-slate-500">
              Conciencia Operativa Activa
            </div>
          </div>
        </div>

        <button
          onClick={() => setAllowActions(!allowActions)}
          className={`flex items-center gap-2 rounded-full border px-3 py-1.5 transition-all ${
            allowActions
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
              : "border-white/10 bg-white/5 text-slate-400"
          }`}
        >
          <span className="text-[9px] font-black uppercase tracking-widest">
            {allowActions ? "Ejecución ON" : "Solo Lectura"}
          </span>
        </button>
      </div>

      {/* CHAT */}
      <div
        ref={scrollRef}
        className="flex-1 space-y-6 overflow-y-auto p-5 custom-scrollbar"
      >
        {msgs.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center text-center opacity-70">
            <p className="text-xs text-slate-500">
              Canal seguro listo. Esperando instrucciones.
            </p>
          </div>
        )}

        {msgs.map((m, i) => (
          <div
            key={i}
            className={`flex ${
              m.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[75%] rounded-[24px] px-5 py-3 text-sm ${
                m.role === "user"
                  ? "bg-sky-500 text-white"
                  : "bg-slate-900/80 border border-white/10"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="text-sky-400 text-xs animate-pulse">
            NOVA está procesando…
          </div>
        )}
      </div>

      {/* INPUT */}
      <div className="border-t border-white/5 p-4">
        <form
          onSubmit={send}
          className="flex items-center gap-2"
        >
          <input
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Instrucción de mando..."
            disabled={loading}
            className="flex-1 rounded-xl bg-white/5 px-4 py-3 text-sm outline-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
          />

          <VoiceInput onText={setText} disabled={loading} />

          <button
            type="submit"
            disabled={!text.trim() || loading}
            className="h-10 w-10 rounded-xl bg-sky-500"
          />
        </form>
      </div>
    </div>
  );
}