export type EvidencePanelItem = {
  label: string;
  value: string;
};

export type EvidencePanelProps = {
  title?: string;
  description?: string;
  items: EvidencePanelItem[];
  footer?: string;
};

export function EvidencePanel({
  title = "Evidencia",
  description = "Aquí queda guardado lo importante. Nada crítico desaparece.",
  items,
  footer,
}: EvidencePanelProps) {
  return (
    <aside className="hocker-card p-5">
      <p className="text-xs uppercase tracking-[0.24em] text-[var(--hocker-cyan)]">{title}</p>
      <p className="mt-2 text-sm leading-6 text-[var(--hocker-text-soft)]">{description}</p>

      <div className="mt-5 space-y-3">
        {items.map((item) => (
          <div key={`${item.label}-${item.value}`} className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-[var(--hocker-text-muted)]">{item.label}</p>
            <p className="mt-1 text-sm font-medium text-[var(--hocker-text-main)]">{item.value}</p>
          </div>
        ))}
      </div>

      {footer ? (
        <p className="mt-4 rounded-2xl border border-cyan-300/10 bg-cyan-300/[0.045] p-4 text-sm leading-6 text-cyan-50">
          {footer}
        </p>
      ) : null}
    </aside>
  );
}
