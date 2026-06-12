import type { HockerAgentLiveStatus } from "@/lib/hocker-live-summary";

type BadgeTone = "active" | "protected" | "pending" | "blocked" | "neutral";

function formatDate(value: string | null) {
  if (!value) return "Sin señal registrada";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sin señal registrada";

  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function badgeClass(tone: BadgeTone) {
  const base = "inline-flex rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em]";

  if (tone === "active") return `${base} border-emerald-300/30 bg-emerald-400/10 text-emerald-100`;
  if (tone === "protected") return `${base} border-sky-300/30 bg-sky-400/10 text-sky-100`;
  if (tone === "pending") return `${base} border-amber-300/30 bg-amber-400/10 text-amber-100`;
  if (tone === "blocked") return `${base} border-rose-300/30 bg-rose-400/10 text-rose-100`;

  return `${base} border-white/10 bg-white/[0.04] text-slate-300`;
}

function agentTone(state: HockerAgentLiveStatus["state"]): BadgeTone {
  if (state === "activo") return "active";
  if (state === "sin_senal_reciente") return "pending";
  return "blocked";
}

function commandTone(status: string | null): BadgeTone {
  if (status === "done") return "active";
  if (status === "error") return "blocked";
  if (status === "pending" || status === "queued") return "pending";
  return "neutral";
}

function readableTask(command: string | null) {
  if (command === "ping") return "Prueba de conexión";
  if (command === "status") return "Revisión de estado";
  if (!command) return "Sin tarea reciente";
  return command;
}

function MiniCard({
  label,
  value,
  tone,
  detail,
}: {
  label: string;
  value: string;
  tone: BadgeTone;
  detail: string;
}) {
  return (
    <article className="rounded-3xl border border-white/10 bg-white/[0.035] p-4">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-base font-black text-white">{value}</h3>
        <span className={badgeClass(tone)}>{value}</span>
      </div>
      <p className="mt-2 text-xs leading-5 text-slate-500">{detail}</p>
    </article>
  );
}

export default function PhysicalAgentPanel({ agent }: { agent: HockerAgentLiveStatus }) {
  const stateTone = agentTone(agent.state);
  const safeModeLabel = agent.safe_zone_enabled ? "Activado" : "Sin confirmar";
  const writesLabel = agent.writes_allowed ? "Permitida" : "Bloqueada";
  const killSwitchLabel = agent.kill_switch_enabled ? "Encendido" : "Apagado";

  const summary =
    agent.state === "activo"
      ? "El agente físico respondió recientemente y está listo para tareas seguras."
      : agent.state === "sin_senal_reciente"
        ? "El agente físico existe, pero no ha respondido recientemente."
        : "No hay señal reciente del agente físico.";

  return (
    <section className="rounded-[32px] border border-cyan-300/15 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.12),transparent_36%),rgba(255,255,255,0.035)] p-5 shadow-[0_22px_90px_rgba(0,0,0,0.28)]">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-200">Puente seguro</p>
          <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-white">Agente físico</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
            Este módulo confirma si el ejecutor local está respondiendo. Solo muestra señales claras y seguras.
          </p>
        </div>

        <span className={badgeClass(stateTone)}>{agent.state_label}</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MiniCard
          label="Estado"
          value={agent.state_label}
          tone={stateTone}
          detail={`Última respuesta: ${formatDate(agent.last_seen_at)}`}
        />

        <MiniCard
          label="Modo seguro"
          value={safeModeLabel}
          tone={agent.safe_zone_enabled ? "protected" : "pending"}
          detail="Las tareas se procesan en una zona controlada."
        />

        <MiniCard
          label="Escritura"
          value={writesLabel}
          tone={agent.writes_allowed ? "pending" : "protected"}
          detail="Las acciones de escritura deben seguir bloqueadas salvo aprobación explícita."
        />

        <MiniCard
          label="Última tarea"
          value={readableTask(agent.last_command)}
          tone={commandTone(agent.last_command_status)}
          detail={agent.last_command_status ? `Resultado: ${agent.last_command_status}` : "Sin tarea reciente."}
        />
      </div>

      <div className="mt-4 rounded-3xl border border-white/10 bg-black/20 p-4">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Resumen claro</p>
        <p className="mt-2 text-sm leading-6 text-slate-300">{summary}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className={badgeClass(agent.writes_allowed ? "pending" : "protected")}>
            Escritura {writesLabel}
          </span>
          <span className={badgeClass(agent.kill_switch_enabled ? "blocked" : "active")}>
            Bloqueo de emergencia {killSwitchLabel}
          </span>
          <span className={badgeClass("neutral")}>
            ID interno: {agent.node_id}
          </span>
        </div>
      </div>
    </section>
  );
}
