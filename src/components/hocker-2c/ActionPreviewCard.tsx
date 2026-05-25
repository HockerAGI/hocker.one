import type { ReactNode } from "react";

export type HockerActionRisk = "low" | "medium" | "high";

export type ActionPreviewCardProps = {
  title: string;
  summary: string;
  risk: HockerActionRisk;
  target: string;
  steps: string[];
  requiresApproval: boolean;
  children?: ReactNode;
};

function riskLabel(risk: HockerActionRisk) {
  if (risk === "low") return "Riesgo bajo";
  if (risk === "medium") return "Riesgo medio";
  return "Riesgo alto";
}

function riskClass(risk: HockerActionRisk) {
  if (risk === "low") return "border-emerald-300/30 bg-emerald-300/10 text-emerald-100";
  if (risk === "medium") return "border-amber-300/30 bg-amber-300/10 text-amber-100";
  return "border-rose-300/30 bg-rose-300/10 text-rose-100";
}

export function ActionPreviewCard({
  title,
  summary,
  risk,
  target,
  steps,
  requiresApproval,
  children,
}: ActionPreviewCardProps) {
  return (
    <section className="hocker-card owner-action p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-[var(--hocker-gold)]">
            Acción preparada
          </p>
          <h3 className="mt-2 text-xl font-semibold text-[var(--hocker-text-main)]">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-[var(--hocker-text-soft)]">{summary}</p>
        </div>

        <span className={`w-fit rounded-full border px-3 py-1 text-xs font-medium ${riskClass(risk)}`}>
          {riskLabel(risk)}
        </span>
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.045] p-4">
        <p className="text-xs uppercase tracking-[0.22em] text-[var(--hocker-text-muted)]">Destino</p>
        <p className="mt-1 text-sm font-medium text-[var(--hocker-text-main)]">{target}</p>
      </div>

      <ol className="mt-4 space-y-2 text-sm leading-6 text-[var(--hocker-text-soft)]">
        {steps.map((step, index) => (
          <li key={`${step}-${index}`}>
            <span className="mr-2 text-[var(--hocker-cyan)]">{index + 1}.</span>
            {step}
          </li>
        ))}
      </ol>

      {requiresApproval && (
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            className="hocker-focus-ring rounded-2xl border border-[var(--hocker-gold)]/60 bg-[var(--hocker-blue)] px-4 py-3 text-sm font-semibold text-white shadow-[0_0_28px_rgba(214,168,79,0.14)] transition hover:-translate-y-0.5"
          >
            Aprobar acción
          </button>
          <button
            type="button"
            className="hocker-focus-ring rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/15"
          >
            Ver evidencia
          </button>
          <button
            type="button"
            className="hocker-focus-ring rounded-2xl border border-rose-300/20 bg-rose-300/10 px-4 py-3 text-sm font-medium text-rose-100 transition hover:bg-rose-300/15"
          >
            Rechazar
          </button>
        </div>
      )}

      {children ? <div className="mt-4">{children}</div> : null}
    </section>
  );
}
