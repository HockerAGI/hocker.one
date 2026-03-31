import type { Metadata } from "next";
import PageShell from "@/components/PageShell";
import Hint from "@/components/Hint";

export const metadata: Metadata = {
  title: "Supply",
};

const supplyItems = [
  { title: "Catálogo Maestro", status: "READY", icon: "📦" },
  { title: "Órdenes Activas", status: "SYNC", icon: "📋" },
  { title: "Inventario Global", status: "NOMINAL", icon: "🌐" },
  { title: "Trazabilidad", status: "ACTIVE", icon: "🔗" },
];

export default function SupplyPage() {
  return (
    <PageShell title="Supply Chain" subtitle="Supervisión de la cadena de suministro y cumplimiento operativo.">
      <div className="flex flex-col gap-8">
        <Hint title="Logística HKR">
          Este módulo conecta directamente con los activos de HKR SUPPLY. Asegúrate de que las órdenes tengan el ID de proyecto correcto.
        </Hint>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {supplyItems.map((item) => (
            <div key={item.title} className="hocker-panel-pro p-6 border-white/5 hover:border-sky-500/30 group">
              <div className="text-3xl mb-4 group-hover:scale-110 transition-transform">{item.icon}</div>
              <div className="text-sm font-black text-white uppercase tracking-tight">{item.title}</div>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-[10px] font-black text-sky-400 bg-sky-500/10 px-2 py-1 rounded-lg border border-sky-500/20">{item.status}</span>
                <span className="text-[10px] text-slate-500 font-bold uppercase">Ver Detalle</span>
              </div>
            </div>
          ))}
        </div>

        <section className="hocker-glass-vfx p-8 bg-gradient-to-r from-sky-500/5 to-transparent">
           <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 mb-6">Próximos Despliegues</h3>
           <div className="space-y-4">
              {["Carga de activos reales", "Sincronización multi-proyecto", "Enlace logístico automático"].map(text => (
                <div key={text} className="flex items-center gap-3 text-sm text-slate-300 font-medium">
                   <div className="h-1.5 w-1.5 rounded-full bg-sky-500" />
                   {text}
                </div>
              ))}
           </div>
        </section>
      </div>
    </PageShell>
  );
}
