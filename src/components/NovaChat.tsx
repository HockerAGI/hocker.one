"use client";

import { useEffect, useMemo, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase-browser";
import { defaultProjectId, normalizeProjectId } from "@/lib/project";
import VoiceInput from "@/components/VoiceInput";

type Msg = { id: string; role: "user" | "nova"; content: string; created_at: string };

export default function NovaChat() {
  const supabase = useMemo(() => createBrowserSupabase(), []);

  const [projectId, setProjectId] = useState(defaultProjectId());
  const pid = useMemo(() => normalizeProjectId(projectId), [projectId]);

  const [nodeId, setNodeId] = useState(process.env.NEXT_PUBLIC_HOCKER_DEFAULT_NODE_ID ?? "node-hocker-01");
  const [threadId, setThreadId] = useState<string | null>(null);

  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  // Cambias proyecto = cambias cuarto (no mezcles chats)
  useEffect(() => {
    setThreadId(null);
    setMessages([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pid]);

  async function loadMessages(tid: string) {
    const { data, error } = await supabase
      .from("nova_messages")
      .select("id, role, content, created_at")
      .eq("project_id", pid)
      .eq("thread_id", tid)
      .order("created_at", { ascending: true });

    if (!error) {
      const norm = (data ?? []).map((m: any) => ({
        id: m.id,
        role: m.role === "user" ? "user" : "nova",
        content: m.content,
        created_at: m.created_at
      }));
      setMessages(norm as any);
    }
  }

  async function ensureThread(): Promise<string> {
    if (threadId) return threadId;

    const r = await fetch("/api/nova/thread", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ project_id: pid })
    });

    const j = await r.json().catch(() => ({}));
    const tid = String(j.thread_id ?? "");
    if (!tid) throw new Error("No se pudo crear thread");

    setThreadId(tid);
    return tid;
  }

  async function sendText(t: string) {
    const msg = t.trim();
    if (!msg) return;

    setLoading(true);
    setText("");

    try {
      const tid = await ensureThread();

      // Optimista: lo pintamos al instante
      setMessages((m) => [
        ...m,
        { id: crypto.randomUUID(), role: "user", content: msg, created_at: new Date().toISOString() } as any
      ]);

      await fetch("/api/nova/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ project_id: pid, thread_id: tid, node_id: nodeId, text: msg })
      });

      await loadMessages(tid);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">NOVA Chat</h2>
          <p className="text-sm text-slate-500">Conversación por proyecto (no se mezcla).</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="flex flex-col">
            <label className="text-xs text-slate-500">Proyecto</label>
            <input
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              placeholder="global / chido / supply..."
            />
          </div>

          <div className="flex flex-col">
            <label className="text-xs text-slate-500">Node</label>
            <input
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
              value={nodeId}
              onChange={(e) => setNodeId(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="mt-4 h-[420px] overflow-auto rounded-2xl border border-slate-200 bg-slate-50 p-3">
        {messages.length === 0 ? (
          <div className="text-sm text-slate-500">Escribe o dicta para empezar…</div>
        ) : (
          <div className="space-y-2">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                  m.role === "user"
                    ? "ml-auto bg-slate-900 text-white"
                    : "mr-auto bg-white text-slate-900 border border-slate-200"
                }`}
              >
                {m.content}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-3 flex gap-2 items-center">
        <input
          className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Escribe aquí…"
          onKeyDown={(e) => {
            if (e.key === "Enter") sendText(text);
          }}
        />
        <button
          onClick={() => sendText(text)}
          disabled={loading}
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {loading ? "..." : "Enviar"}
        </button>

        <VoiceInput onText={(t) => sendText(t)} disabled={loading} />
      </div>
    </div>
  );
}