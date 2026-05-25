type OwnerMetricCardProps = {
  label: string;
  value: string;
  detail: string;
  tone?: "blue" | "green" | "gold" | "red";
};

function toneClass(tone: OwnerMetricCardProps["tone"]) {
  if (tone === "green") return "border-emerald-300/20 bg-emerald-300/10 text-emerald-100";
  if (tone === "gold") return "border-[var(--hocker-gold)]/30 bg-[var(--hocker-gold)]/10 text-amber-100";
  if (tone === "red") return "border-rose-300/20 bg-rose-300/10 text-rose-100";
  return "border-cyan-300/20 bg-cyan-300/10 text-cyan-100";
}

export function OwnerMetricCard({ label, value, detail, tone = "blue" }: OwnerMetricCardProps) {
  return (
    <article className={`rounded-3xl border p-4 ${toneClass(tone)}`}>
      <p className="text-xs uppercase tracking-[0.24em] opacity-70">{label}</p>
      <p className="mt-3 text-2xl font-semibold text-white">{value}</p>
      <p className="mt-2 text-sm leading-6 opacity-75">{detail}</p>
    </article>
  );
}
