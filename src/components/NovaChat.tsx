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

type CommandsResponse = {
  ok?: boolean;
  item?: {
    command?: string;
  };
  error?: string;
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

function readText(value: unknown): string {
  if (typeof value === "string") return value;
  return "";
}

export default function NovaChat({ projectId: projectIdProp }: { projectId?: string } = {}) {
  const { projectId: workspaceProjectId, nodeId } = useWorkspace();
  const projectId = (projectIdProp?.trim() || workspaceProjectId).trim();

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
  const [input, setInput] = useState<string>("");
  const [isTyping, setIsTyping] = useState<boolean>(false);
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
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        project_id: projectId,
        projectId,
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

    const reply = readText(payload.reply) || readText(payload.response);
    const message = reply || "Silencio en la red.";

    if (!res.ok) {
      throw new Error(readText(payload.error) || "Fallo en la matriz de transmisión.");
    }

    append("nova", message);
    speak(message);
  }

  async function createCommand(command: string, payload: Record<string, unknown>, origin: string): Promise<void> {
    const res = await fetch("/api/commands", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        project_id: projectId,
        projectId,
        node_id: nodeId || "hocker-agi",
        nodeId: nodeId || "hocker-agi",
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
    const payloadOut = raw as CommandsResponse;

    if (!res.ok) {
      throw new Error(readText(payloadOut.error) || "No se pudo encolar el comando.");
    }

    const label = readText(payloadOut.item?.command) || command;
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
      const message = error instanceof Error ? error.message : "Anomalía detectada en el enlace.";
      const human = `ERROR CRÍTICO: ${message}`;
      append("system", human);
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

    const clean = text.trim();
    append("user", `[VOZ] ${clean}`);
    await processInput(clean, "voice");
  };

  return (
    <div className="flex h-[600px] flex-col overflow-hidden rounded-xl border border-white/10 bg-[#050505] relative shadow-[0_0_20px_rgba(0,240,255,0.05)]">
      <div className="z-10 flex items-center justify-between border-b border-white/5 bg-hocker-dark p-4">
        <div className="flex items-center gap-3">
          <div className="relative flex h-4 w-4">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-hocker-accent opacity-50" />
            <span className="relative inline-flex h-4 w-4 rounded-full bg-hocker-accent shadow-[0_0_10px_#00f0ff]" />
          </div>
          <div>
            <h2 className="text-sm font-black uppercase tracking-widest text-white">
              Enlace Directo: NOVA
            </h2>
            <p className="text-[10px] font-mono text-hocker-accent">
              {NOVA_PROFILE.styleHint}
            </p>
          </div>
        </div>
        <span className="text-[9px] font-mono uppercase text-slate-500">
          {projectId || "SIN PROYECTO"}
        </span>
      </div>

      <div
        className="relative z-10 flex-1 space-y-6 overflow-y-auto bg-[url('/1381.png')] bg-no-repeat bg-center bg-[length:300px_300px] bg-blend-overlay p-6 custom-scrollbar"
        style={{ backgroundColor: "rgba(5, 5, 5, 0.95)" }}
      >
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
            <span className="mb-1 text-[9px] font-mono uppercase tracking-widest text-gray-600">
              {msg.role} // {new Date(msg.timestamp).toLocaleTimeString()}
            </span>

            <div
              className={`max-w-[80%] rounded-xl border p-4 text-sm font-mono leading-relaxed ${
                msg.role === "user"
                  ? "rounded-br-none border-hocker-accent/30 bg-hocker-accent/10 text-white"
                  : msg.role === "system"
                    ? "rounded-bl-none border-hocker-alert/30 bg-hocker-alert/10 text-hocker-alert animate-pulse"
                    : "rounded-bl-none border-white/10 bg-white/5 text-gray-300 shadow-[0_0_15px_rgba(0,0,0,0.5)]"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex flex-col items-start">
            <span className="mb-1 animate-pulse text-[9px] font-mono uppercase tracking-widest text-hocker-accent">
              NOVA // PROCESANDO...
            </span>
            <div className="flex h-12 items-center gap-2 rounded-xl rounded-bl-none border border-white/10 bg-white/5 p-4">
              <span className="h-2 w-2 animate-bounce rounded-full bg-hocker-accent" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-hocker-accent" style={{ animationDelay: "0.2s" }} />
              <span className="h-2 w-2 animate-bounce rounded-full bg-hocker-accent" style={{ animationDelay: "0.4s" }} />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="z-10 border-t border-white/5 bg-hocker-dark p-4">
        <div className="flex gap-3">
          <input
            type="text"
            className="flex-1 rounded-lg border border-white/10 bg-[#0a0a0c] px-5 py-3 text-sm font-mono text-white transition-all placeholder:text-gray-700 focus:outline-none focus:border-hocker-accent focus:ring-1 focus:ring-hocker-accent"
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
            className="rounded-lg bg-hocker-accent px-6 py-3 font-black uppercase tracking-widest text-black transition-all hover:bg-hocker-accent/80 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Emitir
          </button>
        </div>
      </div>
    </div>
  );
}