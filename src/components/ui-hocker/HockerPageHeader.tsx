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
    <header className="hko-fade-up relative mb-5 overflow-hidden rounded-2xl border border-slate-700/65 bg-[#101a29] p-5 sm:p-7">
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(98,215,255,0.045),transparent_50%)]"
        aria-hidden="true"
      />
      <div className="relative max-w-4xl">
        <p className="text-sm font-medium tracking-normal text-sky-200">
          {eyebrow}
        </p>
        <h1 className="mt-2 text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl">
          {title}
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300 sm:text-base">
          {text}
        </p>
      </div>
    </header>
  );
}
