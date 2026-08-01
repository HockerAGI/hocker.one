export default function HockerPageHeader({
  eyebrow,
  title,
  text,
}: {
  eyebrow: string;
  title: string;
  text: string;
}) {
  return (
    <header className="hko-fade-up relative mb-5 overflow-hidden rounded-[30px] border border-white/[0.07] bg-gradient-to-br from-white/[0.055] via-[#07101f]/80 to-sky-500/[0.035] p-5 shadow-[0_24px_90px_rgba(0,0,0,0.24)] backdrop-blur-2xl sm:p-7">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.15),transparent_32%),linear-gradient(120deg,rgba(255,255,255,0.025),transparent_50%)]"
        aria-hidden="true"
      />
      <div className="relative max-w-4xl">
        <p className="text-[0.68rem] font-black uppercase tracking-[0.32em] text-sky-300/80">
          {eyebrow}
        </p>
        <h1 className="mt-3 text-4xl font-black leading-[0.98] tracking-[-0.045em] text-white sm:text-5xl lg:text-6xl">
          {title}
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
          {text}
        </p>
      </div>
    </header>
  );
}
