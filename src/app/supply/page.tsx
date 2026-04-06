import type { Metadata } from "next";
import Link from "next/link";
import BrandMark from "@/components/BrandMark";
import PageShell from "@/components/PageShell";
import Hint from "@/components/Hint";

export const metadata: Metadata = {
  title: "Supply",
  description: "Supervisión de la cadena de suministro, inventarios y cumplimiento.",
};

const supply = [
  {
    title: "Carga real",
    desc: "Activos, pedidos y stock con lectura clara.",
    accent: "sky",
  },
  {
    title: "Sincronía",
    desc: "Órdenes y estados alineados con el resto del ecosistema.",
    accent: "emerald",
  },
  {
    title: "Inventario",
    desc: "Visibilidad multi-proyecto y operación simple.",
    accent: "cyan",
  },
  {
    title: "HKR Supply",
    desc: "Identidad de línea con enfoque operativo y visual.",
    accent: "rose",
  },
] as const;

const roadmap = [
  "Carga de activos reales",
  "Sincronización de órdenes",
  "Inventario multi-proyecto",
  "Enlace HKR Supply",
] as const;

const metrics = [
  { label: "Pedidos", value: "En vivo" },
  { label: "Stock", value: "Activo" },
  { label: "Entregas", value: "Rastreables" },
  { label: "Estado", value: "Listo" },
] as const;

function accentClass(accent: (typeof supply)[number]["accent"]): string {
  switch (accent) {
    case "emerald":
      return "border-emerald-400/20 bg-emerald-500/10 text-emerald-300 shadow-[0_0_24px_rgba(16,185,129,0.12)]";
    case "cyan":
      return "border-cyan-400/20 bg-cyan-500/10 text-cyan-300 shadow-[0_0_24px_rgba(34,211,238,0.12)]";
    case "rose":
      return "border-rose-400/20 bg-rose-500/10 text-rose-300 shadow-[0_0_24px_rgba(244,63,94,0.12)]";
    default:
      return "border-sky-400/20 bg-sky-500/10 text-sky-300 shadow-[0_0_24px_rgba(14,165,233,0.12)]";
  }
}

export default function SupplyPage() {
  return (
    <PageShell
      title="Logística Operativa"
      subtitle="Supervisión de la cadena de suministro, inventarios y cumplimiento."
      actions={
        <>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-2.5 text-xs font-black uppercase tracking-widest text-slate-100 transition hover:bg-white/10 active:scale-95"
          >
            <svg
              className="h-4 w-4 text-sky-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver
          </Link>
        </>
      }
    >
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-4 rounded-[30px] border border-white/5 bg-slate-950/45 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <BrandMark compact />
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-sky-400">
                Supply
              </p>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                Vista rápida de inventario, pedidos y cumplimiento.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {metrics.map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-white/5 bg-white/[0.03] px-3 py-2 text-center"
              >
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                  {item.label}
                </p>
                <p className="mt-1 text-xs font-black text-white">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        <Hint title="Flujo de valor">
          Este sector unifica los datos comerciales. Desde la captura del lead por las IAs hasta la entrega final del producto.
        </Hint>

        <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 hocker-page-enter">
          {supply.map((item, index) => (
            <article
              key={item.title}
              className={`group relative overflow-hidden rounded-[28px] border p-6 transition-all duration-300 hover:-translate-y-1 hover:bg-white/[0.05] ${accentClass(
                item.accent,
              )}`}
              style={{ animationDelay: `${index * 40}ms` }}
            >
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.08),transparent_45%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <div className="relative flex h-full flex-col">
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-slate-950/60">
                  <span className="h-6 w-6 rounded-full border border-current shadow-[0_0_16px_currentColor]" />
                </div>

                <h3 className="text-[14px] font-black uppercase tracking-wide text-white">
                  {item.title}
                </h3>
                <p className="mt-2 text-[11px] leading-relaxed text-slate-400">
                  {item.desc}
                </p>

                <div className="mt-5 flex-1 rounded-2xl border border-white/5 bg-slate-950/45 p-3">
                  <p className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-500">
                    Estado
                  </p>
                  <p className="mt-1 text-xs font-semibold text-slate-200">
                    {item.title === "Carga real"
                      ? "Conectado"
                      : item.title === "Sincronía"
                        ? "Sincronizado"
                        : item.title === "Inventario"
                          ? "Monitoreado"
                          : "Identificado"}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="hocker-panel-pro overflow-hidden">
            <div className="border-b border-white/5 bg-slate-950/40 px-5 py-4">
              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-sky-400">
                Roadmap
              </p>
              <h2 className="mt-2 text-lg font-black text-white">
                Enfoque de integración
              </h2>
            </div>

            <div className="p-5">
              <div className="space-y-3">
                {roadmap.map((step, index) => (
                  <div
                    key={step}
                    className="group flex items-center gap-4 rounded-[22px] border border-white/5 bg-white/[0.03] p-4 transition-all hover:border-sky-500/20 hover:bg-white/[0.05]"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-sky-400/20 bg-sky-500/10 text-[10px] font-black text-sky-300 shadow-[0_0_18px_rgba(14,165,233,0.12)]">
                      0{index + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white">{step}</p>
                      <p className="mt-1 text-[11px] text-slate-500">
                        Fase visual y operativa alineada al ecosistema.
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="hocker-glass-vfx overflow-hidden border-sky-500/15">
            <div className="border-b border-white/5 px-5 py-4 sm:px-6">
              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-sky-400">
                HKR Supply
              </p>
              <h2 className="mt-2 text-lg font-black text-white">
                Lectura clara, visual fuerte
              </h2>
            </div>

            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <div className="rounded-[24px] border border-white/5 bg-slate-950/45 p-4">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                  Cobertura
                </p>
                <p className="mt-2 text-sm font-bold text-white">
                  Inventario, pedidos y rutas.
                </p>
                <p className="mt-2 text-[11px] leading-relaxed text-slate-400">
                  Todo con profundidad, contraste y sin saturar la interfaz.
                </p>
              </div>

              <div className="rounded-[24px] border border-white/5 bg-slate-950/45 p-4">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                  UX
                </p>
                <p className="mt-2 text-sm font-bold text-white">
                  Rápida y fácil de navegar.
                </p>
                <p className="mt-2 text-[11px] leading-relaxed text-slate-400">
                  Botones grandes, texto corto y lectura directa en móvil y web.
                </p>
              </div>

              <div className="rounded-[24px] border border-white/5 bg-slate-950/45 p-4 sm:col-span-2">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                  Nota
                </p>
                <p className="mt-2 text-[11px] leading-relaxed text-slate-300">
                  La identidad visual mantiene azul, cian y blanco para que el logo destaque sobre fondos oscuros con brillo y profundidad.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </PageShell>
  );
}