import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Brain, BriefcaseBusiness, ShieldCheck, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "Empresa · Hocker AGI Technologies",
  description: "Base pública preparada para el sitio empresarial de Hocker AGI Technologies.",
};

const pillars = [
  { title: "IA y automatización", text: "Sistemas inteligentes para operar, responder, analizar y vender.", icon: Brain },
  { title: "Publicidad y contenido", text: "Campañas, branding, reels, sitios y funnels con IA.", icon: Sparkles },
  { title: "Plataformas digitales", text: "Apps, paneles, CRM, nubes privadas y módulos conectados.", icon: BriefcaseBusiness },
  { title: "Seguridad y control", text: "Accesos, permisos, auditoría y operación privada.", icon: ShieldCheck },
];

export default function EmpresaPage() {
  return (
    <main className="min-h-[100dvh] bg-[#030711] px-4 py-6 text-white sm:px-6 lg:px-8">
      <section className="mx-auto max-w-6xl rounded-[34px] border border-white/10 bg-[#07101f] p-6 shadow-[0_30px_120px_rgba(0,0,0,0.35)] sm:p-10">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-white">
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Link>

        <div className="mt-10 max-w-4xl">
          <p className="text-[11px] font-black uppercase tracking-[0.26em] text-cyan-300">Hocker AGI Technologies</p>
          <h1 className="mt-4 text-5xl font-black leading-[0.95] tracking-[-0.055em] sm:text-7xl">
            Sitio empresarial listo para construir.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            Esta página es la base pública segura. No muestra módulos internos, llaves, rutas privadas ni estados operativos del panel Hocker ONE.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {pillars.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.title} className="rounded-[28px] border border-white/10 bg-white/[0.035] p-5">
                <Icon className="h-7 w-7 text-cyan-300" />
                <h2 className="mt-4 text-xl font-black text-white">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-400">{item.text}</p>
              </article>
            );
          })}
        </div>

        <div className="mt-10 rounded-[28px] border border-amber-400/20 bg-amber-400/10 p-5">
          <h2 className="text-lg font-black text-amber-100">Pendiente de contenido público</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Aquí después se agregan secciones comerciales: Nosotros, Servicios, Casos, Contacto, Legal y Portafolio.
          </p>
        </div>
      </section>
    </main>
  );
}
