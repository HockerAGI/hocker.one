"use client";

import { useEffect, useRef, useState } from "react";
import { useWorkspace } from "@/components/WorkspaceContext";
import VoiceInput from "@/components/VoiceInput";
import { NOVA_PROFILE } from "@/lib/novaPersona";
import { parseVoice } from "@/lib/voiceParser";
import { speak } from "@/lib/tts";

type Message = {
  id: string;
  role: "user" | "nova" | "system";
  content: string;
  timestamp: string;
};

type NovaResponse = {
  ok?: boolean;
  reply?: string;
  response?: string;
  error?: string;
};

function makeId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function asText(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export default function NovaChat() {
  const { projectId, nodeId } = useWorkspace();

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "init-0",
      role: "system",
      content: "ENLACE ESTABLECIDO. CANAL DE COMUNICACIÓN ENCRIPTADO.",
      timestamp: new Date().toISOString(),
    },
    {
      id: "init-1",
      role: "nova",
      content: "Aquí NOVA. Estoy en línea. Puedes hablarme o escribirme.",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  function append(role: Message["role"], content: string): void {
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

  async function postChat(text: string): Promise<void> {
    const res = await fetch("/api/nova/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        project_id: projectId,
        projectId,
        node_id: nodeId,
        nodeId,
        message: text,
        mode: "chat",
        prefer: "human",
        persona: NOVA_PROFILE.name,
        system_prompt: NOVA_PROFILE.systemPrompt,
        style: NOVA_PROFILE.styleHint,
      }),
    });

    const raw: unknown = await res.json().catch(() => ({}));
    const payload = raw as NovaResponse;

    if (!res.ok) {
      throw new Error(asText(payload.error) || "Fallo en la matriz de transmisión.");
    }

    const reply = asText(payload.reply) || asText(payload.response) || "Silencio en la red.";
    append("nova", reply);
    speak(reply);
  }

  async function createCommand(
    command: string,
    payload: Record<string, unknown>,
    origin: string,
  ): Promise<void> {
    const res = await fetch("/api/commands", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        project_id: projectId,
        projectId,
        node_id: nodeId,
        nodeId,
        command,
        payload: {
          ...payload,
          origin,
          source: "voice",
          via: "nova",
        },
        needs_approval: false,
      }),
    });

    const raw: unknown = await res.json().catch(() => ({}));
    const output = raw as { ok?: boolean; error?: string; item?: { command?: string } };

    if (!res.ok) {
      throw new Error(asText(output.error) || "No se pudo encolar el comando.");
    }

    const label = asText(output.item?.command) || command;
    const ack = `Orden encolada: ${label}.`;
    append("system", ack);
    speak(ack);
  }

  async function processInput(rawText: string, origin: "text" | "voice"): Promise<void> {
    const clean = rawText.trim();
    if (!clean || !projectId) return;

    const parsed = parseVoice(clean);
    setIsTyping(true);

    try {
      if (parsed.type === "create_command") {
        await createCommand(parsed.command, parsed.payload, origin);
        return;
      }

      await postChat(parsed.message);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Anomalía detectada en el enlace.";
      append("system", `ERROR CRÍTICO: ${message}`);
      speak("Hubo un error en la transmisión.");
    } finally {
      setIsTyping(false);
    }
  }

  const handleSend = async (): Promise<void> => {
    if (!input.trim() || isTyping || !projectId) return;
    const text = input.trim();
    append("user", text);
    setInput("");
    await processInput(text, "text");
  };

  const handleVoice = async (text: string): Promise<void> => {
    if (!text.trim() || isTyping || !projectId) return;
    append("user", `[VOZ] ${text.trim()}`);
    await processInput(text.trim(), "voice");
  };

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-[28px] border border-white/5 bg-[#05070d] shadow-[0_24px_100px_rgba(2,6,23,0.45)]">
      <div className="border-b border-white/5 bg-slate-950/70 px-4 py-3 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75 animate-ping" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-sky-500" />
            </span>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-sky-400">
                Terminal NOVA
              </p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-slate-500">
                {projectId} · {nodeId}
              </p>
            </div>
          </div>

          <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[9px] font-black uppercase tracking-widest text-slate-300">
            {NOVA_PROFILE.styleHint}
          </span>
        </div>
      </div>

      <div className="relative flex-1 overflow-y-auto bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.08),transparent_36%),radial-gradient(circle_at_bottom_right,rgba(56,189,248,0.06),transparent_26%)] p-4 sm:p-5 custom-scrollbar">
        <div className="space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
            >
              <span className="mb-1 text-[9px] font-mono uppercase tracking-widest text-slate-500">
                {msg.role} // {new Date(msg.timestamp).toLocaleTimeString("es-MX")}
              </span>

              <div
                className={`max-w-[82%] rounded-3xl border px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "rounded-br-lg border-sky-400/20 bg-sky-500/10 text-white"
                    : msg.role === "system"
                      ? "rounded-bl-lg border-amber-400/20 bg-amber-500/10 text-amber-200"
                      : "rounded-bl-lg border-white/5 bg-white/[0.04] text-slate-200"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {isTyping ? (
            <div className="flex flex-col items-start">
              <span className="mb-1 text-[9px] font-mono uppercase tracking-widest text-sky-400">
                NOVA // PROCESANDO
              </span>
              <div className="flex items-center gap-2 rounded-3xl border border-white/5 bg-white/[0.04] px-4 py-3">
                <span className="h-2 w-2 animate-bounce rounded-full bg-sky-400" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-sky-400 [animation-delay:0.15s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-sky-400 [animation-delay:0.3s]" />
              </div>
            </div>
          ) : null}

          <div ref={bottomRef} />
        </div>
      </div>

      <div className="border-t border-white/5 bg-slate-950/70 p-3 sm:p-4">
        <div className="flex gap-2 sm:gap-3">
          <input
            type="text"
            className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-[#0a1020] px-4 py-3 text-sm text-white outline-none transition-all placeholder:text-slate-600 focus:border-sky-500/40 focus:ring-1 focus:ring-sky-500/20"
            placeholder="Escribe una directiva..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void handleSend();
              }
            }}
            disabled={isTyping}
            spellCheck={false}
          />

          <VoiceInput onResult={handleVoice} />

          <button
            onClick={() => void handleSend()}
            disabled={isTyping || !input.trim()}
            className="inline-flex items-center justify-center rounded-2xl border border-sky-400/20 bg-sky-500/12 px-5 py-3 text-xs font-black uppercase tracking-widest text-sky-300 transition-all hover:bg-sky-500/20 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Emitir
          </button>
        </div>
      </div>
    </div>
  );
}