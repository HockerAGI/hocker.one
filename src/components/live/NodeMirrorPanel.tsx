import type { HockerNodeMirrorSummary, HockerNodeRuntimeSummary } from "@/lib/hocker-node-mirror-summary";

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

function stateTone(state: HockerNodeRuntimeSummary["state"]): BadgeTone {
  if (state === "activo") return "active";
  if (state === "sin_senal_reciente") return "pending";
  return "blocked";
}

function yesNo(value: boolean | null, positive: string, negative: string, unknown = "Sin confirmar") {
  if (value === true) return positive;
  if (value === false) return negative;
  return unknown;
}

function NodeCard({ node }: { node: HockerNodeRuntimeSummary }) {
  return (
    <article className="rounded-[28px] border border-white/10 bg-white/[0.035] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">{node.role_label}</p>
          <h3 className="mt-2 text-xl font-black tracking-[-0.04em] text-white">{node.title}</h3>
          <p className="mt-1 text-xs text-slate-500">Última señal: {formatDate(node.last_seen_at)}</p>
        </div>
        <span className={badgeClass(stateTone(node.state))}>{node.state_label}</span>
      </div>

      <div className="mt-4 grid gap-2">
        <div className="rounded-2xl border border-white/10 bg-black/15 px-3 py-2">
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">Modo seguro</p>
          <p className="mt-1 text-sm font-bold text-white">
            {yesNo(node.safe_mode_enabled, "Activado", "Desactivado")}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/15 px-3 py-2">
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">Escritura</p>
          <p className="mt-1 text-sm font-bold text-white">
            {yesNo(node.writes_allowed, "Permitida", "Bloqueada")}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/15 px-3 py-2">
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">Última tarea</p>
          <p className="mt-1 text-sm font-bold text-white">{node.last_task_label}</p>
        </div>
      </div>
    </article>
  );
}

export default function NodeMirrorPanel({ bridge }: { bridge: HockerNodeMirrorSummary }) {
  const failoverTone: BadgeTone = bridge.failover.state === "bloqueado" ? "blocked" : "pending";

  return (
    <section className="rounded-[32px] border border-fuchsia-300/15 bg-[radial-gradient(circle_at_top_left,rgba(217,70,239,0.12),transparent_38%),rgba(255,255,255,0.035)] p-5 shadow-[0_22px_90px_rgba(0,0,0,0.28)]">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-fuchsia-200">Continuidad IA↔IA</p>
          <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-white">Nodo espejo</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
            Esta sección separa el nodo principal del nodo espejo. El espejo no se marca como activo hasta responder con señal real.
          </p>
        </div>

        <span className={badgeClass(failoverTone)}>Failover {bridge.failover.label}</span>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <NodeCard node={bridge.primary} />
        <NodeCard node={bridge.mirror} />
      </div>

      <div className="mt-4 rounded-3xl border border-white/10 bg-black/20 p-4">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Lectura ejecutiva</p>
        <ul className="mt-3 space-y-2">
          {bridge.executive_summary.map((item) => (
            <li key={item} className="text-sm leading-6 text-slate-300">
              {item}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs leading-5 text-slate-500">{bridge.failover.reason}</p>
      </div>
    </section>
  );
}
