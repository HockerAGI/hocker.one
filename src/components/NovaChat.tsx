"use client";

import { useEffect, useMemo, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase-browser";
import { defaultProjectId, normalizeProjectId } from "@/lib/project";

type Msg = {
  id: string;
  role: "user" | "nova" | "system";
  content: string;
  created_at: string;
};

export default function NovaChat() {
  const sb = useMemo(() => createBrowserSupabase(), []);
  const [projectId, setProjectId] = useState(defaultProjectId());
  const [threadId, setThreadId] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    try {
      const storedProject = localStorage.getItem("hocker_project_id");
      const pid = storedProject ? normalizeProjectId(storedProject) : defaultProjectId();
      setProjectId(pid);

      const storedThread = localStorage.getItem(`nova_thread_id:${pid}`);
      if (storedThread) setThreadId(storedThread);
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("hocker_project_id", projectId);
      const storedThread = localStorage.getItem(`nova_thread_id:${projectId}`);
      setThreadId(storedThread ? storedThread : null);
      setMsgs([]);
    } catch {}
  }, [projectId]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!threadId) return;
      setErr(null);

      const { data, error } = await sb
        .from("nova_messages")
        .select("id,role,content,created_at")
        .eq("project_id", projectId)
        .eq("thread_id", threadId)
        .order("created_at", { ascending: true })
        .limit(200);

      if (cancelled) return;
      if (error) setErr(error.message);
      else setMsgs((data ?? []) as any);
    }

    load();
    const t = setInterval(load, 2500);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [sb, projectId, threadId]);

  async function send() {
    setErr(null);
    const v = text.trim();
    if (!v) return;

    setSending(true);

    const r = await fetch("/api/nova/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        project_id: projectId,
        text: v,
        thread_id: threadId
      })
    });

    const j = await r.json().catch(() => ({}));
    setSending(false);

    if (!r.ok) {
      setErr(j?.error ?? "Error");
      return;
    }

    const newThread = String(j.thread_id ?? "");
    if (newThread) {
      setThreadId(newThread);
      try {
        localStorage.setItem(`nova_thread_id:${projectId}`, newThread);
      } catch {}
    }

    setText("");
  }

  return (
    <div className="rounded-lg border p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-semibold">NOVA Chat</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs opacity-70">Project</span>
          <input
            className="rounded border px-3 py-2 text-sm"
            value={projectId}
            onChange={(e) => setProjectId(normalizeProjectId(e.target.value))}
          />
        </div>
      </div>

      {err && <div className="text-sm text-red-600">{err}</div>}

      <div className="h-[340px] overflow-auto rounded border p-3 space-y-2">
        {msgs.map((m) => (
          <div key={m.id} className={m.role === "user" ? "text-right" : "text-left"}>
            <div className="text-xs opacity-60">{m.role.toUpperCase()}</div>
            <div className="inline-block rounded border px-3 py-2 max-w-[90%]">
              {m.content}
            </div>
          </div>
        ))}
        {msgs.length === 0 && <div className="opacity-60 text-sm">Sin mensajes</div>}
      </div>

      <div className="flex gap-2">
        <input
          className="flex-1 rounded border px-3 py-2"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Escribe…"
          onKeyDown={(e) => {
            if (e.key === "Enter") send();
          }}
        />
        <button
          className="rounded bg-black text-white px-4 disabled:opacity-60"
          onClick={send}
          disabled={sending}
        >
          {sending ? "…" : "Enviar"}
        </button>
      </div>
    </div>
  );
}