import type { Metadata } from "next";
import PageShell from "@/components/PageShell";

export const metadata: Metadata = {
  title: "AGIs · Hocker ONE",
  description: "Mapa simple de inteligencias del ecosistema Hocker.",
};

const groups = [
  {
    title: "Núcleo",
    text: "IAs que coordinan, recuerdan, protegen y predicen.",
    items: [
      ["NOVA", "IA madre del ecosistema."],
      ["Syntia", "Memoria y sincronización."],
      ["Vertx", "Seguridad y auditoría."],
      ["Curvewind", "Estrategia y predicción."],
    ],
  },
  {
    title: "Creativas",
    text: "IAs para contenido, campañas, diseño y producción.",
    items: [
      ["Nova Ads", "Campañas y anuncios."],
      ["Candy Ads", "Diseño visual y creatividad."],
      ["PRO IA", "Video, audio y producción."],
      ["Revia", "Revisión creativa y calidad."],
    ],
  },
  {
    title: "Operativas",
    text: "IAs para operación, legal, finanzas y sistemas.",
    items: [
      ["Chido Gerente", "Operación de Chido Casino."],
      ["Chido Wins", "Predicción y simulación responsable."],
      ["Numia", "Finanzas y control."],
      ["Jurix", "Legal y contratos."],
      ["Hostia", "Servidores y conexiones."],
      ["Trackhok IA", "Rastreo autorizado."],
      ["NEXPA IA", "Seguridad familiar."],
    ],
  },
];

export default function AgisPage() {
  return (
    <PageShell
      eyebrow="Inteligencias"
      title="AGIs"
      subtitle="Mapa limpio de inteligencias. Sin palabras pesadas y con funciones fáciles de entender."
    >
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        {groups.map((group) => (
          <section key={group.title} className="hocker-panel-pro overflow-hidden">
            <div className="border-b border-white/5 p-5">
              <p className="text-[9px] font-black uppercase tracking-widest text-cyan-300">{group.title}</p>
              <h2 className="mt-2 text-xl font-black text-white">{group.text}</h2>
            </div>
            <div className="divide-y divide-white/5">
              {group.items.map(([name, text]) => (
                <article key={name} className="p-5">
                  <h3 className="text-base font-black text-white">{name}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-400">{text}</p>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </PageShell>
  );
}
