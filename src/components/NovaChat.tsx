"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/errors";

type ChatRole = "user" | "assistant";

type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
};

const PROMPTS = [
  "Dame un diagnóstico del ecosistema.",
  "Genera una estrategia de crecimiento.",
  "Resume el estado de nodos y seguridad.",
  "Escribe un plan de acción de 7 días.",
];

function uid(): string {
  return globalThis.crypto?.randomUUID?.() ?? `msg_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function readAssistantText(data: unknown): string {
  if (!data || typeof data !== "object") return "";
  const payload = data as Record<string, unknown>;

  for (const key of ["reply", "response", "message", "text", "content"]) {
    const value = payload[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }

  if (typeof payload.error === "string" && payload.error.trim()) {
    return payload.error.trim();
  }

  return "";
}

async function postNova(message: string): Promise<string> {
  const payload = {
    project_id: "global",
    message,
    prefer: "auto",
    mode: "auto",
    allow_actions: false,
  };

  const endpoints = ["/api/nova/chat", "/api/chat"];

  let lastError: unknown = null;

  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(readAssistantText(data) || `HTTP ${res.status}`);
      }

      const text = readAssistantText(data);
      if (text) return text;

      throw new Error("La respuesta llegó vacía.");
    } catch (error: unknown) {
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error("No se pudo conectar con NOVA.");
}

export default function NovaChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: uid(),
      role: "assistant",
      content: "NOVA en línea. Envíame la instrucción.",
    },
  ]);
  const [input, setInput] = useState("");
  const [threadId, setThreadId] = useState<string>("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);
  const lastUserMessageRef = useRef<string>("");

  useEffect(() => {
    const existing = window.localStorage.getItem("hocker:nova-thread");
    if (existing) {
      setThreadId(existing);
      return;
    }

    const next = uid();
    window.localStorage.setItem("hocker:nova-thread", next);
    setThreadId(next);
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, sending]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
  }, [input]);

  const canSend = useMemo(() => input.trim().length > 0 && !sending, [input, sending]);

  async function sendMessage(text: string) {
    const content = text.trim();
    if (!content || sending) return;

    setSending(true);
    setError(null);
    lastUserMessageRef.current = content;

    const userMessage: ChatMessage = { id: uid(), role: "user", content };
    setMessages((current) => [...current, userMessage]);
    setInput("");

    try {
      const reply = await postNova(content);
      setMessages((current) => [...current, { id: uid(), role: "assistant", content: reply }]);
    } catch (err: unknown) {
      const message = getErrorMessage(err);
      setError(message);
      toast.error(message);
      setMessages((current) => [
        ...current,
        {
          id: uid(),
          role: "assistant",
          content: "Hubo un error al responder. Vuelve a intentar.",
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  function handleRetry() {
    if (!lastUserMessageRef.current) return;
    void sendMessage(lastUserMessageRef.current);
  }

  return (
    <section className="flex h-full flex-col overflow-hidden rounded-[28px] border border-white/5 bg-slate-950/70 backdrop-blur-2xl">
      <div className="flex items-center justify-between gap-3 border-b border-white/5 px-4 py-3 sm:px-5">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.35em] text-sky-300">
            NOVA
          </p>
          <p className="mt-1 text-[11px] text-slate-500">Chat operativo y persistente.</p>
        </div>

        <button
          type="button"
          onClick={handleRetry}
          disabled={!lastUserMessageRef.current || sending}
          className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.25em] text-slate-300 transition-all hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Reintentar
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
                  : "border-white/5 bg-white/[0.03] text-slate-100"
              }`}
            >
              {message.content}
            </article>
          ))}
          <div ref={endRef} />
        </div>
      </div>

      <div className="border-t border-white/5 p-3 sm:p-4">
        <div className="mb-3 flex flex-wrap gap-2">
          {PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => setInput(prompt)}
              className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.22em] text-slate-300 transition-all hover:bg-white/[0.06]"
            >
              {prompt}
            </button>
          ))}
        </div>

        {error ? (
          <div className="mb-3 rounded-2xl border border-rose-400/15 bg-rose-500/10 px-3 py-2 text-[11px] text-rose-200">
            {error}
          </div>
        ) : null}

        <div className="rounded-[24px] border border-white/5 bg-white/[0.03] p-3">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void sendMessage(input);
              }
            }}
            placeholder={threadId ? `Hilo: ${threadId.slice(0, 8)}...` : "Escribe aquí..."}
            rows={1}
            className="min-h-[48px] w-full resize-none bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
          />

          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="text-[10px] font-mono uppercase tracking-[0.22em] text-slate-500">
              {sending ? "Procesando..." : "Shift+Enter para salto"}
            </span>

            <button
              type="button"
              onClick={() => void sendMessage(input)}
              disabled={!canSend}
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