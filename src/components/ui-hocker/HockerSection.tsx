export default function HockerSection({
  title,
  text,
  children,
  defaultOpen = true,
}: {
  title: string;
  text?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details className="hko-section group" open={defaultOpen}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-[28px] border border-white/10 bg-white/[0.035] px-5 py-4 transition hover:bg-white/[0.055]">
        <div>
          <h2 className="text-xl font-black tracking-tight text-white">{title}</h2>
          {text ? <p className="mt-1 text-sm leading-relaxed text-slate-400">{text}</p> : null}
        </div>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-slate-950/60 text-cyan-200 transition group-open:rotate-180">↓</span>
      </summary>
      <div className="hko-section-body pt-4">{children}</div>
    </details>
  );
}
