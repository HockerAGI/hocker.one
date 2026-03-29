// Solo las secciones clave a modificar dentro de PageShell.tsx
// ...
<div className="flex flex-wrap items-center gap-4">
  {/* LOGO CON GLOW: Ahora el BrandMark emitirá una sutil aura azul */}
  <div className="relative group transition-all duration-500 hover:drop-shadow-[0_0_15px_rgba(14,165,233,0.5)]">
    <BrandMark compact />
  </div>
  
  {/* INDICADOR DE FASE: Color más vibrante para legibilidad */}
  <div className="rounded-full border border-blue-400/40 bg-blue-500/20 px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.3em] text-blue-300 shadow-[inset_0_0_10px_rgba(56,189,248,0.2)] backdrop-blur-md">
    Omni-Sync 2025
  </div>
</div>

{/* TITULO Y SUBTITULO: Peso visual incrementado */}
<h1 className="mt-4 text-4xl font-black tracking-tighter text-white drop-shadow-sm lg:text-5xl">
  {title}
</h1>
{subtitle && (
  <p className="mt-4 max-w-3xl text-[16px] font-semibold leading-relaxed text-slate-300 antialiased">
    {subtitle}
  </p>
)}
//
