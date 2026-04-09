"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import VoiceInput from "@/components/VoiceInput";
import { useWorkspace } from "@/components/WorkspaceContext";
import { speak } from "@/lib/tts";

type Message = {
  id: string;
  role: "user" | "nova" | "system";
  content: string;
  timestamp: string;
};

function makeId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function textOf(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function safeReply(payload: unknown): string {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return "";
  const obj = payload as Record<string, unknown>;

  for (const key of ["reply", "response", "message", "text", "content"]) {
    const v = obj[key];
    if (typeof v === "string" && v.trim()) return v.trim();
  }

  if (typeof obj.error === "string" && obj.error.trim()) return obj.error.trim();
  return "";
}

const SUGGESTIONS = [
  "Resume el estado actual.",
  "Dame un plan de hoy.",
  "Revisa los módulos activos.",
  "Sugiere la siguiente acción.",
];

export default function NovaChat() {
  const { projectId, nodeId } = useWorkspace();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "init-1",
      role: "nova",
      content: "Hola, soy NOVA. Estoy lista para ayudarte.",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastText, setLastText] = useState<string>("");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, sending]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
  }, [input]);

  function push(role: Message["role"], content: string): void {
    setMessages((prev) => [
      ...prev,
      {
        id: makeId(),
        role,
        content,
        timestamp: new Date().toISOString(),
      },
    ]);
  }

  async function sendToNova(text: string): Promise<void> {
    const clean = text.trim();
    if (!clean || sending) return;

    const userMessage = clean;
    setSending(true);
    setError(null);
    setLastText(clean);
    push("user", clean);
    setInput("");

    try {
      const res = await fetch("/api/nova/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: projectId,
          projectId,
          node_id: nodeId,
          nodeId,
          message: clean,
          prefer: "auto",
          mode: "auto",
          allow_actions: false,
        }),
      });

      const payload: unknown = await res.json().catch(() => ({}));
      const reply = safeReply(payload);

      if (!res.ok) {
        throw new Error(reply || "No se pudo responder.");
      }

      const finalReply = reply || "Te leo. Dame el siguiente paso.";
      push("nova", finalReply);
      speak(finalReply);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Ocurrió un problema.";
      setError(message);
      push("system", message);
    } finally {
      setSending(false);
    }
  }

  function handleRetry(): void {
    if (!lastText) return;
    void sendToNova(lastText);
  }

  return (
    <section className="flex h-full flex-col overflow-hidden rounded-[28px] border border-white/5 bg-slate-950/75 shadow-[0_24px_100px_rgba(2,6,23,0.45)] backdrop-blur-2xl">
      <div className="flex items-center justify-between gap-3 border-b border-white/5 px-4 py-3 sm:px-5">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.35em] text-sky-300">
            Hablar con NOVA
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            Texto o voz. Respuestas claras.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRetry}
          disabled={!lastText || sending}
          className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.25em] text-slate-300 transition-all hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Repetir
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 custom-scrollbar sm:px-5">
        <div className="space-y-3">
          {messages.map((message) => (
            <article
              key={message.id}
              className={`max-w-[92%] rounded-[22px] border px-4 py-3 text-sm leading-relaxed ${
                message.role === "user"
                  ? "ml-auto border-sky-400/20 bg-sky-500/10 text-sky-50"
                  : message.role === "system"
                    ? "border-rose-400/15 bg-rose-500/10 text-rose-200"
                    : "border-white/5 bg-white/[0.03] text-slate-100"
              }`}
            >
              {message.content}
            </article>
          ))}
          {sending ? (
            <div className="max-w-[92%] rounded-[22px] border border-white/5 bg-white/[0.03] px-4 py-3 text-sm text-slate-300">
              Escribiendo respuesta...
            </div>
          ) : null}
          <div ref={bottomRef} />
        </div>
      </div>

      {error ? (
        <div className="border-t border-white/5 px-4 py-3 text-xs text-rose-200">
          {error}
        </div>
      ) : null}

      <div className="border-t border-white/5 p-3 sm:p-4">
        <div className="mb-3 flex flex-wrap gap-2">
          {SUGGESTIONS.map((label) => (
            <button
              key={label}
              type="button"
              onClick={() => setInput(label)}
              className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.22em] text-slate-300 transition-all hover:bg-white/[0.06]"
            >
              {label}
            </button>
          ))}
        </div>

        <div className="rounded-[24px] border border-white/5 bg-white/[0.03] p-3">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={1}
            placeholder="Escribe aquí..."
            className="min-h-[48px] w-full resize-none bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void sendToNova(input);
              }
            }}
          />

          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <VoiceInput onResult={(t) => void sendToNova(t)} />
              <span className="hidden text-[10px] uppercase tracking-[0.22em] text-slate-500 sm:block">
                Shift+Enter para salto
              </span>
            </div>

            <button
              type="button"
              onClick={() => void sendToNova(input)}
              disabled={!input.trim() || sending}
              className="hocker-button-brand disabled:cursor-not-allowed disabled:opacity-60"
            >
              Enviar
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}