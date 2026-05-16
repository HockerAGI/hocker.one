import { getStatusHelp, getStatusLabel, getStatusTone } from "@/lib/hocker-dashboard";

export default function StatusBadge({ status, compact = false }: { status: string; compact?: boolean }) {
  return (
    <span
      title={getStatusHelp(status)}
      className={[
        "inline-flex items-center rounded-full border font-black uppercase tracking-[0.18em]",
        compact ? "px-2.5 py-1 text-[9px]" : "px-3 py-1.5 text-[10px]",
        getStatusTone(status),
      ].join(" ")}
    >
      <span className="mr-2 h-1.5 w-1.5 rounded-full bg-current shadow-[0_0_12px_currentColor]" />
      {getStatusLabel(status)}
    </span>
  );
}
