"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase-browser";
import { defaultProjectId, normalizeProjectId } from "@/lib/project";

type Msg = {
  id: string;
  thread_id: string;
  project_id: string;
  role: "user" | "nova" | "assistant" | "system";
  content: string;
  created_at: string;
};

function uuidv4() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    // @ts-ignore
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function threadKey(pid: string) {
  return `hocker.threadId.${pid}`;
}

function hasSpeechRecognition() {
  if (typeof window === "undefined") return false;
  // @ts-ignore
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export default function NovaChat() {
  const sb = useMemo(() => createBrowserSupabase(), []);

  const [projectId, setProjectId] = useState<string>(defaultProjectId());
  const pid = useMemo(() => normalizeProjectId(projectId), [projectId]);

  const [threadId, setThreadId] = useState<string>(() => {
    try {
      const k = threadKey(normalizeProjectId(defaultProjectId()));
      return window.localStorage.getItem(k) || uuidv4();
    } catch {
      return uuidv4();
    }
  });

  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Router UI (optional)
  const [prefer, setPrefer] = useState<"auto" | "openai" | "gemini">("auto");
  const [mode, setMode] = useState<"auto" | "fast" | "pro">("auto");
  const [allowActions, setAllowActions] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    try {
      const k = threadKey(pid);
      const existing = window.localStorage.getItem(k);
      if (existing) setThreadId(existing);
      else {
        const n = uuidv4();
        window.localStorage.setItem(k, n);
        setThreadId(n);
      }
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pid]);

  async function loadHistory(currentPid: string, currentThread: string) {
    setErr(null);
    try {
      const { data, error } = await sb
        .from("nova_messages")
        .select("id, project_id, thread_id, role, content, created_at")
        .eq("project_id", currentPid)
        .eq("thread_id", currentThread)
        .order("created_at", { ascending: true })
        .limit(250);

      if (error) throw error;
      setMsgs((data as Msg[]) ?? []);
    } catch (e: any) {
      setMsgs([]);
      setErr(e?.message ?? "No se pudo cargar el historial.");
    }
  }

  useEffect(() => {
    loadHistory(pid, threadId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pid, threadId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs.length, loading]);

  function setThreadAndPersist(newThreadId: string) {
    setThreadId(newThreadId);
    try {
      window.localStorage.setItem(threadKey(pid), newThreadId);
    } catch {
      // ignore
    }
  }

  async function newThread() {
    const n = uuidv4();
    setThreadAndPersist(n);
    setMsgs([]);
    setErr(null);
  }

  async function send(text: string) {
    const t = text.trim();
    if (!t || loading) return;

    setErr(null);
    setLoading(true);

    const optimisticUser: Msg = {
      id: `local-${Date.now()}-u`,
      project_id: pid,
      thread_id: threadId,
      role: "user",
      content: t,
      created_at: new Date().toISOString(),
    };
    setMsgs((m) => [...m, optimisticUser]);
    setInput("");

    try {
      const headers: Record<string, string> = { "content-type": "application/json" };
      if (allowActions) headers["x-allow-actions"] = "1"; // /api/nova/chat valida rol y decide

      const res = await fetch("/api/nova/chat", {
        method: "POST",
        headers,
        body: JSON.stringify({
          project_id: pid,
          thread_id: threadId,
          message: t,
          text: t, // compat
          prefer,
          mode,
        }),
      });

      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || "NOVA no respondió.");

      if (typeof j?.thread_id === "string" && j.thread_id !== threadId) {
        setThreadAndPersist(j.thread_id);
      }

      const reply = String(j?.reply ?? "").trim();
      if (reply) {
        const optimisticNova: Msg = {
          id: `local-${Date.now()}-n`,
          project_id: pid,
          thread_id: (j?.thread_id ?? threadId) as string,
          role: "nova",
          content: reply,
          created_at: new Date().toISOString(),
        };
        setMsgs((m) => [...m, optimisticNova]);
      }
    } catch (e: any) {
      setErr(e?.message ?? "No se pudo enviar el mensaje.");
    } finally {
      setLoading(false);
    }
  }

  async function startVoice() {
    if (loading) return;
    if (!hasSpeechRecognition()) return;

    // @ts-ignore
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = "es-MX";
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    rec.onresult = (e: any) => {
      const t = e?.results?.[0]?.[0]?.transcript;
      if (t && typeof t === "string") send(t);
    };

    rec.start();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <div className="text-lg font-semibold text-slate-900">NOVA Chat</div>
          <div className="text-sm text-slate-500">
            Conversación por proyecto + thread separado. (Memoria en Supabase via nova.agi)
          </div>
        </div>

        <div className="flex flex-col gap-2 md:flex-row md:items-end">
          <div className="w-full md:w-[320px]">
            <label className="text-xs font-semibold text-slate-600">Project</label>
            <input
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-400"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              placeholder="global"
            />
          </div>

          <button
            onClick={newThread}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
            disabled={loading}
            title="Nuevo thread para este proyecto"
          >
            New thread
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-4 py-3">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="text-xs text-slate-500">
              <span className="font-semibold text-slate-700">project:</span> {pid} ·{" "}
              <span className="font-semibold text-slate-700">thread:</span>{" "}
              <span className="font-mono">{threadId}</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-800 outline-none"
                value={prefer}
                onChange={(e) => setPrefer(e.target.value as any)}
                title="Provider prefer"
              >
                <option value="auto">prefer: auto</option>
                <option value="openai">prefer: openai</option>
                <option value="gemini">prefer: gemini</option>
              </select>

              <select
                className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-800 outline-none"
                value={mode}
                onChange={(e) => setMode(e.target.value as any)}
                title="Mode"
              >
                <option value="auto">mode: auto</option>
                <option value="fast">mode: fast</option>
                <option value="pro">mode: pro</option>
              </select>

              <label className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-800">
                <input
                  type="checkbox"
                  className="h-3 w-3"
                  checked={allowActions}
                  onChange={(e) => setAllowActions(e.target.checked)}
                />
                actions
              </label>
            </div>
          </div>
        </div>

        <div className="max-h-[520px] overflow-auto px-4 py-4">
          {err && (
            <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {err}
            </div>
          )}

          {msgs.length === 0 && !loading && (
            <div className="text-sm text-slate-500">Sin mensajes todavía. Escribe algo.</div>
          )}

          <div className="space-y-3">
            {msgs.map((m) => (
              <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                    m.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-slate-50 text-slate-900 border border-slate-200"
                  }`}
                >
                  <div className="whitespace-pre-wrap">{m.content}</div>
                  <div className={`mt-2 text-[11px] ${m.role === "user" ? "text-blue-100" : "text-slate-500"}`}>
                    {new Date(m.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}

            {loading && <div className="text-sm text-slate-500">NOVA está escribiendo…</div>}
            <div ref={bottomRef} />
          </div>
        </div>

        <div className="border-t border-slate-200 px-4 py-3">
          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <input
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-400"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe tu mensaje…"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
              disabled={loading}
            />

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={startVoice}
                disabled={loading || !hasSpeechRecognition()}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 hover:bg-slate-50 disabled:opacity-50"
                title={hasSpeechRecognition() ? "Dicta por voz" : "SpeechRecognition no disponible"}
              >
                Voice
              </button>

              <button
                onClick={() => send(input)}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                disabled={loading || !input.trim()}
              >
                Send
              </button>
            </div>
          </div>

          <div className="mt-2 text-[11px] text-slate-500">
            Tip: si activas <span className="font-semibold">actions</span>, el server igual valida rol (admin/owner) y el header.
          </div>
        </div>
      </div>
    </div>
  );
}