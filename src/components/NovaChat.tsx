"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase-browser";
import type { NovaMessage } from "@/lib/types";
import VoiceInput from "./VoiceInput";
import { defaultProjectId, normalizeProjectId } from "@/lib/project";

type ChatMsg = NovaMessage & { local_id?: string };

function safeId(prefix = "m") {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`
  );
}

export default function NovaChat() {
  const sb = useMemo(() => createBrowserSupabase(), []);
  const [projectId, setProjectId] = useState<string>(defaultProjectId());
  const pid = useMemo(() => normalizeProjectId(projectId), [projectId]);

  const [threadId, setThreadId] = useState<string | null>(null);

  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  const storageKey = useMemo(() => `hocker.one.threadId.${pid}`, [pid]);

  useEffect(() => {
    const stored =
      typeof window !== "undefined"
        ? window.localStorage.getItem(storageKey)
        : null;
    setThreadId(stored || null);
    setMessages([]);
    setErr(null);
  }, [storageKey]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  async function loadHistory(tid: string) {
    const { data, error } = await sb
      .from("nova_messages")
      .select("id,thread_id,role,content,created_at,project_id")
      .eq("thread_id", tid)
      .eq("project_id", pid)
      .order("created_at", { ascending: true })
      .limit(100);

    if (error) {
      setErr(error.message);
      return;
    }
    setMessages((data as any) ?? []);
  }

  useEffect(() => {
    if (!threadId) return;
    loadHistory(threadId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId, pid]);

  function persistThreadId(tid: string) {
    setThreadId(tid);
    if (typeof window !== "undefined") window.localStorage.setItem(storageKey, tid);
  }

  function startNewThread() {
    setErr(null);
    const tid = safeId("t");
    persistThreadId(tid);
    setMessages([]);
  }

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;

    setErr(null);
    setLoading(true);

    let tid = threadId;
    if (!tid) {
      tid = safeId("t");
      persistThreadId(tid);
    }

    const localUserId = safeId("u");

    setMessages((prev) => [
      ...prev,
      {
        id: localUserId as any,
        thread_id: tid!,
        role: "user",
        content: trimmed,
        created_at: new Date().toISOString(),
        project_id: pid,
        local_id: localUserId,
      } as any,
    ]);

    setInput("");

    const res = await fetch("/api/nova/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        project_id: pid,
        thread_id: tid,
        message: trimmed,
      }),
    });

    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setErr(j?.error ?? `Chat failed (${res.status})`);
      setLoading(false);
      return;
    }

    const j = await res.json();
    const assistantText: string = j.reply ?? "(no reply)";

    setMessages((prev) => [
      ...prev,
      {
        id: safeId("a") as any,
        thread_id: tid!,
        role: "assistant",
        content: assistantText,
        created_at: new Date().toISOString(),
        project_id: pid,
      } as any,
    ]);

    setLoading(false);
  }

  return (
    <div style={{ display: "grid", gap: 12, height: "calc(100vh - 120px)" }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <div style={{ fontWeight: 800 }}>Project</div>
        <input
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          style={{
            flex: 1,
            minWidth: 260,
            padding: "8px 10px",
            borderRadius: 10,
            border: "1px solid #1f2937",
            background: "#0b1220",
            color: "#fff",
          }}
          placeholder="project_id"
        />
        <button
          onClick={startNewThread}
          style={{
            padding: "8px 12px",
            borderRadius: 10,
            border: "1px solid #1f2937",
            background: "#0b1220",
            color: "#fff",
            cursor: "pointer",
            fontWeight: 700,
          }}
        >
          New thread
        </button>
        <div style={{ opacity: 0.7, fontSize: 12 }}>
          thread: {threadId ? threadId.slice(0, 8) + "…" : "—"}
        </div>
      </div>

      {err && (
        <div
          style={{
            padding: 10,
            borderRadius: 12,
            border: "1px solid #7f1d1d",
            background: "rgba(185,28,28,0.15)",
            color: "#fecaca",
          }}
        >
          {err}
        </div>
      )}

      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: 14,
          borderRadius: 16,
          border: "1px solid #1f2937",
          background: "#0b1220",
          color: "#e5e7eb",
        }}
      >
        {messages.length === 0 && (
          <div style={{ opacity: 0.75 }}>
            Chat por proyecto. La memoria vive en Supabase (nova_threads / nova_messages).
          </div>
        )}

        {messages.map((m, idx) => {
          const isUser = m.role === "user";
          return (
            <div
              key={`${m.id ?? idx}`}
              style={{
                display: "flex",
                justifyContent: isUser ? "flex-end" : "flex-start",
                marginBottom: 10,
              }}
            >
              <div
                style={{
                  maxWidth: "78%",
                  padding: "10px 12px",
                  borderRadius: 14,
                  border: "1px solid #111827",
                  background: isUser ? "#060b16" : "rgba(59,130,246,0.12)",
                  color: "#fff",
                  whiteSpace: "pre-wrap",
                  lineHeight: 1.35,
                }}
              >
                <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 6 }}>
                  {isUser ? "You" : "NOVA"} · {new Date(m.created_at).toLocaleString()}
                </div>
                {m.content}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div
        style={{
          display: "grid",
          gap: 10,
          border: "1px solid #1f2937",
          borderRadius: 16,
          padding: 12,
          background: "#0b1220",
        }}
      >
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={2}
            style={{
              flex: 1,
              padding: 10,
              borderRadius: 12,
              border: "1px solid #1f2937",
              background: "#060b16",
              color: "#fff",
              resize: "none",
            }}
            placeholder="Type a message…"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage(input);
              }
            }}
          />

          <button
            onClick={() => sendMessage(input)}
            disabled={loading}
            style={{
              padding: "10px 14px",
              borderRadius: 12,
              border: "1px solid #1f2937",
              background: loading ? "rgba(255,255,255,0.05)" : "#0b1220",
              color: "#fff",
              cursor: loading ? "not-allowed" : "pointer",
              fontWeight: 800,
              minWidth: 110,
            }}
          >
            {loading ? "…" : "Send"}
          </button>

          <VoiceInput disabled={loading} onText={(t) => sendMessage(t)} />
        </div>

        <div style={{ opacity: 0.65, fontSize: 12 }}>
          Tip: Shift+Enter para salto · Cambiar project mantiene thread+memoria separados.
        </div>
      </div>
    </div>
  );
}