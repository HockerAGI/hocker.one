"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase-browser";
import type { CommandStatus, Role } from "@/lib/types";

type Project = { id: string; name: string | null };
type Controls = { kill_switch: boolean; allow_write: boolean; updated_at?: string | null };

type CmdRow = {
  id: string;
  project_id: string;
  node_id: string | null;
  command: string;
  status: CommandStatus;
  needs_approval: boolean;
  payload: any;
  signature?: string | null;
  result?: any;
  error?: string | null;
  created_at: string;
  approved_at?: string | null;
  executed_at?: string | null;
};

type EventRow = {
  id: string;
  project_id: string;
  node_id: string | null;
  level: "info" | "warn" | "error";
  type: string;
  message: string;
  data?: any;
  created_at: string;
};

function cx(...a: Array<string | false | null | undefined>) {
  return a.filter(Boolean).join(" ");
}

function fmtDT(s?: string | null) {
  if (!s) return "—";
  try {
    const d = new Date(s);
    return d.toLocaleString();
  } catch {
    return s;
  }
}

function pill(status: CommandStatus) {
  const base = "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold";
  switch (status) {
    case "needs_approval":
      return cx(base, "bg-amber-100 text-amber-800");
    case "queued":
      return cx(base, "bg-slate-100 text-slate-800");
    case "running":
      return cx(base, "bg-blue-100 text-blue-800");
    case "done":
      return cx(base, "bg-emerald-100 text-emerald-800");
    case "failed":
      return cx(base, "bg-red-100 text-red-800");
    case "cancelled":
      return cx(base, "bg-zinc-100 text-zinc-700");
    default:
      return cx(base, "bg-slate-100 text-slate-800");
  }
}

function safeJsonParse(raw: string) {
  const t = raw.trim();
  if (!t) return {};
  try {
    return JSON.parse(t);
  } catch {
    return null;
  }
}

function bestReply(data: any): string {
  if (!data) return "";
  if (typeof data.reply === "string") return data.reply;
  if (typeof data.text === "string") return data.text;
  if (typeof data.message === "string") return data.message;
  if (typeof data.output === "string") return data.output;
  if (typeof data?.assistant?.content === "string") return data.assistant.content;
  if (Array.isArray(data?.messages)) {
    const last = [...data.messages].reverse().find((m: any) => m?.role === "assistant" && typeof m?.content === "string");
    if (last?.content) return last.content;
  }
  return typeof data === "string" ? data : JSON.stringify(data);
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-lg font-semibold text-slate-900">{value}</div>
    </div>
  );
}

function Card({
  title,
  subtitle,
  right,
  children,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
        <div>
          <div className="text-sm font-semibold text-slate-900">{title}</div>
          {subtitle ? <div className="mt-0.5 text-xs text-slate-500">{subtitle}</div> : null}
        </div>
        {right ? <div className="shrink-0">{right}</div> : null}
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

export default function DashboardPage() {
  const sb = useMemo(() => createBrowserSupabase(), []);

  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState<string>("global");

  const [controls, setControls] = useState<Controls | null>(null);

  const [commands, setCommands] = useState<CmdRow[]>([]);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [nodesCount, setNodesCount] = useState<number>(0);

  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  // Chat
  const [allowActions, setAllowActions] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatLog, setChatLog] = useState<Array<{ role: "user" | "assistant"; content: string; at: string }>>([]);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Commands composer
  const [cmdNode, setCmdNode] = useState("node-1");
  const [cmdName, setCmdName] = useState("ping");
  const [cmdPayloadRaw, setCmdPayloadRaw] = useState<string>("{}");

  // Events composer
  const [evtLevel, setEvtLevel] = useState<"info" | "warn" | "error">("info");
  const [evtType, setEvtType] = useState("manual.note");
  const [evtNode, setEvtNode] = useState("");
  const [evtMessage, setEvtMessage] = useState("");

  useEffect(() => {
    let alive = true;

    (async () => {
      const { data } = await sb.auth.getUser();
      if (!alive) return;
      setUserEmail(data.user?.email ?? null);
    })();

    const { data: sub } = sb.auth.onAuthStateChange((_e, session) => {
      setUserEmail(session?.user?.email ?? null);
    });

    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, [sb]);

  useEffect(() => {
    (async () => {
      // Projects (RLS: solo miembros)
      const { data, error } = await sb.from("projects").select("id,name").order("id", { ascending: true });
      if (error) {
        setToast({ type: "err", msg: `No pude cargar proyectos: ${error.message}` });
        setProjects([{ id: "global", name: "Global" }]);
        setProjectId("global");
        return;
      }
      const list = (data ?? []) as Project[];
      setProjects(list.length ? list : [{ id: "global", name: "Global" }]);
      if (!list.find((p) => p.id === projectId)) setProjectId(list[0]?.id ?? "global");
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sb]);

  async function apiGET<T>(url: string): Promise<T> {
    const res = await fetch(url, { method: "GET" });
    const text = await res.text();
    let data: any = {};
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }
    if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
    return data as T;
  }

  async function apiPOST<T>(url: string, body: any, extra?: { headers?: Record<string, string> }): Promise<T> {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", ...(extra?.headers ?? {}) },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    let data: any = {};
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }
    if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
    return data as T;
  }

  async function refreshAll() {
    setBusy(true);
    setToast(null);
    try {
      // Controls
      const c = await apiGET<{ ok: boolean; controls: Controls }>(`/api/governance/killswitch?project_id=${encodeURIComponent(projectId)}`);
      setControls(c.controls);

      // Commands + Events (via API para evitar “RLS sorpresa”)
      const cl = await apiGET<{ ok: boolean; items: CmdRow[] }>(`/api/commands?project_id=${encodeURIComponent(projectId)}`);
      setCommands(cl.items ?? []);

      const el = await apiGET<{ ok: boolean; items: EventRow[] }>(`/api/events/manual?project_id=${encodeURIComponent(projectId)}`);
      setEvents(el.items ?? []);

      // Nodes count (direct Supabase)
      const { count, error } = await sb.from("nodes").select("id", { count: "exact", head: true }).eq("project_id", projectId);
      if (!error) setNodesCount(count ?? 0);
    } catch (e: any) {
      setToast({ type: "err", msg: e?.message ?? "Error refrescando dashboard." });
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatLog.length]);

  async function sendChat() {
    const message = chatInput.trim();
    if (!message) return;

    setChatInput("");
    const now = new Date().toISOString();
    setChatLog((p) => [...p, { role: "user", content: message, at: now }]);

    try {
      const data = await apiPOST<any>(
        "/api/nova/chat",
        { project_id: projectId, message, mode: "auto", prefer: "auto" },
        { headers: allowActions ? { "x-allow-actions": "1" } : {} }
      );
      const reply = bestReply(data) || "(sin respuesta)";
      setChatLog((p) => [...p, { role: "assistant", content: reply, at: new Date().toISOString() }]);
    } catch (e: any) {
      setChatLog((p) => [
        ...p,
        {
          role: "assistant",
          content: `⚠️ Error: ${e?.message ?? "NOVA no respondió"}`,
          at: new Date().toISOString(),
        },
      ]);
    }
  }

  async function createCommand() {
    const payload = safeJsonParse(cmdPayloadRaw);
    if (payload === null) {
      setToast({ type: "err", msg: "Payload inválido (JSON). Corrige antes de enviar." });
      return;
    }
    setBusy(true);
    setToast(null);
    try {
      const res = await apiPOST<{ ok: boolean; command: CmdRow; needs_approval: boolean }>(
        "/api/commands",
        { project_id: projectId, node_id: cmdNode.trim(), command: cmdName.trim(), payload: payload ?? {} }
      );
      setToast({
        type: "ok",
        msg: res.needs_approval ? "Acción creada: esperando aprobación." : "Acción creada y enviada a cola.",
      });
      await refreshAll();
    } catch (e: any) {
      setToast({ type: "err", msg: e?.message ?? "No pude crear la acción." });
    } finally {
      setBusy(false);
    }
  }

  async function approve(id: string) {
    setBusy(true);
    setToast(null);
    try {
      await apiPOST("/api/commands/approve", { project_id: projectId, id });
      setToast({ type: "ok", msg: "Acción aprobada → queued." });
      await refreshAll();
    } catch (e: any) {
      setToast({ type: "err", msg: e?.message ?? "No pude aprobar." });
    } finally {
      setBusy(false);
    }
  }

  async function reject(id: string) {
    setBusy(true);
    setToast(null);
    try {
      await apiPOST("/api/commands/reject", { project_id: projectId, id, reason: "Rechazada desde dashboard." });
      setToast({ type: "ok", msg: "Acción rechazada → cancelled." });
      await refreshAll();
    } catch (e: any) {
      setToast({ type: "err", msg: e?.message ?? "No pude rechazar." });
    } finally {
      setBusy(false);
    }
  }

  async function saveControls(next: Controls) {
    setBusy(true);
    setToast(null);
    try {
      const res = await apiPOST<{ ok: boolean; controls: Controls }>("/api/governance/killswitch", {
        project_id: projectId,
        kill_switch: !!next.kill_switch,
        allow_write: !!next.allow_write,
      });
      setControls(res.controls);
      setToast({ type: "ok", msg: "Governance actualizada." });
      await refreshAll();
    } catch (e: any) {
      setToast({ type: "err", msg: e?.message ?? "No pude guardar governance (requiere owner)." });
    } finally {
      setBusy(false);
    }
  }

  async function pushEvent() {
    const msg = evtMessage.trim();
    if (!msg) return;
    setBusy(true);
    setToast(null);
    try {
      await apiPOST("/api/events/manual", {
        project_id: projectId,
        node_id: evtNode.trim() || null,
        level: evtLevel,
        type: evtType.trim() || "manual.note",
        message: msg,
        data: null,
      });
      setEvtMessage("");
      setToast({ type: "ok", msg: "Evento registrado." });
      await refreshAll();
    } catch (e: any) {
      setToast({ type: "err", msg: e?.message ?? "No pude registrar evento." });
    } finally {
      setBusy(false);
    }
  }

  const pending = commands.filter((c) => c.status === "needs_approval").length;
  const queued = commands.filter((c) => c.status === "queued").length;
  const running = commands.filter((c) => c.status === "running").length;
  const done = commands.filter((c) => c.status === "done").length;
  const failed = commands.filter((c) => c.status === "failed").length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-6">
        {/* Top bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-slate-500">HOCKER.ONE</div>
            <div className="mt-1 text-2xl font-semibold text-slate-900">Control Plane</div>
            <div className="mt-1 text-sm text-slate-600">
              Proyecto: <span className="font-semibold">{projectId}</span> · Usuario:{" "}
              <span className="font-semibold">{userEmail ?? "—"}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.id} {p.name ? `— ${p.name}` : ""}
                </option>
              ))}
            </select>

            <button
              className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold hover:bg-slate-50 disabled:opacity-60"
              onClick={refreshAll}
              disabled={busy}
            >
              {busy ? "Actualizando…" : "Refresh"}
            </button>
          </div>
        </div>

        {/* Toast */}
        {toast ? (
          <div
            className={cx(
              "mt-4 rounded-2xl border px-4 py-3 text-sm",
              toast.type === "ok" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-800"
            )}
          >
            {toast.msg}
          </div>
        ) : null}

        {/* Mini stats */}
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <MiniStat label="Nodes" value={`${nodesCount}`} />
          <MiniStat label="Needs approval" value={`${pending}`} />
          <MiniStat label="Queued" value={`${queued}`} />
          <MiniStat label="Running" value={`${running}`} />
          <MiniStat label="Done" value={`${done}`} />
          <MiniStat label="Failed" value={`${failed}`} />
        </div>

        {/* Main grid */}
        <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Left: NOVA */}
          <div className="lg:col-span-2">
            <Card
              title="NOVA — Chat"
              subtitle="POST /api/nova/chat (forward real). Si NOVA_AGI_URL o NOVA_ORCHESTRATOR_KEY faltan, aquí lo verás sin humo."
              right={
                <label className="flex select-none items-center gap-2 text-xs text-slate-600">
                  <input
                    type="checkbox"
                    checked={allowActions}
                    onChange={(e) => setAllowActions(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  Permitir acciones (header x-allow-actions=1)
                </label>
              }
            >
              <div className="flex h-[340px] flex-col rounded-2xl border border-slate-200 bg-slate-50">
                <div className="flex-1 overflow-auto p-4">
                  {chatLog.length === 0 ? (
                    <div className="text-sm text-slate-500">
                      Escribe un comando o pregunta. Ejemplos: <span className="font-semibold">“estado del sistema”</span>,{" "}
                      <span className="font-semibold">“lista últimos eventos”</span>,{" "}
                      <span className="font-semibold">“crea comando ping para node-1”</span>.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {chatLog.map((m, idx) => (
                        <div key={idx} className={cx("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                          <div
                            className={cx(
                              "max-w-[92%] rounded-2xl px-3 py-2 text-sm shadow-sm",
                              m.role === "user" ? "bg-blue-600 text-white" : "bg-white text-slate-900"
                            )}
                          >
                            <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>
                            <div className={cx("mt-1 text-[10px] opacity-70", m.role === "user" ? "text-blue-100" : "text-slate-400")}>
                              {fmtDT(m.at)}
                            </div>
                          </div>
                        </div>
                      ))}
                      <div ref={chatEndRef} />
                    </div>
                  )}
                </div>

                <div className="border-t border-slate-200 bg-white p-3">
                  <div className="flex gap-2">
                    <input
                      className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                      placeholder="Escribe a NOVA…"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") sendChat();
                      }}
                    />
                    <button
                      className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                      onClick={sendChat}
                      disabled={!chatInput.trim()}
                    >
                      Enviar
                    </button>
                  </div>
                </div>
              </div>
            </Card>

            {/* Commands */}
            <div className="mt-4">
              <Card
                title="Commands"
                subtitle="GET|POST /api/commands + approve/reject. Firma HMAC + governance real se aplican del lado server."
              >
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                  {/* Composer */}
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Crear acción</div>

                    <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <div>
                        <div className="text-xs font-semibold text-slate-700">node_id</div>
                        <input
                          className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                          value={cmdNode}
                          onChange={(e) => setCmdNode(e.target.value)}
                          placeholder="node-1"
                        />
                      </div>

                      <div>
                        <div className="text-xs font-semibold text-slate-700">command</div>
                        <select
                          className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                          value={cmdName}
                          onChange={(e) => setCmdName(e.target.value)}
                        >
                          <option value="ping">ping</option>
                          <option value="status">status</option>
                          <option value="read_dir">read_dir</option>
                          <option value="read_file_head">read_file_head</option>
                          <option value="restart_process">restart_process</option>
                          <option value="pull_deploy">pull_deploy</option>
                          <option value="write_file">write_file</option>
                          <option value="run_sql">run_sql</option>
                          <option value="run_script">run_script</option>
                        </select>
                      </div>
                    </div>

                    <div className="mt-3">
                      <div className="text-xs font-semibold text-slate-700">payload (JSON)</div>
                      <textarea
                        className="mt-1 h-28 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 font-mono text-xs outline-none focus:ring-2 focus:ring-blue-200"
                        value={cmdPayloadRaw}
                        onChange={(e) => setCmdPayloadRaw(e.target.value)}
                        placeholder='{"path":"./sandbox"}'
                      />
                      <div className="mt-2 text-xs text-slate-500">
                        Nota: si la acción es “sensible” y <span className="font-semibold">allow_write</span> está OFF, va a{" "}
                        <span className="font-semibold">needs_approval</span>.
                      </div>
                    </div>

                    <button
                      className="mt-3 w-full rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-black disabled:opacity-60"
                      onClick={createCommand}
                      disabled={busy || !cmdNode.trim() || !cmdName.trim()}
                    >
                      Crear acción
                    </button>
                  </div>

                  {/* List */}
                  <div className="rounded-2xl border border-slate-200 bg-white">
                    <div className="border-b border-slate-100 px-4 py-3 text-sm font-semibold text-slate-900">Últimas 120</div>
                    <div className="max-h-[360px] overflow-auto">
                      {commands.length === 0 ? (
                        <div className="p-4 text-sm text-slate-500">Sin acciones todavía.</div>
                      ) : (
                        <div className="divide-y divide-slate-100">
                          {commands.map((c) => (
                            <div key={c.id} className="p-4">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="font-semibold text-slate-900">{c.command}</span>
                                    <span className={pill(c.status)}>{c.status}</span>
                                    {c.node_id ? (
                                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                                        {c.node_id}
                                      </span>
                                    ) : null}
                                  </div>
                                  <div className="mt-1 text-xs text-slate-500">
                                    created: {fmtDT(c.created_at)} · approved: {fmtDT(c.approved_at ?? null)} · executed:{" "}
                                    {fmtDT(c.executed_at ?? null)}
                                  </div>
                                </div>

                                {c.status === "needs_approval" ? (
                                  <div className="flex shrink-0 gap-2">
                                    <button
                                      className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                                      onClick={() => approve(c.id)}
                                      disabled={busy}
                                    >
                                      Aprobar
                                    </button>
                                    <button
                                      className="rounded-xl bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                                      onClick={() => reject(c.id)}
                                      disabled={busy}
                                    >
                                      Rechazar
                                    </button>
                                  </div>
                                ) : null}
                              </div>

                              {c.error ? (
                                <div className="mt-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
                                  {c.error}
                                </div>
                              ) : null}

                              {c.result ? (
                                <details className="mt-2">
                                  <summary className="cursor-pointer text-xs font-semibold text-slate-700">result</summary>
                                  <pre className="mt-2 overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs">
                                    {JSON.stringify(c.result, null, 2)}
                                  </pre>
                                </details>
                              ) : null}

                              <details className="mt-2">
                                <summary className="cursor-pointer text-xs font-semibold text-slate-700">payload</summary>
                                <pre className="mt-2 overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs">
                                  {JSON.stringify(c.payload ?? {}, null, 2)}
                                </pre>
                              </details>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Right column */}
          <div className="lg:col-span-1">
            {/* Governance */}
            <Card
              title="Governance"
              subtitle="Kill Switch + Allow Write (POST requiere owner)."
              right={
                <button
                  className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold hover:bg-slate-50 disabled:opacity-60"
                  onClick={refreshAll}
                  disabled={busy}
                >
                  Sync
                </button>
              }
            >
              <div className="space-y-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">Kill Switch</div>
                      <div className="mt-0.5 text-xs text-slate-600">Bloquea comandos (423) y registra evento.</div>
                    </div>
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={!!controls?.kill_switch}
                        onChange={(e) => {
                          const next = { ...(controls ?? { kill_switch: false, allow_write: false }), kill_switch: e.target.checked };
                          setControls(next);
                        }}
                        className="h-5 w-5 rounded border-slate-300"
                      />
                      <span className="text-xs font-semibold text-slate-700">{controls?.kill_switch ? "ON" : "OFF"}</span>
                    </label>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">Allow Write</div>
                      <div className="mt-0.5 text-xs text-slate-600">Permite comandos sensibles sin aprobación.</div>
                    </div>
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={!!controls?.allow_write}
                        onChange={(e) => {
                          const next = { ...(controls ?? { kill_switch: false, allow_write: false }), allow_write: e.target.checked };
                          setControls(next);
                        }}
                        className="h-5 w-5 rounded border-slate-300"
                      />
                      <span className="text-xs font-semibold text-slate-700">{controls?.allow_write ? "ON" : "OFF"}</span>
                    </label>
                  </div>

                  <button
                    className="mt-4 w-full rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-black disabled:opacity-60"
                    onClick={() => saveControls(controls ?? { kill_switch: false, allow_write: false })}
                    disabled={busy || !controls}
                  >
                    Guardar governance
                  </button>

                  <div className="mt-2 text-[11px] text-slate-500">updated_at: {fmtDT(controls?.updated_at ?? null)}</div>
                </div>
              </div>
            </Card>

            {/* Events */}
            <div className="mt-4">
              <Card title="Events" subtitle="GET|POST /api/events/manual (feed audit-friendly)">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="grid grid-cols-1 gap-2">
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <div>
                        <div className="text-xs font-semibold text-slate-700">level</div>
                        <select
                          className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                          value={evtLevel}
                          onChange={(e) => setEvtLevel(e.target.value as any)}
                        >
                          <option value="info">info</option>
                          <option value="warn">warn</option>
                          <option value="error">error</option>
                        </select>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-700">node_id (opcional)</div>
                        <input
                          className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                          value={evtNode}
                          onChange={(e) => setEvtNode(e.target.value)}
                          placeholder="node-1"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-semibold text-slate-700">type</div>
                      <input
                        className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                        value={evtType}
                        onChange={(e) => setEvtType(e.target.value)}
                        placeholder="manual.note"
                      />
                    </div>

                    <div>
                      <div className="text-xs font-semibold text-slate-700">message</div>
                      <input
                        className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                        value={evtMessage}
                        onChange={(e) => setEvtMessage(e.target.value)}
                        placeholder="Evento manual desde dashboard…"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") pushEvent();
                        }}
                      />
                    </div>

                    <button
                      className="mt-1 w-full rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                      onClick={pushEvent}
                      disabled={busy || !evtMessage.trim()}
                    >
                      Registrar evento
                    </button>
                  </div>
                </div>

                <div className="mt-3 max-h-[420px] overflow-auto rounded-2xl border border-slate-200 bg-white">
                  {events.length === 0 ? (
                    <div className="p-4 text-sm text-slate-500">Sin eventos.</div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {events.map((ev) => (
                        <div key={ev.id} className="p-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={cx(
                                "rounded-full px-2 py-0.5 text-xs font-semibold",
                                ev.level === "info"
                                  ? "bg-slate-100 text-slate-800"
                                  : ev.level === "warn"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-red-100 text-red-800"
                              )}
                            >
                              {ev.level}
                            </span>
                            <span className="text-xs font-semibold text-slate-700">{ev.type}</span>
                            {ev.node_id ? (
                              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                                {ev.node_id}
                              </span>
                            ) : null}
                          </div>
                          <div className="mt-1 whitespace-pre-wrap text-sm text-slate-900">{ev.message}</div>
                          <div className="mt-1 text-xs text-slate-500">{fmtDT(ev.created_at)}</div>
                          {ev.data ? (
                            <details className="mt-2">
                              <summary className="cursor-pointer text-xs font-semibold text-slate-700">data</summary>
                              <pre className="mt-2 overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs">
                                {JSON.stringify(ev.data, null, 2)}
                              </pre>
                            </details>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Quick hints */}
            <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="text-sm font-semibold text-slate-900">Notas rápidas</div>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
                <li>
                  Si ves error “<span className="font-semibold">Falta COMMAND_HMAC_SECRET</span>”, configúralo en el servidor (env).
                </li>
                <li>
                  Si NOVA no responde: revisa <span className="font-semibold">NOVA_AGI_URL</span> y{" "}
                  <span className="font-semibold">NOVA_ORCHESTRATOR_KEY</span>.
                </li>
                <li>
                  “Kill Switch ON” bloquea comandos y deja evidencia en <span className="font-semibold">Events</span>.
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-xs text-slate-400">HOCKER.ONE · Control Plane · v0</div>
      </div>
    </div>
  );
}