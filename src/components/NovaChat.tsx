"use client";

import { useEffect, useRef, useState } from "react";
import { useWorkspace } from "@/components/WorkspaceContext";
import VoiceInput from "@/components/VoiceInput";

type Msg = {
  role: "user" | "assistant";
  content: string;
};

export default function NovaChat() {
  const { projectId: pid } = useWorkspace();

  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [allowActions, setAllowActions] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [msgs]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function send() {
    if (!text.trim() || loading) return;

    const userMsg = text.trim();

    setMsgs((prev) => [...prev, { role: "user", content: userMsg }]);
    setText("");
    setLoading(true);
    setThinking(true);

    try {
      const res = await fetch("/api/nova/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-allow-actions": allowActions ? "1" : "0",
        },
        body: JSON.stringify({
          project_id: pid,
          message: userMsg,
        }),
      });

      if (!res.body) throw new Error("Sin stream");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      let done = false;
      let fullText = "";

      // Mensaje vacío inicial
      setMsgs((prev) => [...prev, { role: "assistant", content: "" }]);

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;

        const chunk = decoder.decode(value || new Uint8Array());

        fullText += chunk;

        setMsgs((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content: fullText,
          };
          return updated;
        });
      }

    } catch (_err) {
      setMsgs((prev) => [
        ...prev,
        { role: "assistant", content: "⚠️ Error en canal NOVA" },
      ]);
    } finally {
      setLoading(false);
      setThinking(false);
    }
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-[32px] border border-white/5 bg-slate-950/40 backdrop-blur-2xl">

      {/* HEADER */}
      <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="h-2 w-2 rounded-full bg-sky-400 animate-pulse" />
          <span className="text-xs font-bold text-sky-400">NOVA CORE</span>
        </div>

        <button
          onClick={() => setAllowActions(!allowActions)}
          className={`text-xs ${
            allowActions ? "text-emerald-400" : "text-slate-400"
          }`}
        >
          {allowActions ? "EXEC ON" : "READ ONLY"}
        </button>
      </div>

      {/* CHAT */}
      <div
        ref={scrollRef}
        className="flex-1 space-y-4 overflow-y-auto p-4"
      >
        {msgs.map((m, i) => (
          <div
            key={i}
            className={`flex ${
              m.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[75%] rounded-xl px-4 py-2 text-sm ${
                m.role === "user"
                  ? "bg-sky-500 text-white"
                  : "bg-slate-900 border border-white/10"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}

        {thinking && (
          <div className="text-sky-400 text-xs animate-pulse">
            NOVA está procesando…
          </div>
        )}
      </div>

      {/* INPUT */}
      <div className="border-t border-white/5 p-3 flex gap-2">
        <input
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="flex-1 bg-white/5 px-3 py-2 rounded-xl text-sm"
          placeholder="Orden..."
          onKeyDown={(e) => {
            if (e.key === "Enter") send();
          }}
        />

        <VoiceInput onText={setText} disabled={loading} />

        <button
          onClick={send}
          className="px-4 py-2 bg-sky-500 rounded-xl text-white"
        >
          →
        </button>
      </div>
    </div>
  );
}