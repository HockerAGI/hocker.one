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
    <header className="hko-fade-up mb-5 rounded-[32px] border border-white/10 bg-white/[0.035] p-5 shadow-[0_20px_80px_rgba(2,6,23,0.22)] sm:p-7">
      <p className="hko-kicker">{eyebrow}</p>
      <h1 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-5xl">{title}</h1>
      <p className="mt-3 max-w-3xl text-base leading-relaxed text-slate-300">{text}</p>
    </header>
  );
}
