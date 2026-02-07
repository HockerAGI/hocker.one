"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase-browser";
import { defaultNodeId, defaultProjectId, normalizeProjectId } from "@/lib/project";
import VoiceInput from "@/components/VoiceInput";

type Msg = { id: string; role: "user" | "nova" | "system"; content: string; created_at: string };

export default function NovaChat() {
  const supabase = useMemo(() => createBrowserSupabase(), []);
  const [projectId, setProjectId] = useState(defaultProjectId());
  const [nodeId, setNodeId] = useState(defaultNodeId());
  const pid = useMemo(() => normalizeProjectId(projectId), [projectId]);

  const [threadId, setThreadId] = useState<string | null>(null);
  const [rows, setRows] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // cambiar proyecto = cambiar “cuarto”
    setThreadId(null);
    setRows([]);
  }, [pid]);

  async function ensureThread() {
    const r = await fetch("/api/nova/thread", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ project_id: pid })
    });
    const j = await r.json().catch(() => ({}));
    if (j.thread_id) setThreadId(j.thread_id);
  }

  async function load(tid: string) {
    const { data } = await supabase
      .from("nova_messages")
      .select("id,role,content,created_at")
      .eq("project_id", pid)
      .eq("thread_id", tid)
      .order("created_at", { ascending: true })
      .limit(250);

    setRows((data as any) ?? []);
    setTimeout(() => listRef.current?.scrollTo({ top: 999999, behavior: "smooth" }), 10);
  }

  useEffect(() => {
    ensureThread();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pid]);

  useEffect(() => {
    if (!threadId) return;
    load(threadId);

    const ch = supabase
      .channel(`nova-msgs-${threadId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "nova_messages", filter: `thread_id=eq.${threadId}` },
        () => load(threadId)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId]);

  async function send(t?: string) {
    if (!threadId) return;
    const msg = (t ?? text).trim();
    if (!msg) return;

    setSending(true);
    setText("");

    await fetch("/api/nova/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ project_id: pid, thread_id: threadId, node_id: nodeId, text: msg })
    }).catch(() => {});

    setSending(false);
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">NOVA</h2>
          <p className="text-sm text-slate-500">Habla normal. NOVA te guía y ejecuta (con control).</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="flex flex-col">
            <label className="text-xs text-slate-500">Proyecto</label>
            <input
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              placeholder="global"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-slate-500">Node</label>
            <input
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
              value={nodeId}
              onChange={(e) => setNodeId(e.target.value)}
              placeholder="node-cloudrun-01"
            />
          </div>
        </div>
      </div>

      <div ref={listRef} className="mt-4 h-[420px] overflow-auto rounded-2xl border border-slate-200 bg-slate-50 p-3">
        {rows.length === 0 ? (
          <div className="text-sm text-slate-500">Di: “Nova, estatus del ecosistema”.</div>
        ) : (
          <div className="space-y-2">
            {rows.map((m) => (
              <div
                key={m.id}
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                  m.role === "user"
                    ? "ml-auto bg-blue-600 text-white"
                    : m.role === "system"
                    ? "mr-auto border border-red-200 bg-white text-red-700"
                    : "mr-auto border border-slate-200 bg-white text-slate-900"
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
          className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200"
          placeholder="Escribe aquí…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
        />
        <VoiceInput onText={(t) => send(t)} disabled={sending} />
        <button
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          onClick={() => send()}
          disabled={sending}
        >
          {sending ? "…" : "Enviar"}
        </button>
      </div>
    </div>
  );
}