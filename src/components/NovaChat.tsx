"use client";

import { useState, useRef, useEffect } from "react";
import { useWorkspace } from "@/components/WorkspaceContext";
import VoiceInput from "@/components/VoiceInput";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function NovaChat() {
  const { projectId } = useWorkspace();

  const [msgs, setMsgs] = useState<Message[]>([]);
  const [text, setText] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!scrollRef.current) return;

    scrollRef.current.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [msgs]);

  async function send(): Promise<void> {
    if (!text.trim() || loading) return;

    const userMsg = text.trim();

    setMsgs((prev) => [...prev, { role: "user", content: userMsg }]);
    setText("");
    setLoading(true);

    try {
      const res = await fetch("/api/nova/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          project_id: projectId,
          message: userMsg,
        }),
      });

      if (!res.ok) {
        throw new Error("Error en API NOVA");
      }

      const data: { ok: boolean; response: string } = await res.json();

      setMsgs((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.response,
        },
      ]);
    } catch {
      setMsgs((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "⚠️ Error de conexión con el Núcleo.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-[32px] border border-white/5 bg-slate-950/40 backdrop-blur-2xl">
      {/* HEADER */}
      <div className="flex items-center gap-3 border-b border-white/5 px-5 py-4">
        <span className="h-2 w-2 animate-pulse rounded-full bg-sky-400" />
        <span className="text-xs font-bold uppercase tracking-widest text-sky-400">
          Nova Core
        </span>
      </div>

      {/* MENSAJES */}
      <div
        ref={scrollRef}
        className="custom-scrollbar flex-1 space-y-4 overflow-y-auto p-4"
      >
        {msgs.map((m, i) => (
          <div
            key={`${m.role}-${i}`}
            className={`flex ${
              m.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                m.role === "user"
                  ? "bg-sky-500 text-white"
                  : "border border-white/10 bg-slate-900 text-slate-200"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="animate-pulse text-[10px] text-sky-500">
            NOVA PENSANDO...
          </div>
        )}
      </div>

      {/* INPUT */}
      <div className="flex gap-2 border-t border-white/5 p-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void send();
            }
          }}
          className="flex-1 rounded-xl bg-white/5 px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-sky-500/50"
          placeholder="Escribe una orden..."
        />

        <VoiceInput onResult={setText} />

        <button
          onClick={() => void send()}
          disabled={loading}
          className="rounded-xl bg-sky-500 px-4 text-white transition-all hover:bg-sky-400 disabled:opacity-50"
        >
          →
        </button>
      </div>
    </div>
  );
}