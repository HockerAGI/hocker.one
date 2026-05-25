"use client";

import { useMemo, useState } from "react";
import {
  AppWindow,
  BrainCircuit,
  CheckCircle2,
  CircleAlert,
  Loader2,
  LockKeyhole,
  PlugZap,
  Send,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { HOCKER_HUMAN_COPY } from "@/lib/hocker-human-copy";
import {
  HOCKER_COMMAND_CENTER_AGIS,
  HOCKER_COMMAND_CENTER_APPS,
  HOCKER_COMMAND_CENTER_INTEGRATIONS,
  HOCKER_COMMAND_CENTER_TASKS,
  type HockerCommandItem,
  type HockerCommandStatus,
} from "@/lib/hocker-command-center-registry";

const tabs = [
  { id: "apps", label: "Apps", icon: AppWindow },
  { id: "agis", label: "AGIs", icon: BrainCircuit },
  { id: "integrations", label: "APIs", icon: PlugZap },
  { id: "tasks", label: "Tareas", icon: CheckCircle2 },
] as const;

type TabId = (typeof tabs)[number]["id"];

function statusLabel(status: HockerCommandStatus) {
  switch (status) {
    case "live":
      return "Activo";
    case "ready":
      return "Listo";
    case "protected":
      return "Protegido";
    case "building":
      return "En construcción";
    case "blocked":
      return "Bloqueado";
    default:
      return "Revisión";
  }
}

function statusClass(status: HockerCommandStatus) {
  switch (status) {
    case "live":
      return "border-emerald-400/40 bg-emerald-400/10 text-emerald-200";
    case "ready":
      return "border-cyan-400/40 bg-cyan-400/10 text-cyan-200";
    case "protected":
      return "border-amber-400/40 bg-amber-400/10 text-amber-200";
    case "building":
      return "border-violet-400/40 bg-violet-400/10 text-violet-200";
    case "blocked":
      return "border-rose-400/40 bg-rose-400/10 text-rose-200";
    default:
      return "border-white/20 bg-white/10 text-white";
  }
}

function itemsForTab(tab: TabId): HockerCommandItem[] {
  if (tab === "apps") return HOCKER_COMMAND_CENTER_APPS;
  if (tab === "agis") return HOCKER_COMMAND_CENTER_AGIS;
  if (tab === "integrations") return HOCKER_COMMAND_CENTER_INTEGRATIONS;
  return HOCKER_COMMAND_CENTER_TASKS;
}

function ModuleCard({ item }: { item: HockerCommandItem }) {
  return (
    <article className="group rounded-3xl border border-white/10 bg-white/[0.045] p-4 shadow-2xl shadow-black/30 backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-cyan-300/30 hover:bg-white/[0.07]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/60">{item.label}</p>
          <h3 className="mt-2 text-lg font-semibold text-white">{item.name}</h3>
        </div>
        <span className={`shrink-0 rounded-full border px-3 py-1 text-[11px] font-medium ${statusClass(item.status)}`}>
          {statusLabel(item.status)}
        </span>
      </div>

      <p className="mt-4 min-h-12 text-sm leading-6 text-slate-300">{item.short}</p>

      <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-3">
        <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Responsable</p>
        <p className="mt-1 text-sm text-slate-200">{item.owner}</p>
      </div>

      <div className="mt-3 rounded-2xl border border-cyan-300/10 bg-cyan-300/[0.035] p-3">
        <p className="text-[11px] uppercase tracking-[0.22em] text-cyan-200/60">Siguiente acción</p>
        <p className="mt-1 text-sm text-cyan-50">{item.next}</p>
      </div>
    </article>
  );
}

export function NovaUnifiedCommandCenter() {
  const [activeTab, setActiveTab] = useState<TabId>("apps");
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState(`${HOCKER_HUMAN_COPY.private_tagline} Pide una revisión, una corrección o un plan de acción.`);
  const [loading, setLoading] = useState(false);

  const activeItems = useMemo(() => itemsForTab(activeTab), [activeTab]);

  async function sendMessage() {
    const clean = message.trim();
    if (!clean || loading) return;

    setLoading(true);
    setReply("NOVA está revisando tu solicitud...");

    try {
      const response = await fetch("/api/nova/chat", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          mode: "pro",
          message: clean,
          messages: [{ role: "user", content: clean }],
        }),
      });

      const data = await response.json().catch(() => ({}));
      const text =
        data.reply ||
        data.response ||
        data.message ||
        data.text ||
        data.error ||
        "NOVA respondió, pero no recibí un texto limpio para mostrar.";

      setReply(String(text));
      setMessage("");
    } catch {
      setReply("No pude conectar con NOVA en este entorno. Revisa que NOVA_AGI_URL esté configurada y vuelve a intentar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="hocker-soft-shell min-h-screen overflow-hidden text-white">
      <section className="relative mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute inset-0 -z-0">
          <div className="absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-cyan-400/20 blur-3xl" />
          <div className="absolute right-0 top-24 h-96 w-96 rounded-full bg-violet-500/20 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-80 w-80 rounded-full bg-emerald-400/10 blur-3xl" />
        </div>

        <header className="relative z-10 rounded-[2rem] border border-white/10 bg-white/[0.045] p-5 shadow-2xl shadow-black/40 backdrop-blur-2xl md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-xs font-medium uppercase tracking-[0.3em] text-cyan-100">
                <Sparkles className="h-4 w-4" />
                NOVA Command Center
              </div>
              <h1 className="mt-5 text-4xl font-semibold tracking-tight text-white md:text-6xl">
                {HOCKER_HUMAN_COPY.private_tagline}
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300 md:text-lg">
                Habla con NOVA, revisa módulos, detecta pendientes y prepara acciones sin saltar entre pantallas.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[420px]">
              <div className="rounded-3xl border border-emerald-300/20 bg-emerald-300/10 p-4">
                <ShieldCheck className="h-5 w-5 text-emerald-200" />
                <p className="mt-3 text-sm font-medium text-white">Owner Gate</p>
                <p className="text-xs text-emerald-100/70">Activo</p>
              </div>
              <div className="rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-4">
                <BrainCircuit className="h-5 w-5 text-cyan-200" />
                <p className="mt-3 text-sm font-medium text-white">NOVA</p>
                <p className="text-xs text-cyan-100/70">Centro vivo</p>
              </div>
              <div className="rounded-3xl border border-amber-300/20 bg-amber-300/10 p-4">
                <LockKeyhole className="h-5 w-5 text-amber-200" />
                <p className="mt-3 text-sm font-medium text-white">Acciones sensibles</p>
                <p className="text-xs text-amber-100/70">Protegidas</p>
              </div>
            </div>
          </div>
        </header>

        <section className="relative z-10 grid gap-6 lg:grid-cols-[0.95fr_1.35fr]">
          <div className="rounded-[2rem] border border-white/10 bg-black/30 p-4 shadow-2xl shadow-black/40 backdrop-blur-xl md:p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-300/15 text-cyan-100">
                <BrainCircuit className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Habla con NOVA</h2>
                <p className="text-sm text-slate-400">Pide acciones claras. NOVA no ejecuta sin permiso.</p>
              </div>
            </div>

            <div className="mt-5 min-h-48 rounded-3xl border border-white/10 bg-white/[0.045] p-4 text-sm leading-7 text-slate-200">
              {reply}
            </div>

            <div className="mt-4 flex gap-3">
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                    void sendMessage();
                  }
                }}
                placeholder="Dile a NOVA qué necesitas mover…"
                className="min-h-24 flex-1 resize-none rounded-3xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white outline-none ring-cyan-300/30 placeholder:text-slate-500 focus:border-cyan-300/40 focus:ring-4"
              />
              <button
                type="button"
                onClick={() => void sendMessage()}
                disabled={loading || !message.trim()}
                className="flex w-16 shrink-0 items-center justify-center rounded-3xl bg-cyan-300 text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Enviar a NOVA"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              </button>
            </div>

            <div className="mt-4 rounded-3xl border border-white/10 bg-white/[0.035] p-4">
              <div className="flex items-center gap-2 text-sm text-amber-100">
                <CircleAlert className="h-4 w-4" />
                Modo seguro
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                NOVA puede preparar, revisar y proponer. Para ejecutar cambios reales, se requiere aprobación.
              </p>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-4 shadow-2xl shadow-black/40 backdrop-blur-xl md:p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-white">Módulos principales</h2>
                <p className="mt-1 text-sm text-slate-400">Todo separado, limpio y accionable.</p>
              </div>

              <div className="grid grid-cols-4 gap-2 rounded-3xl border border-white/10 bg-black/30 p-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const selected = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center justify-center gap-2 rounded-2xl px-3 py-2 text-xs font-medium transition md:text-sm ${
                        selected
                          ? "bg-cyan-300 text-slate-950 shadow-lg shadow-cyan-500/20"
                          : "text-slate-300 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {activeItems.map((item) => (
                <ModuleCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
