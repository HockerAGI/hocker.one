export default function SignalBackdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-[#030711]" />
      <div className="absolute inset-x-0 top-0 h-[42rem] bg-[radial-gradient(circle_at_50%_-12%,rgba(85,220,255,0.12),transparent_46%)]" />
      <div className="absolute -left-40 top-[22%] h-[26rem] w-[26rem] rounded-full bg-sky-400/[0.045] blur-3xl" />
      <div className="absolute -right-44 bottom-[12%] h-[30rem] w-[30rem] rounded-full bg-blue-500/[0.04] blur-3xl" />
      <div className="absolute inset-x-[8%] top-[61px] h-px bg-gradient-to-r from-transparent via-sky-300/20 to-transparent" />
      <div className="absolute inset-0 opacity-[0.025] [background-image:linear-gradient(rgba(255,255,255,0.18)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.14)_1px,transparent_1px)] [background-size:64px_64px] [mask-image:linear-gradient(to_bottom,black,transparent_72%)]" />
    </div>
  );
}
