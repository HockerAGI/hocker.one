"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase-browser";
import VoiceInput from "@/components/VoiceInput";

type Msg = { id: string; role: string; content: string; created_at: string };

function speak(text: string) {
  try {
    const synth = window.speechSynthesis;
    if (!synth) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "es-MX";
    synth.cancel();
    synth.speak(u);
  } catch {}
}

export default function NovaChat() {
  const supabase = useMemo(() => createBrowserSupabase(), []);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("NOVA, dame el status del nodo");
  const [nodeId, setNodeId] = useState(process.env.NEXT_PUBLIC_HOCKER_DEFAULT_NODE_ID || "node-hocker-01");
  const [msg, setMsg] = useState("");
  const [tts, setTts] = useState(true);

  async function load(tid: string) {
    const { data, error } = await supabase
      .from("nova_messages")
      .select("id,role,content,created_at")
      .eq("thread_id", tid)
      .order("created_at", { ascending: true });

    if (error) return setMsg(error.message);
    setMessages((data ?? []) as any);
    setMsg("");
  }

  async function send() {
    setMsg("");
    const r = await fetch("/api/nova/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text, node_id: nodeId, thread_id: threadId })
    });

    const j = await r.json().catch(() => ({}));
    if (!r.ok) return setMsg(j?.error ?? "Error");

    const tid = j.thread_id as string;
    if (!threadId) setThreadId(tid);
    setText("");
    await load(tid);

    if (tts && j.reply) speak(String(j.reply));
  }

  useEffect(() => {
    const saved = localStorage.getItem("hocker.threadId");
    if (saved) {
      setThreadId(saved);
      load(saved);
    }
  }, []);

  useEffect(() => {
    if (threadId) localStorage.setItem("hocker.threadId", threadId);
  }, [threadId]);

  return (
    <div style={{ border: "1px solid #e6eefc", borderRadius: 16, padding: 16, background: "#fff" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
        <h2 style={{ margin: 0 }}>Chat con NOVA</h2>

        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: 12, opacity: 0.8 }}>Node</span>
            <input value={nodeId} onChange={(e) => setNodeId(e.target.value)} style={{ padding: 10, borderRadius: 12, border: "1px solid #d6e3ff" }} />
          </label>

          <label style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 12, opacity: 0.85 }}>
            <input type="checkbox" checked={tts} onChange={(e) => setTts(e.target.checked)} />
            Voz (TTS)
          </label>

          <VoiceInput onText={(t) => setText((prev) => (prev ? prev + " " + t : t))} />
        </div>
      </div>

      <div style={{ marginTop: 12, padding: 12, borderRadius: 12, border: "1px solid #eef3ff", background: "#fbfcff", height: 320, overflow: "auto" }}>
        {messages.length === 0 ? (
          <div style={{ opacity: 0.7 }}>No hay mensajes todavía. Escribe o usa voz.</div>
        ) : (
          messages.map((m) => (
            <div key={m.id} style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 12, opacity: 0.65 }}>
                <b>{m.role.toUpperCase()}</b> · {new Date(m.created_at).toLocaleString()}
              </div>
              <div style={{ whiteSpace: "pre-wrap" }}>{m.content}</div>
            </div>
          ))
        )}
      </div>

      <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} placeholder="Escribe aquí..." style={{ padding: 12, borderRadius: 12, border: "1px solid #d6e3ff" }} />
        <button onClick={send} style={{ padding: "12px 14px", cursor: "pointer", borderRadius: 12, border: "1px solid #1e5eff", background: "#1e5eff", color: "#fff" }}>
          Enviar
        </button>
        {msg ? <div style={{ fontSize: 13, opacity: 0.85 }}>{msg}</div> : null}
      </div>
    </div>
  );
}