"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase-browser";
import { defaultProjectId, normalizeProjectId } from "@/lib/project";
import type { CommandStatus, EventLevel } from "@/lib/types";

declare global {
  interface Window {
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
  }
}

type Project = { id: string; name: string | null; created_at: string };
type UserLite = { id: string; email?: string | null };

type Msg = {
  id: string;
  thread_id: string;
  project_id: string;
  role: "system" | "user" | "nova" | "assistant";
  content: string;
  created_at: string;
};

type Cmd = {
  id: string;
  project_id: string;
  node_id: string | null;
  command: string;
  status: CommandStatus;
  needs_approval: boolean;
  created_at: string;
  approved_at: string | null;
  executed_at: string | null;
  payload: any;
  result: any;
  error: string | null;
};

type Ev = {
  id: string;
  project_id: string;
  node_id: string | null;
  level: EventLevel;
  type: string;
  message: string;
  data: any;
  created_at: string;
};

type Controls = {
  id: string;
  project_id: string;
  kill_switch: boolean;
  allow_write: boolean;
  updated_at: string | null;
};

function cx(...a: Array<string | false | null | undefined>) {
  return a.filter(Boolean).join(" ");
}

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

function fmtTime(ts?: string | null) {
  if (!ts) return "—";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

function relativeTime(ts?: string | null) {
  if (!ts) return "—";
  const d = new Date(ts);
  const now = Date.now();
  const diff = Math.max(0, now - d.getTime());
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "justo ahora";
  if (mins < 60) return `hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs} h`;
  const days = Math.floor(hrs / 24);
  return `hace ${days} d`;
}

function canSpeech() {
  if (typeof window === "undefined") return false;
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

function pillForLevel(level: EventLevel) {
  if (level === "info") return "bg-blue-50 text-blue-800 border-blue-200";
  if (level === "warn") return "bg-amber-50 text-amber-800 border-amber-200";
  return "bg-red-50 text-red-800 border-red-200";
}

function pillForStatus(status: CommandStatus) {
  switch (status) {
    case "needs_approval":
      return "bg-amber-50 text-amber-800 border-amber-200";
    case "queued":
      return "bg-blue-50 text-blue-800 border-blue-200";
    case "running":
      return "bg-purple-50 text-purple-800 border-purple-200";
    case "done":
      return "bg-emerald-50 text-emerald-800 border-emerald-200";
    case "failed":
      return "bg-red-50 text-red-800 border-red-200";
    case "cancelled":
      return "bg-slate-50 text-slate-700 border-slate-200";
    default:
      return "bg-slate-50 text-slate-700 border-slate-200";
  }
}

function threadKey(pid: string) {
  return `hocker.threadId.${pid}`;
}
function activeProjectKey() {
  return `hocker.activeProjectId`;
}
function recentProjectsKey() {
  return `hocker.recentProjects`;
}

function readLocal(key: string, fallback: string = "") {
  try {
    return window.localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}
function writeLocal(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

function copyToClipboard(text: string) {
  try {
    navigator.clipboard?.writeText(text);
  } catch {
    // ignore
  }
}

type TabKey = "overview" | "chat" | "ops" | "events" | "governance";

export default function DashboardPage() {
  const sb = useMemo(() => createBrowserSupabase(), []);

  // Auth
  const [user, setUser] = useState<UserLite | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // UI state
  const [tab, setTab] = useState<TabKey>("overview");

  // Project selection (single source of truth)
  const [projectInput, setProjectInput] = useState<string>(() => {
    const fromLocal = typeof window !== "undefined" ? readLocal(activeProjectKey(), "") : "";
    return fromLocal || defaultProjectId();
  });
  const pid = useMemo(() => normalizeProjectId(projectInput), [projectInput]);

  // Project list
  const [projects, setProjects] = useState<Project[]>([]);
  const [projOpen, setProjOpen] = useState(false);
  const [projQuery, setProjQuery] = useState("");

  // Top insights
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [needsApprovalCount, setNeedsApprovalCount] = useState<number>(0);
  const [alertsCount, setAlertsCount] = useState<number>(0);
  const [recentActivity, setRecentActivity] = useState<Array<{ title: string; subtitle: string; time: string }>>(
    []
  );

  // Global toasts
  const [toast, setToast] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  // Close project dropdown on outside click
  const projRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!projRef.current) return;
      if (projRef.current.contains(e.target as any)) return;
      setProjOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  // Auth bootstrap
  useEffect(() => {
    let mounted = true;
    async function boot() {
      setAuthLoading(true);
      const { data } = await sb.auth.getUser();
      const u = data?.user ? ({ id: data.user.id, email: data.user.email } as UserLite) : null;
      if (!mounted) return;
      setUser(u);
      setAuthLoading(false);
    }
    boot();
    const { data: sub } = sb.auth.onAuthStateChange((_evt, session) => {
      const u = session?.user ? ({ id: session.user.id, email: session.user.email } as UserLite) : null;
      setUser(u);
    });
    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe();
    };
  }, [sb]);

  // Persist active project (and keep a “recent” list)
  useEffect(() => {
    if (!pid) return;
    writeLocal(activeProjectKey(), pid);

    // recent list
    try {
      const raw = readLocal(recentProjectsKey(), "[]");
      const arr = JSON.parse(raw) as string[];
      const next = [pid, ...arr.filter((x) => x !== pid)].slice(0, 8);
      writeLocal(recentProjectsKey(), JSON.stringify(next));
    } catch {
      // ignore
    }
  }, [pid]);

  // Load projects visible by membership
  useEffect(() => {
    if (!user) return;
    let mounted = true;
    async function loadProjects() {
      const { data, error } = await sb.from("projects").select("id,name,created_at").order("created_at", { ascending: false });
      if (!mounted) return;
      if (error) {
        setProjects([]);
        return;
      }
      setProjects((data as Project[]) ?? []);
    }
    loadProjects();
    return () => {
      mounted = false;
    };
  }, [sb, user]);

  // Insights (counts + recent activity)
  async function refreshInsights() {
    if (!user) return;
    setInsightsLoading(true);
    try {
      // Commands needing approval
      const { count: c1, error: e1 } = await sb
        .from("commands")
        .select("id", { count: "exact", head: true })
        .eq("project_id", pid)
        .eq("status", "needs_approval");
      if (e1) throw e1;
      setNeedsApprovalCount(Number(c1 ?? 0));

      // Alerts in last 24h (warn/error)
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data: evs, error: e2 } = await sb
        .from("events")
        .select("id, level, type, message, created_at")
        .eq("project_id", pid)
        .gte("created_at", since)
        .in("level", ["warn", "error"])
        .order("created_at", { ascending: false })
        .limit(20);
      if (e2) throw e2;
      setAlertsCount((evs as any[])?.length ?? 0);

      // Recent mixed activity (simple)
      const { data: lastEvents } = await sb
        .from("events")
        .select("type,message,created_at")
        .eq("project_id", pid)
        .order("created_at", { ascending: false })
        .limit(5);

      const { data: lastCmds } = await sb
        .from("commands")
        .select("command,status,created_at")
        .eq("project_id", pid)
        .order("created_at", { ascending: false })
        .limit(5);

      const mix: Array<{ title: string; subtitle: string; time: string }> = [];
      (lastEvents as any[] | null)?.forEach((e) =>
        mix.push({
          title: e?.type ? `Evento: ${String(e.type)}` : "Evento",
          subtitle: String(e?.message ?? ""),
          time: String(e?.created_at ?? ""),
        })
      );
      (lastCmds as any[] | null)?.forEach((c) =>
        mix.push({
          title: c?.command ? `Acción: ${String(c.command)}` : "Acción",
          subtitle: c?.status ? `Estado: ${String(c.status)}` : "",
          time: String(c?.created_at ?? ""),
        })
      );

      mix.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
      setRecentActivity(mix.slice(0, 7));
    } catch {
      // silent: insights are “nice to have”
    } finally {
      setInsightsLoading(false);
    }
  }

  useEffect(() => {
    if (!user) return;
    refreshInsights();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, pid]);

  async function signOut() {
    await sb.auth.signOut();
    setToast({ type: "ok", msg: "Sesión cerrada." });
  }

  const filteredProjects = useMemo(() => {
    const q = projQuery.trim().toLowerCase();
    const list = projects ?? [];
    if (!q) return list;
    return list.filter((p) => (p.id || "").toLowerCase().includes(q) || (p.name || "").toLowerCase().includes(q));
  }, [projects, projQuery]);

  const recentLocal = useMemo(() => {
    try {
      const raw = typeof window !== "undefined" ? readLocal(recentProjectsKey(), "[]") : "[]";
      return (JSON.parse(raw) as string[]) ?? [];
    } catch {
      return [];
    }
  }, [pid, user]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top toast */}
      {toast && (
        <div className="fixed left-1/2 top-4 z-50 w-[92%] max-w-xl -translate-x-1/2">
          <div
            className={cx(
              "rounded-2xl border px-4 py-3 shadow-lg backdrop-blur",
              toast.type === "ok"
                ? "border-emerald-200 bg-emerald-50/95 text-emerald-900"
                : "border-red-200 bg-red-50/95 text-red-900"
            )}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="text-sm font-semibold">{toast.msg}</div>
              <button
                onClick={() => setToast(null)}
                className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Ok
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="sticky top-0 z-30 border-b border-slate-200 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
              <span className="text-lg">🧠</span>
            </div>
            <div className="leading-tight">
              <div className="text-sm font-extrabold tracking-tight text-slate-900">HOCKER ONE</div>
              <div className="text-xs text-slate-500">Centro de control (multi-proyecto)</div>
            </div>
          </div>

          {/* Project selector */}
          <div className="relative w-full max-w-xl" ref={projRef}>
            <button
              onClick={() => setProjOpen((s) => !s)}
              className="group flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm hover:bg-slate-50"
              title="Cambiar proyecto"
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <span className="inline-flex h-7 items-center rounded-xl bg-blue-50 px-2 text-xs font-bold text-blue-800">
                  Proyecto
                </span>
                <span className="truncate text-sm font-semibold text-slate-900">{pid}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="hidden text-xs text-slate-500 md:inline">Cambiar</span>
                <span className="text-slate-400 group-hover:text-slate-600">▾</span>
              </div>
            </button>

            {projOpen && (
              <div className="absolute left-0 right-0 mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                <div className="border-b border-slate-200 p-3">
                  <input
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-400"
                    value={projQuery}
                    onChange={(e) => setProjQuery(e.target.value)}
                    placeholder="Buscar proyecto…"
                  />
                  {recentLocal.length > 0 && (
                    <div className="mt-3">
                      <div className="mb-2 text-[11px] font-bold text-slate-500">Recientes</div>
                      <div className="flex flex-wrap gap-2">
                        {recentLocal.map((r) => (
                          <button
                            key={r}
                            onClick={() => {
                              setProjectInput(r);
                              setProjOpen(false);
                              setProjQuery("");
                            }}
                            className={cx(
                              "rounded-xl border px-2 py-1 text-xs font-semibold",
                              r === pid ? "border-blue-200 bg-blue-50 text-blue-800" : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
                            )}
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="max-h-[320px] overflow-auto">
                  {filteredProjects.length === 0 ? (
                    <div className="p-4 text-sm text-slate-600">No veo proyectos con ese nombre. (O no tienes acceso.)</div>
                  ) : (
                    filteredProjects.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          setProjectInput(p.id);
                          setProjOpen(false);
                          setProjQuery("");
                        }}
                        className={cx(
                          "flex w-full items-start justify-between gap-3 px-4 py-3 text-left hover:bg-slate-50",
                          p.id === pid ? "bg-blue-50/60" : ""
                        )}
                      >
                        <div className="min-w-0">
                          <div className="truncate text-sm font-bold text-slate-900">{p.id}</div>
                          <div className="truncate text-xs text-slate-500">{p.name || "Sin nombre"}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-[11px] text-slate-500">{relativeTime(p.created_at)}</div>
                        </div>
                      </button>
                    ))
                  )}
                </div>

                <div className="border-t border-slate-200 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <button
                      onClick={() => {
                        copyToClipboard(pid);
                        setToast({ type: "ok", msg: "Proyecto copiado ✅" });
                      }}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 hover:bg-slate-50"
                    >
                      Copiar ID
                    </button>
                    <div className="text-[11px] text-slate-500">Todo lo que ves aquí se filtra por este proyecto.</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User */}
          <div className="flex items-center gap-2">
            {authLoading ? (
              <div className="h-10 w-40 animate-pulse rounded-2xl bg-slate-100" />
            ) : user ? (
              <>
                <div className="hidden max-w-[220px] truncate text-xs font-semibold text-slate-700 md:block">
                  {user.email || user.id}
                </div>
                <button
                  onClick={signOut}
                  className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-900 hover:bg-slate-50"
                >
                  Salir
                </button>
              </>
            ) : (
              <div className="text-xs font-semibold text-slate-600">Sin sesión</div>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 px-4 py-4 md:grid-cols-[260px_1fr]">
        {/* Sidebar */}
        <div className="md:sticky md:top-[76px] md:h-[calc(100vh-92px)]">
          <div className="rounded-3xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="mb-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <div className="text-xs font-extrabold text-slate-900">Panel rápido</div>
              <div className="mt-1 text-xs text-slate-600">
                Cambias el proyecto arriba y todo se ajusta. Sin vueltas.
              </div>
            </div>

            <NavButton icon="✨" label="Resumen" active={tab === "overview"} onClick={() => setTab("overview")} />
            <NavButton icon="💬" label="Conversación" active={tab === "chat"} onClick={() => setTab("chat")} />
            <NavButton icon="🧩" label="Acciones" active={tab === "ops"} onClick={() => setTab("ops")} />
            <NavButton icon="📡" label="Eventos" active={tab === "events"} onClick={() => setTab("events")} />
            <NavButton icon="🛡️" label="Seguridad" active={tab === "governance"} onClick={() => setTab("governance")} />

            <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-slate-700">Insights</div>
                <button
                  onClick={refreshInsights}
                  className="rounded-xl border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-slate-800 hover:bg-slate-50"
                  disabled={insightsLoading || !user}
                >
                  {insightsLoading ? "..." : "Actualizar"}
                </button>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <KpiCard title="Pendientes" value={String(needsApprovalCount)} hint="Acciones esperando ok" />
                <KpiCard title="Alertas" value={String(alertsCount)} hint="Últimas 24h" />
              </div>
            </div>
          </div>
        </div>

        {/* Main */}
        <div className="space-y-4">
          {/* Auth gate */}
          {!authLoading && !user ? (
            <AuthCard onSigned={() => setToast({ type: "ok", msg: "Listo. Ya estás dentro ✅" })} />
          ) : null}

          {/* Content */}
          <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="text-lg font-extrabold text-slate-900">
                    {tab === "overview"
                      ? "Resumen del proyecto"
                      : tab === "chat"
                        ? "Conversación con NOVA"
                        : tab === "ops"
                          ? "Acciones y aprobaciones"
                          : tab === "events"
                            ? "Eventos del sistema"
                            : "Seguridad del proyecto"}
                  </div>
                  <div className="text-sm text-slate-600">
                    Proyecto activo: <span className="font-bold text-slate-900">{pid}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => {
                      copyToClipboard(pid);
                      setToast({ type: "ok", msg: "Proyecto copiado ✅" });
                    }}
                    className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-900 hover:bg-slate-50"
                  >
                    Copiar proyecto
                  </button>

                  <button
                    onClick={() => {
                      setToast({
                        type: "ok",
                        msg: "Tip: usa ‘Seguridad’ para bloquear acciones o exigir aprobación.",
                      });
                    }}
                    className="rounded-2xl bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:bg-slate-800"
                  >
                    Tip rápido
                  </button>
                </div>
              </div>
            </div>

            <div className="px-5 py-5">
              {tab === "overview" ? (
                <OverviewTab
                  pid={pid}
                  sb={sb}
                  recentActivity={recentActivity}
                  needsApprovalCount={needsApprovalCount}
                  alertsCount={alertsCount}
                  onToast={setToast}
                />
              ) : tab === "chat" ? (
                <ChatTab pid={pid} sb={sb} onToast={setToast} />
              ) : tab === "ops" ? (
                <OpsTab pid={pid} sb={sb} onToast={setToast} onInsights={refreshInsights} />
              ) : tab === "events" ? (
                <EventsTab pid={pid} sb={sb} onToast={setToast} onInsights={refreshInsights} />
              ) : (
                <GovernanceTab pid={pid} onToast={setToast} onInsights={refreshInsights} />
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="pb-8 text-center text-[11px] text-slate-500">
            HOCKER ONE · Diseño enfocado en claridad: lo importante primero.
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================
   UI atoms
========================= */

function NavButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: string;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cx(
        "mb-2 flex w-full items-center justify-between rounded-2xl border px-3 py-3 text-left transition",
        active ? "border-blue-200 bg-blue-50 text-blue-900" : "border-slate-200 bg-white text-slate-900 hover:bg-slate-50"
      )}
    >
      <div className="flex items-center gap-2">
        <div className={cx("flex h-8 w-8 items-center justify-center rounded-xl", active ? "bg-white" : "bg-slate-50")}>
          <span className="text-base">{icon}</span>
        </div>
        <div className="text-sm font-extrabold">{label}</div>
      </div>
      <div className={cx("text-slate-400", active ? "text-blue-500" : "")}>›</div>
    </button>
  );
}

function KpiCard({ title, value, hint }: { title: string; value: string; hint: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3">
      <div className="text-[11px] font-bold text-slate-500">{title}</div>
      <div className="mt-1 text-xl font-extrabold text-slate-900">{value}</div>
      <div className="text-[11px] text-slate-500">{hint}</div>
    </div>
  );
}

function Section({
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
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="text-sm font-extrabold text-slate-900">{title}</div>
          {subtitle ? <div className="text-xs text-slate-600">{subtitle}</div> : null}
        </div>
        {right ? <div className="flex flex-wrap items-center gap-2">{right}</div> : null}
      </div>
      {children}
    </div>
  );
}

/* =========================
   Auth (Magic link)
========================= */

function AuthCard({ onSigned }: { onSigned: () => void }) {
  const sb = useMemo(() => createBrowserSupabase(), []);
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function sendLink() {
    setErr(null);
    setMsg(null);
    const e = email.trim();
    if (!e) return;
    setSending(true);
    try {
      const { error } = await sb.auth.signInWithOtp({
        email: e,
        options: {
          // Si ya tienes URL final, cámbiala:
          emailRedirectTo: typeof window !== "undefined" ? `${window.location.origin}/dashboard` : undefined,
        },
      });
      if (error) throw error;
      setMsg("Listo. Te mandé un link a tu correo para entrar (sin contraseñas).");
      onSigned();
    } catch (ex: any) {
      setErr(ex?.message ?? "No se pudo enviar el link.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-lg font-extrabold text-slate-900">Acceso rápido</div>
          <div className="mt-1 text-sm text-slate-600">
            Entra con tu correo. Te llega un link seguro y listo.
          </div>
        </div>
        <div className="hidden rounded-2xl bg-blue-50 px-3 py-2 text-xs font-extrabold text-blue-900 md:block">
          Magic-link
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto]">
        <input
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-400"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu correo…"
          autoComplete="email"
        />
        <button
          onClick={sendLink}
          disabled={!email.trim() || sending}
          className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-extrabold text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {sending ? "Enviando…" : "Enviar link"}
        </button>
      </div>

      {msg ? (
        <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {msg}
        </div>
      ) : null}
      {err ? (
        <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">{err}</div>
      ) : null}

      <div className="mt-3 text-[11px] text-slate-500">
        Si ya estabas logueado, refresca la página y listo.
      </div>
    </div>
  );
}

/* =========================
   Tabs
========================= */

function OverviewTab({
  pid,
  sb,
  recentActivity,
  needsApprovalCount,
  alertsCount,
  onToast,
}: {
  pid: string;
  sb: ReturnType<typeof createBrowserSupabase>;
  recentActivity: Array<{ title: string; subtitle: string; time: string }>;
  needsApprovalCount: number;
  alertsCount: number;
  onToast: (t: { type: "ok" | "err"; msg: string } | null) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-gradient-to-b from-blue-50 to-white p-5 shadow-sm">
          <div className="text-xs font-extrabold text-blue-900">Prioridad</div>
          <div className="mt-1 text-lg font-extrabold text-slate-900">Lo importante primero</div>
          <div className="mt-2 text-sm text-slate-700">
            Si ves <span className="font-extrabold">Pendientes</span>, apruébalos o recházalos.
            Si ves <span className="font-extrabold">Alertas</span>, revisa eventos.
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => onToast({ type: "ok", msg: "Ve a ‘Acciones’ para aprobar/rechazar. ✅" })}
              className="rounded-2xl bg-slate-900 px-4 py-2 text-xs font-extrabold text-white hover:bg-slate-800"
            >
              Qué hago ahora
            </button>
            <button
              onClick={() => {
                copyToClipboard(pid);
                onToast({ type: "ok", msg: "ID del proyecto copiado ✅" });
              }}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-extrabold text-slate-900 hover:bg-slate-50"
            >
              Copiar proyecto
            </button>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="text-xs font-extrabold text-slate-500">Pendientes</div>
            <div className="rounded-2xl bg-amber-50 px-2 py-1 text-[11px] font-extrabold text-amber-900">
              requieren decisión
            </div>
          </div>
          <div className="mt-2 text-4xl font-extrabold text-slate-900">{needsApprovalCount}</div>
          <div className="mt-1 text-sm text-slate-600">Acciones esperando aprobación.</div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="text-xs font-extrabold text-slate-500">Alertas</div>
            <div className="rounded-2xl bg-red-50 px-2 py-1 text-[11px] font-extrabold text-red-900">
              últimas 24h
            </div>
          </div>
          <div className="mt-2 text-4xl font-extrabold text-slate-900">{alertsCount}</div>
          <div className="mt-1 text-sm text-slate-600">Eventos en nivel warn/error.</div>
        </div>
      </div>

      <Section
        title="Actividad reciente"
        subtitle="Lo último que pasó en este proyecto (eventos + acciones)."
        right={
          <button
            onClick={() => onToast({ type: "ok", msg: "Tip: si algo se ve raro, revisa ‘Eventos’ primero." })}
            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-extrabold text-slate-900 hover:bg-slate-50"
          >
            Consejo
          </button>
        }
      >
        {recentActivity.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            Aún no hay actividad visible aquí. Cuando corras acciones o se generen eventos, aparecerán.
          </div>
        ) : (
          <div className="space-y-2">
            {recentActivity.map((a, idx) => (
              <div key={idx} className="flex items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-extrabold text-slate-900">{a.title}</div>
                  <div className="truncate text-xs text-slate-600">{a.subtitle}</div>
                </div>
                <div className="text-right text-[11px] font-bold text-slate-500">{relativeTime(a.time)}</div>
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}

function ChatTab({
  pid,
  sb,
  onToast,
}: {
  pid: string;
  sb: ReturnType<typeof createBrowserSupabase>;
  onToast: (t: { type: "ok" | "err"; msg: string } | null) => void;
}) {
  const [threadId, setThreadId] = useState<string>(() => {
    if (typeof window === "undefined") return uuidv4();
    return readLocal(threadKey(pid), "") || uuidv4();
  });

  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [input, setInput] = useState("");

  const [prefer, setPrefer] = useState<"auto" | "openai" | "gemini">("auto");
  const [mode, setMode] = useState<"auto" | "fast" | "pro">("auto");
  const [allowActions, setAllowActions] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  // On project change: load its thread from local or create
  useEffect(() => {
    const existing = typeof window !== "undefined" ? readLocal(threadKey(pid), "") : "";
    const next = existing || uuidv4();
    setThreadId(next);
    if (!existing) writeLocal(threadKey(pid), next);
  }, [pid]);

  async function loadHistory(currentThread: string) {
    setErr(null);
    try {
      const { data, error } = await sb
        .from("nova_messages")
        .select("id, project_id, thread_id, role, content, created_at")
        .eq("project_id", pid)
        .eq("thread_id", currentThread)
        .order("created_at", { ascending: true })
        .limit(250);
      if (error) throw error;
      setMsgs((data as Msg[]) ?? []);
    } catch (e: any) {
      setMsgs([]);
      setErr(e?.message ?? "No pude cargar el historial.");
    }
  }

  useEffect(() => {
    loadHistory(threadId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pid, threadId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs.length, loading]);

  function setThreadAndPersist(newId: string) {
    setThreadId(newId);
    writeLocal(threadKey(pid), newId);
  }

  async function newThread() {
    const n = uuidv4();
    setThreadAndPersist(n);
    setMsgs([]);
    setErr(null);
    onToast({ type: "ok", msg: "Nueva conversación creada ✅" });
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
      if (allowActions) headers["x-allow-actions"] = "1";

      const res = await fetch("/api/nova/chat", {
        method: "POST",
        headers,
        body: JSON.stringify({
          project_id: pid,
          thread_id: threadId,
          message: t,
          text: t,
          prefer,
          mode,
        }),
      });

      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || "NOVA no respondió.");

      if (typeof j?.thread_id === "string" && j.thread_id !== threadId) {
        setThreadAndPersist(j.thread_id);
        await loadHistory(j.thread_id);
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
    if (!canSpeech()) return;

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
      <Section
        title="Control de conversación"
        subtitle="Una conversación por proyecto. Aquí no se mezclan hilos."
        right={
          <>
            <button
              onClick={newThread}
              className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-extrabold text-slate-900 hover:bg-slate-50"
              disabled={loading}
            >
              Nueva conversación
            </button>
            <button
              onClick={() => {
                copyToClipboard(threadId);
                onToast({ type: "ok", msg: "ID de conversación copiado ✅" });
              }}
              className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-extrabold text-slate-900 hover:bg-slate-50"
            >
              Copiar ID
            </button>
          </>
        }
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="text-xs text-slate-600">
            <span className="font-extrabold text-slate-900">Conversación:</span>{" "}
            <span className="font-mono">{threadId}</span>
            <div className="mt-1 text-[11px] text-slate-500">Consejo: si cambias de proyecto, cambia de conversación.</div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-extrabold text-slate-900 outline-none"
              value={prefer}
              onChange={(e) => setPrefer(e.target.value as any)}
              title="Enrutado"
            >
              <option value="auto">Enrutado: Auto</option>
              <option value="openai">Enrutado: OpenAI</option>
              <option value="gemini">Enrutado: Gemini</option>
            </select>

            <select
              className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-extrabold text-slate-900 outline-none"
              value={mode}
              onChange={(e) => setMode(e.target.value as any)}
              title="Estilo de respuesta"
            >
              <option value="auto">Estilo: Auto</option>
              <option value="fast">Estilo: Rápido</option>
              <option value="pro">Estilo: Pro</option>
            </select>

            <label className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-extrabold text-slate-900">
              <input type="checkbox" className="h-4 w-4" checked={allowActions} onChange={(e) => setAllowActions(e.target.checked)} />
              Acciones avanzadas
            </label>
          </div>
        </div>
      </Section>

      <Section
        title="Chat"
        subtitle="Claro, legible y directo. Sin ruido."
        right={
          <button
            onClick={() => loadHistory(threadId)}
            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-extrabold text-slate-900 hover:bg-slate-50"
            disabled={loading}
          >
            Recargar
          </button>
        }
      >
        {err ? (
          <div className="mb-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">{err}</div>
        ) : null}

        <div className="max-h-[520px] overflow-auto rounded-3xl border border-slate-200 bg-slate-50 p-4">
          {msgs.length === 0 && !loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
              Aún no hay mensajes aquí. Escribe algo y arranca.
            </div>
          ) : null}

          <div className="space-y-3">
            {msgs.map((m) => {
              const isUser = m.role === "user";
              return (
                <div key={m.id} className={cx("flex", isUser ? "justify-end" : "justify-start")}>
                  <div
                    className={cx(
                      "max-w-[85%] rounded-3xl px-4 py-3 text-sm shadow-sm",
                      isUser ? "bg-blue-600 text-white" : "border border-slate-200 bg-white text-slate-900"
                    )}
                  >
                    <div className="whitespace-pre-wrap">{m.content}</div>
                    <div className={cx("mt-2 text-[11px]", isUser ? "text-blue-100" : "text-slate-500")}>
                      {fmtTime(m.created_at)}
                    </div>
                  </div>
                </div>
              );
            })}

            {loading ? <div className="text-sm font-semibold text-slate-600">NOVA está respondiendo…</div> : null}
            <div ref={bottomRef} />
          </div>
        </div>

        <div className="mt-3 rounded-3xl border border-slate-200 bg-white p-3">
          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <input
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-400"
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
                disabled={loading || !canSpeech()}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-extrabold text-slate-900 hover:bg-slate-50 disabled:opacity-50"
                title={canSpeech() ? "Dicta por voz" : "Voz no disponible en este dispositivo"}
              >
                Voz
              </button>

              <button
                onClick={() => send(input)}
                className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-extrabold text-white hover:bg-slate-800 disabled:opacity-50"
                disabled={loading || !input.trim()}
              >
                Enviar
              </button>
            </div>
          </div>

          <div className="mt-2 text-[11px] text-slate-500">
            “Acciones avanzadas” solo funciona si tu usuario tiene permiso. Si no, el sistema lo bloquea (como debe ser).
          </div>
        </div>
      </Section>
    </div>
  );
}

function OpsTab({
  pid,
  sb,
  onToast,
  onInsights,
}: {
  pid: string;
  sb: ReturnType<typeof createBrowserSupabase>;
  onToast: (t: { type: "ok" | "err"; msg: string } | null) => void;
  onInsights: () => Promise<void>;
}) {
  const [items, setItems] = useState<Cmd[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Simple “action builder” (friendly)
  const [nodeId, setNodeId] = useState<string>("");
  const [action, setAction] = useState<string>("ping");
  const [payloadText, setPayloadText] = useState<string>("{}");
  const [sending, setSending] = useState(false);

  async function refresh() {
    setErr(null);
    setLoading(true);
    try {
      const { data, error } = await sb
        .from("commands")
        .select("id, project_id, node_id, command, status, needs_approval, payload, result, error, created_at, approved_at, executed_at")
        .eq("project_id", pid)
        .order("created_at", { ascending: false })
        .limit(80);
      if (error) throw error;
      setItems((data as Cmd[]) ?? []);
    } catch (e: any) {
      setErr(e?.message ?? "No pude cargar acciones.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pid]);

  async function approve(id: string) {
    setErr(null);
    try {
      const res = await fetch("/api/commands/approve", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id, project_id: pid }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || "No se pudo aprobar.");
      await refresh();
      await onInsights();
      onToast({ type: "ok", msg: "Aprobado ✅" });
    } catch (e: any) {
      setErr(e?.message ?? "No se pudo aprobar.");
      onToast({ type: "err", msg: "No se pudo aprobar." });
    }
  }

  async function reject(id: string) {
    setErr(null);
    try {
      const res = await fetch("/api/commands/reject", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id, project_id: pid }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || "No se pudo rechazar.");
      await refresh();
      await onInsights();
      onToast({ type: "ok", msg: "Rechazado ✅" });
    } catch (e: any) {
      setErr(e?.message ?? "No se pudo rechazar.");
      onToast({ type: "err", msg: "No se pudo rechazar." });
    }
  }

  async function createAction() {
    setErr(null);
    setSending(true);
    try {
      const n = nodeId.trim();
      if (!n) throw new Error("Falta el nodo (a quién va la acción).");

      let payload: any = {};
      try {
        payload = JSON.parse(payloadText || "{}");
      } catch {
        throw new Error("El campo ‘detalles’ debe ser JSON válido.");
      }

      const res = await fetch("/api/commands", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ project_id: pid, node_id: n, command: action, payload }),
      });

      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || "No se pudo crear la acción.");

      await refresh();
      await onInsights();

      onToast({
        type: "ok",
        msg: j?.needs_approval ? "Acción creada. Quedó esperando aprobación ✅" : "Acción creada y enviada ✅",
      });
    } catch (e: any) {
      setErr(e?.message ?? "No se pudo crear la acción.");
      onToast({ type: "err", msg: "No se pudo crear la acción." });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-4">
      <Section
        title="Crear una acción (simple y guiado)"
        subtitle="Aquí disparas acciones a un nodo. Si es sensible, puede pedir aprobación."
        right={
          <button
            onClick={refresh}
            className="rounded-2xl bg-slate-900 px-4 py-2 text-xs font-extrabold text-white hover:bg-slate-800 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Cargando…" : "Actualizar"}
          </button>
        }
      >
        {err ? (
          <div className="mb-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">{err}</div>
        ) : null}

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_260px]">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label className="text-xs font-extrabold text-slate-600">Nodo (destino)</label>
                <input
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-400"
                  value={nodeId}
                  onChange={(e) => setNodeId(e.target.value)}
                  placeholder="ej. hocker-node-01"
                />
              </div>

              <div>
                <label className="text-xs font-extrabold text-slate-600">Acción</label>
                <select
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-extrabold text-slate-900 outline-none focus:border-blue-400"
                  value={action}
                  onChange={(e) => setAction(e.target.value)}
                >
                  <option value="ping">Ping (salud)</option>
                  <option value="restart_process">Reiniciar proceso</option>
                  <option value="pull_deploy">Actualizar / deploy</option>
                  <option value="run_sql">Ejecutar SQL (sensible)</option>
                  <option value="run_script">Ejecutar script (sensible)</option>
                  <option value="write_file">Escribir archivo (sensible)</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-extrabold text-slate-600">Detalles (JSON)</label>
                <textarea
                  className="mt-1 h-28 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-mono text-xs text-slate-900 outline-none focus:border-blue-400"
                  value={payloadText}
                  onChange={(e) => setPayloadText(e.target.value)}
                  placeholder={`{ "example": true }`}
                />
                <div className="mt-2 text-[11px] text-slate-500">
                  Si “Seguridad → Allow write” está OFF, lo sensible se va a aprobación.
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-4">
            <div className="text-sm font-extrabold text-slate-900">Enviar</div>
            <div className="mt-1 text-xs text-slate-600">
              Antes de ejecutar cosas delicadas, revisa “Seguridad”.
            </div>

            <button
              onClick={createAction}
              disabled={sending || !nodeId.trim()}
              className="mt-4 w-full rounded-2xl bg-blue-600 px-4 py-3 text-sm font-extrabold text-white hover:bg-blue-500 disabled:opacity-50"
            >
              {sending ? "Enviando…" : "Crear acción"}
            </button>

            <button
              onClick={() => {
                setNodeId("");
                setPayloadText("{}");
                setAction("ping");
                onToast({ type: "ok", msg: "Formulario limpio ✅" });
              }}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-extrabold text-slate-900 hover:bg-slate-50"
            >
              Limpiar
            </button>
          </div>
        </div>
      </Section>

      <Section title="Acciones recientes" subtitle="Aprobaciones, resultados y errores. Todo en un solo lugar.">
        {loading ? <div className="text-sm text-slate-600">Cargando…</div> : null}
        {!loading && items.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            No hay acciones aún para este proyecto.
          </div>
        ) : null}

        <div className="space-y-3">
          {items.map((c) => {
            const canModerate = c.status === "needs_approval";
            return (
              <div key={c.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-extrabold text-slate-900">{c.command}</span>
                      <span className={cx("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-extrabold", pillForStatus(c.status))}>
                        {c.status}
                      </span>
                      {c.needs_approval ? (
                        <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-extrabold text-slate-700">
                          requiere aprobación
                        </span>
                      ) : null}
                    </div>

                    <div className="text-xs text-slate-600">
                      <span className="font-extrabold">Nodo:</span> {c.node_id ?? "—"} ·{" "}
                      <span className="font-extrabold">Creado:</span> {fmtTime(c.created_at)}
                    </div>

                    {c.error ? (
                      <div className="mt-2 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-900">
                        {c.error}
                      </div>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => approve(c.id)}
                      disabled={!canModerate}
                      className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-extrabold text-white hover:bg-blue-500 disabled:opacity-50"
                    >
                      Aprobar
                    </button>
                    <button
                      onClick={() => reject(c.id)}
                      disabled={!canModerate}
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-extrabold text-slate-900 hover:bg-slate-50 disabled:opacity-50"
                    >
                      Rechazar
                    </button>
                    <button
                      onClick={() => {
                        copyToClipboard(c.id);
                        onToast({ type: "ok", msg: "ID copiado ✅" });
                      }}
                      className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-extrabold text-slate-900 hover:bg-slate-50"
                    >
                      Copiar ID
                    </button>
                  </div>
                </div>

                <details className="mt-3">
                  <summary className="cursor-pointer text-sm font-extrabold text-slate-800">Ver detalles</summary>
                  <div className="mt-2 grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      <div className="mb-1 text-xs font-extrabold text-slate-600">payload</div>
                      <pre className="overflow-auto text-xs text-slate-800">{JSON.stringify(c.payload ?? null, null, 2)}</pre>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      <div className="mb-1 text-xs font-extrabold text-slate-600">result</div>
                      <pre className="overflow-auto text-xs text-slate-800">{JSON.stringify(c.result ?? null, null, 2)}</pre>
                    </div>
                  </div>

                  <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-white p-3 text-xs text-slate-700">
                      <span className="font-extrabold">Aprobado:</span> {fmtTime(c.approved_at)}
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-3 text-xs text-slate-700">
                      <span className="font-extrabold">Ejecutado:</span> {fmtTime(c.executed_at)}
                    </div>
                  </div>
                </details>
              </div>
            );
          })}
        </div>
      </Section>
    </div>
  );
}

function EventsTab({
  pid,
  sb,
  onToast,
  onInsights,
}: {
  pid: string;
  sb: ReturnType<typeof createBrowserSupabase>;
  onToast: (t: { type: "ok" | "err"; msg: string } | null) => void;
  onInsights: () => Promise<void>;
}) {
  const [items, setItems] = useState<Ev[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Manual event form
  const [nodeId, setNodeId] = useState<string>("");
  const [level, setLevel] = useState<EventLevel>("info");
  const [type, setType] = useState<string>("manual");
  const [message, setMessage] = useState<string>("");

  async function refresh() {
    setErr(null);
    setLoading(true);
    try {
      const { data, error } = await sb
        .from("events")
        .select("id, project_id, node_id, level, type, message, data, created_at")
        .eq("project_id", pid)
        .order("created_at", { ascending: false })
        .limit(120);
      if (error) throw error;
      setItems((data as Ev[]) ?? []);
    } catch (e: any) {
      setErr(e?.message ?? "No pude cargar eventos.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pid]);

  async function submitManual() {
    setErr(null);
    try {
      const res = await fetch("/api/events/manual", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          project_id: pid,
          node_id: nodeId || null,
          level,
          type,
          message,
          data: null,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || "No se pudo crear el evento.");

      setMessage("");
      await refresh();
      await onInsights();
      onToast({ type: "ok", msg: "Evento registrado ✅" });
    } catch (e: any) {
      setErr(e?.message ?? "No se pudo crear el evento.");
      onToast({ type: "err", msg: "No se pudo crear el evento." });
    }
  }

  return (
    <div className="space-y-4">
      <Section
        title="Registrar un evento manual"
        subtitle="Útil para dejar trazas claras (ej. ‘deploy iniciado’, ‘cambio de configuración’, etc.)."
        right={
          <button
            onClick={refresh}
            className="rounded-2xl bg-slate-900 px-4 py-2 text-xs font-extrabold text-white hover:bg-slate-800 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Cargando…" : "Actualizar"}
          </button>
        }
      >
        {err ? (
          <div className="mb-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">{err}</div>
        ) : null}

        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <div className="md:col-span-1">
            <label className="text-xs font-extrabold text-slate-600">Nodo (opcional)</label>
            <input
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-400"
              value={nodeId}
              onChange={(e) => setNodeId(e.target.value)}
              placeholder="ej. hocker-node-01"
            />
          </div>

          <div className="md:col-span-1">
            <label className="text-xs font-extrabold text-slate-600">Nivel</label>
            <select
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-extrabold text-slate-900 outline-none focus:border-blue-400"
              value={level}
              onChange={(e) => setLevel(e.target.value as EventLevel)}
            >
              <option value="info">Info (normal)</option>
              <option value="warn">Warn (ojo)</option>
              <option value="error">Error (grave)</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="text-xs font-extrabold text-slate-600">Tipo</label>
            <input
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-400"
              value={type}
              onChange={(e) => setType(e.target.value)}
              placeholder="manual"
            />
          </div>

          <div className="md:col-span-4">
            <label className="text-xs font-extrabold text-slate-600">Mensaje</label>
            <input
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-400"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe qué pasó…"
            />
          </div>
        </div>

        <div className="mt-3">
          <button
            onClick={submitManual}
            className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-extrabold text-white hover:bg-blue-500 disabled:opacity-50"
            disabled={!message.trim()}
          >
            Registrar evento
          </button>
        </div>
      </Section>

      <Section title="Feed de eventos" subtitle="Cronología del proyecto. Ideal para auditoría y debugging.">
        {loading ? <div className="text-sm text-slate-600">Cargando…</div> : null}
        {!loading && items.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            No hay eventos aún.
          </div>
        ) : null}

        <div className="space-y-3">
          {items.map((ev) => (
            <div key={ev.id} className="rounded-3xl border border-slate-200 bg-white p-4">
              <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={cx("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-extrabold", pillForLevel(ev.level))}>
                      {ev.level}
                    </span>
                    <span className="text-sm font-extrabold text-slate-900">{ev.type}</span>
                    <span className="text-xs font-bold text-slate-500">{relativeTime(ev.created_at)}</span>
                  </div>

                  <div className="text-sm text-slate-800">{ev.message}</div>

                  <div className="text-xs text-slate-600">
                    <span className="font-extrabold">Nodo:</span> {ev.node_id ?? "—"} ·{" "}
                    <span className="font-extrabold">Hora:</span> {fmtTime(ev.created_at)}
                  </div>
                </div>

                <button
                  onClick={() => {
                    copyToClipboard(ev.id);
                    onToast({ type: "ok", msg: "ID copiado ✅" });
                  }}
                  className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-extrabold text-slate-900 hover:bg-slate-50"
                >
                  Copiar ID
                </button>
              </div>

              {ev.data ? (
                <details className="mt-3">
                  <summary className="cursor-pointer text-sm font-extrabold text-slate-800">Ver datos</summary>
                  <pre className="mt-2 overflow-auto rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-800">
                    {JSON.stringify(ev.data, null, 2)}
                  </pre>
                </details>
              ) : null}
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

function GovernanceTab({
  pid,
  onToast,
  onInsights,
}: {
  pid: string;
  onToast: (t: { type: "ok" | "err"; msg: string } | null) => void;
  onInsights: () => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  const [controls, setControls] = useState<Controls>({
    id: "global",
    project_id: pid,
    kill_switch: false,
    allow_write: false,
    updated_at: null,
  });

  async function load() {
    setErr(null);
    setOkMsg(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/governance/killswitch?project_id=${encodeURIComponent(pid)}`, {
        method: "GET",
        headers: { "content-type": "application/json" },
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || "No se pudo cargar seguridad.");

      const c = (j?.controls ?? null) as Controls | null;
      setControls({
        id: c?.id ?? "global",
        project_id: pid,
        kill_switch: !!c?.kill_switch,
        allow_write: !!c?.allow_write,
        updated_at: c?.updated_at ?? null,
      });
    } catch (e: any) {
      setErr(e?.message ?? "No se pudo cargar seguridad.");
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    setErr(null);
    setOkMsg(null);
    setSaving(true);
    try {
      const res = await fetch("/api/governance/killswitch", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          project_id: pid,
          kill_switch: !!controls.kill_switch,
          allow_write: !!controls.allow_write,
        }),
      });

      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || "No se pudo guardar seguridad.");

      setOkMsg("Guardado ✅");
      onToast({ type: "ok", msg: "Seguridad actualizada ✅" });
      await load();
      await onInsights();
    } catch (e: any) {
      setErr(e?.message ?? "No se pudo guardar seguridad.");
      onToast({ type: "err", msg: "No se pudo guardar (¿eres owner?)" });
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pid]);

  return (
    <div className="space-y-4">
      <Section
        title="Seguridad del proyecto"
        subtitle="Dos switches. Impacto enorme. Control total."
        right={
          <>
            <button
              onClick={load}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-extrabold text-slate-900 hover:bg-slate-50 disabled:opacity-50"
              disabled={loading || saving}
            >
              Recargar
            </button>
            <button
              onClick={save}
              className="rounded-2xl bg-blue-600 px-4 py-2 text-xs font-extrabold text-white hover:bg-blue-500 disabled:opacity-50"
              disabled={loading || saving}
            >
              {saving ? "Guardando…" : "Guardar"}
            </button>
          </>
        }
      >
        {err ? (
          <div className="mb-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">{err}</div>
        ) : null}
        {okMsg ? (
          <div className="mb-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{okMsg}</div>
        ) : null}

        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-xs text-slate-600">
            <span className="font-extrabold text-slate-900">Última actualización:</span> {controls.updated_at ? fmtTime(controls.updated_at) : "—"}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="flex items-start gap-3 rounded-3xl border border-slate-200 bg-white p-4">
            <input
              type="checkbox"
              className="mt-1 h-5 w-5"
              checked={!!controls.kill_switch}
              onChange={(e) => setControls((c) => ({ ...c, kill_switch: e.target.checked }))}
            />
            <div className="space-y-1">
              <div className="text-sm font-extrabold text-slate-900">Bloqueo total (Kill switch)</div>
              <div className="text-xs text-slate-600">
                Si está <span className="font-extrabold">ON</span>, el sistema <span className="font-extrabold">no deja emitir acciones</span>.
                Perfecto cuando hay riesgo o algo se salió de control.
              </div>
            </div>
          </label>

          <label className="flex items-start gap-3 rounded-3xl border border-slate-200 bg-white p-4">
            <input
              type="checkbox"
              className="mt-1 h-5 w-5"
              checked={!!controls.allow_write}
              onChange={(e) => setControls((c) => ({ ...c, allow_write: e.target.checked }))}
            />
            <div className="space-y-1">
              <div className="text-sm font-extrabold text-slate-900">Ejecución directa (Allow write)</div>
              <div className="text-xs text-slate-600">
                Si está <span className="font-extrabold">OFF</span>, las acciones delicadas se van a <span className="font-extrabold">aprobación</span>.
                Si está <span className="font-extrabold">ON</span>, pueden ir directo (según permisos).
              </div>
            </div>
          </label>
        </div>

        <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-4">
          <div className="text-sm font-extrabold text-slate-900">Recomendación práctica</div>
          <div className="mt-1 text-sm text-slate-700">
            En producción: <span className="font-extrabold">Allow write OFF</span> por defecto.
            Solo se prende cuando tú lo decidas y por ventana corta.
          </div>
        </div>

        <div className="mt-3 text-[11px] text-slate-500">
          Si te marca “Solo owner”, está bien: el sistema lo protege a propósito.
        </div>
      </Section>
    </div>
  );
}