import type { Metadata } from "next";
import PageShell from "@/components/PageShell";
import Hint from "@/components/Hint";

export const metadata: Metadata = {
  title: "Supply Chain | Hocker ONE",
};

const modules = [
  { id: "cat", label: "Catálogo Maestro", icon: "📦", status: "Nominal" },
  { id: "ord", label: "Órdenes Activas", icon: "📋", status: "Sincronizado" },
  { id: "inv", label: "Inventario Global", icon: "🌐", status: "Activo" },
  { id: "tra", label: "Trazabilidad", icon: "🔗", status: "Monitoreado" },
];

export default function SupplyPage() {
  return (
    <PageShell title="Logística Operativa" subtitle="Control de suministros y activos del ecosistema.">
      <div className="flex flex-col gap-8">
        <Hint title="Estructura HKR SUPPLY">
          Este módulo está diseñado para la administración multi-proyecto. Los activos de clientes finales se segregan mediante identificadores de nodo únicos.
        </Hint>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {modules.map((m) => (
            <div key={m.id} className="hocker-panel-pro p-6 border-white/5 hover:border-sky-500/30 transition-all group">
              <div className="text-3xl mb-4 group-hover:scale-110 transition-transform duration-500">{m.icon}</div>
              <h3 className="text-sm font-black text-white uppercase tracking-tight">{m.label}</h3>
              <div className="mt-6 flex items-center justify-between">
                <span className="text-[9px] font-black uppercase text-sky-400 bg-sky-500/10 px-2 py-1 rounded-lg border border-sky-500/20">{m.status}</span>
                <span className="text-[9px] font-bold text-slate-600 uppercase">Detalles →</span>
              </div>
            </div>
          ))}
        </div>

        <div className="hocker-glass-vfx p-8 bg-slate-950/40">
           <div className="flex items-center gap-4 text-sky-400 mb-6">
              <div className="h-1 w-8 bg-current rounded-full" />
              <span className="text-[10px] font-black uppercase tracking-[0.4em]">Próximas Integraciones</span>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {["Sincronización de pedidos automatizada", "Gestión de activos de clientes de terceros", "Optimización de rutas de suministro", "Auditoría de inventario por IA"].map(t => (
                <div key={t} className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/5 text-sm text-slate-400 font-medium">
                   <div className="h-1.5 w-1.5 rounded-full bg-sky-500/40" />
                   {t}
                </div>
              ))}
           </div>
        </div>
      </div>
    </PageShell>
  );
}
