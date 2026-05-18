"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Activity, Bot, Brain, CheckCircle2, Loader2, Paperclip, PlugZap, Send, ShieldCheck, Sparkles, XCircle } from "lucide-react";
import { useWorkspace } from "@/components/WorkspaceContext";

type Mode = "auto" | "fast" | "pro";
type Msg = { id: string; role: "user" | "nova" | "system"; content: string; createdAt: number; streaming?: boolean };
type Integration = { tool_key: string; name: string; provider: string; status: "configured" | "missing"; supports_read: boolean; supports_write: boolean; supports_realtime: boolean; safe_note: string };

type RuntimeSummary = {
  counts?: { agents: number; tools_configured: number; tools_total: number; actions: number; runs: number };
  integrations?: Integration[];
  schema_ready?: boolean;
  message?: string;
};

const MODE_LABEL: Record<Mode, string> = { auto: "Auto", fast: "Rápido", pro: "Profundo" };
const DEFAULT_TOOLS = ["github", "supabase", "vercel", "meta_ads"];

function id() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function pickContent(data: unknown): string {
  if (typeof data === "string") return data;
  if (!data || typeof data !== "object") return "";
  const item = data as Record<string, unknown>;
  for (const key of ["delta", "content", "reply", "message", "text"]) {
    if (typeof item[key] === "string") return item[key] as string;
  }
  return "";
}

export default function NovaRealtimeChat() {
  const { projectId } = useWorkspace();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<Mode>("auto");
  const [selectedTools, setSelectedTools] = useState<string[]>(DEFAULT_TOOLS);
  const [summary, setSummary] = useState<RuntimeSummary | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [threadId] = useState(id);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const integrations = useMemo(() => summary?.integrations ?? [], [summary]);
  const configured = integrations.filter((item) => item.status === "configured");
  const visibleIntegrations = integrations.filter((item) => ["github", "supabase", "vercel", "meta_ads", "openai", "gemini"].includes(item.tool_key));

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, isSending]);

  useEffect(() => {
    let alive = true;
    fetch(`/api/agi/runtime/summary?project_id=${encodeURIComponent(projectId)}`, { credentials: "include", cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (alive) setSummary(data.summary ?? null);
      })
      .catch((err) => {
        if (alive) setError(err instanceof Error ? err.message : "No se pudo leer AGI Runtime.");
      });
    return () => { alive = false; abortRef.current?.abort(); };
  }, [projectId]);

  function toggleTool(toolKey: string) {
    setSelectedTools((prev) => prev.includes(toolKey) ? prev.filter((key) => key !== toolKey) : [...prev, toolKey]);
  }

  async function send(event: FormEvent) {
    event.preventDefault();
    const prompt = input.trim();
    if (!prompt || isSending) return;

    const userMsg: Msg = { id: id(), role: "user", content: prompt, createdAt: Date.now() };
    const novaId = id();
    setMessages((prev) => [...prev, userMsg, { id: novaId, role: "nova", content: "", createdAt: Date.now(), streaming: true }]);
    setInput("");
    setIsSending(true);
    setError(null);

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    try {
      const res = await fetch("/api/nova/chat/stream", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        signal: abortRef.current.signal,
        body: JSON.stringify({
          project_id: projectId,
          thread_id: threadId,
          message: prompt,
          mode,
          allow_actions: true,
          tools_requested: selectedTools,
          context_data: {
            selected_tools: selectedTools,
            source: "nova_realtime_chat",
            expectation: "respuesta útil, contexto real, acciones solo con aprobación",
          },
        }),
      });

      if (!res.ok || !res.body) throw new Error(`NOVA realtime HTTP ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let received = false;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";

        for (const raw of events) {
          const dataLine = raw.split("\n").find((line) => line.startsWith("data:"));
          if (!dataLine) continue;
          const rawData = dataLine.replace(/^data:\s*/, "");
          if (!rawData || rawData === "[DONE]") continue;
          let parsed: unknown = rawData;
          try { parsed = JSON.parse(rawData); } catch {}

          const maybeError = parsed && typeof parsed === "object" ? (parsed as { error?: unknown }).error : null;
          if (typeof maybeError === "string") {
            setError(maybeError);
            continue;
          }

          const piece = pickContent(parsed);
          if (!piece) continue;
          received = true;
          setMessages((prev) => prev.map((msg) => msg.id === novaId ? { ...msg, content: `${msg.content}${piece}`, streaming: true } : msg));
        }
      }

      setMessages((prev) => prev.map((msg) => msg.id === novaId ? { ...msg, content: msg.content || (received ? msg.content : "NOVA respondió sin texto visible."), streaming: false } : msg));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Fallo en NOVA realtime.";
      setError(msg);
      setMessages((prev) => prev.map((item) => item.id === novaId ? { ...item, role: "system", content: msg, streaming: false } : item));
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="flex h-full min-h-[66dvh] flex-col overflow-hidden rounded-[30px] border border-cyan-300/10 bg-slate-950/35 shadow-[0_24px_90px_rgba(2,6,23,0.34)]">
      <header className="border-b border-white/5 bg-white/[0.025] p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.26em] text-cyan-200"><Activity className="h-4 w-4" /> NOVA realtime</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-white">Chat operativo</h2>
            <p className="mt-1 text-sm leading-6 text-slate-400">Respuesta en vivo, contexto del runtime y acceso a integraciones configuradas. Las acciones sensibles quedan en aprobación.</p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-100"><ShieldCheck className="h-4 w-4" /> privado</span>
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {visibleIntegrations.map((tool) => {
            const selected = selectedTools.includes(tool.tool_key);
            const isReady = tool.status === "configured";
            return (
              <button key={tool.tool_key} type="button" onClick={() => toggleTool(tool.tool_key)} className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] transition ${selected ? "border-cyan-300/30 bg-cyan-400/12 text-cyan-100" : "border-white/10 bg-white/[0.03] text-slate-400"}`}>
                {isReady ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" /> : <XCircle className="h-3.5 w-3.5 text-amber-200" />}
                {tool.name}
              </button>
            );
          })}
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-2"><p className="text-[9px] font-black uppercase tracking-widest text-slate-500">AGIs</p><strong className="text-lg text-white">{summary?.counts?.agents ?? 16}</strong></div>
          <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-2"><p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Tools</p><strong className="text-lg text-white">{configured.length}/{integrations.length || "—"}</strong></div>
          <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-2"><p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Acciones</p><strong className="text-lg text-white">{summary?.counts?.actions ?? 0}</strong></div>
        </div>
      </header>

      <main ref={scrollRef} className="custom-scrollbar flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="grid min-h-[30dvh] place-items-center text-center">
            <div className="max-w-xl">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-[24px] border border-cyan-300/20 bg-cyan-400/10 shadow-[0_0_40px_rgba(34,211,238,0.18)]"><Bot className="h-7 w-7 text-cyan-100" /></div>
              <h3 className="mt-4 text-2xl font-black text-white">Dile a NOVA qué operar o revisar.</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">Ejemplo: revisa GitHub y Vercel, dime qué falta para cerrar el sprint, sin inventar datos.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[86%] rounded-[26px] border px-4 py-3 text-sm leading-7 ${msg.role === "user" ? "border-cyan-300/20 bg-cyan-400/12 text-cyan-50" : msg.role === "system" ? "border-rose-300/20 bg-rose-500/10 text-rose-100" : "border-white/8 bg-white/[0.045] text-slate-100"}`}>
                  <p className="mb-1 flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.18em] text-cyan-200">{msg.role === "nova" ? <Sparkles className="h-3.5 w-3.5" /> : msg.role === "user" ? <Brain className="h-3.5 w-3.5" /> : <PlugZap className="h-3.5 w-3.5" />} {msg.role === "user" ? "Tú" : msg.role === "nova" ? "NOVA" : "Sistema"}</p>
                  <p className="whitespace-pre-wrap">{msg.content}{msg.streaming ? "▌" : ""}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {error ? <div className="mx-4 mb-2 rounded-2xl border border-rose-300/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-100">{error}</div> : null}

      <form onSubmit={send} className="border-t border-white/5 bg-slate-950/55 p-3">
        <div className="mb-2 flex gap-2">
          {(["auto", "fast", "pro"] as Mode[]).map((item) => (
            <button key={item} type="button" onClick={() => setMode(item)} className={`rounded-full border px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] ${mode === item ? "border-cyan-300/30 bg-cyan-400/12 text-cyan-100" : "border-white/8 bg-white/[0.03] text-slate-400"}`}>{MODE_LABEL[item]}</button>
          ))}
        </div>
        <div className="flex items-end gap-2 rounded-[24px] border border-white/8 bg-white/[0.035] p-2">
          <button type="button" className="grid h-11 w-11 place-items-center rounded-2xl border border-white/8 bg-white/[0.03] text-slate-300"><Paperclip className="h-5 w-5" /></button>
          <textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder="Escribe una instrucción clara para NOVA..." rows={1} className="custom-scrollbar max-h-32 min-h-11 flex-1 resize-none rounded-2xl border border-white/5 bg-slate-950/50 px-3 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-300/25" onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(e as unknown as FormEvent); } }} />
          <button type="submit" disabled={!input.trim() || isSending} className="grid h-11 w-11 place-items-center rounded-2xl bg-cyan-300 text-slate-950 disabled:opacity-45">{isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}</button>
        </div>
      </form>
    </div>
  );
}
