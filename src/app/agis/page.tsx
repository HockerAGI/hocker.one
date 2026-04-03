import React from 'react';
import { AGI } from '@/types/hocker';

// Simulación de fetch estricto (Conectar a Supabase en producción)
async function fetchAGIs(): Promise<AGI[]> {
  // Aquí reemplazamos cualquier llamado previo a "hocker-fabric" por "hocker-agi"
  const NETWORK_ID = "hocker-agi-core"; 
  
  // Retorno de datos simulado respetando la estructura estricta
  return [
    {
      id: "agi-numia-01",
      name: "Numia",
      description: "Gestión Financiera y Optimización de Retorno",
      version: "2.4.1",
      tags: ["finance", "core", NETWORK_ID],
      meta: { status: "optimal", load: "24%" },
      created_at: new Date().toISOString(),
    },
    {
      id: "agi-candy-02",
      name: "Candy Ads",
      description: "Generación de Pautas y Adquisición",
      version: "1.9.0",
      tags: ["marketing", "generative", NETWORK_ID],
      meta: { status: "active", load: "68%" },
      created_at: new Date().toISOString(),
    }
  ];
}

export default async function AGIsMonitorPage() {
  const agis = await fetchAGIs();

  return (
    <main className="min-h-screen relative p-6 lg:p-12 bg-hocker-dark overflow-hidden vfx-scanline">
      {/* Fondo Ambiental */}
      <div className="absolute top-0 left-0 w-full h-full bg-nova-gradient opacity-40 pointer-events-none" />
      
      <div className="relative z-10 max-w-7xl mx-auto">
        <header className="mb-12 animate-fade-in flex flex-col md:flex-row justify-between items-start md:items-end">
          <div>
            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-2">
              CONCIENCIA <span className="text-hocker-primary">DIGITAL</span>
            </h1>
            <p className="text-gray-400 text-sm md:text-base font-medium uppercase tracking-widest">
              Hocker ONE | Red Activa: <span className="text-hocker-primary font-bold">HOCKER-AGI</span>
            </p>
          </div>
          <div className="mt-4 md:mt-0 px-4 py-2 rounded-full border border-hocker-primary/30 bg-hocker-primary/10 text-hocker-primary text-xs font-bold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-hocker-primary animate-pulse" />
            SISTEMA ÓPTIMO
          </div>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agis.map((agi) => (
            <div 
              key={agi.id} 
              className="glass-effect rounded-2xl p-6 relative overflow-hidden group transition-all duration-300 hover:shadow-neon-glow hover:-translate-y-1"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-2xl font-bold text-white group-hover:text-hocker-primary transition-colors">
                  {agi.name}
                </h3>
                <span className="text-xs font-mono text-gray-500 bg-black/40 px-2 py-1 rounded">
                  v{agi.version}
                </span>
              </div>
              
              <p className="text-sm text-gray-400 mb-6 min-h-[40px]">
                {agi.description}
              </p>

              <div className="space-y-4">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-gray-500">CARGA COGNITIVA</span>
                  <span className="text-hocker-primary">{String(agi.meta?.load || "0%")}</span>
                </div>
                {/* Barra de progreso visual */}
                <div className="w-full bg-black/50 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-hocker-primary h-full shadow-[0_0_10px_#00FF88]" 
                    style={{ width: String(agi.meta?.load || "0%") }}
                  />
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                {agi.tags.map(tag => (
                  <span key={tag} className="text-[10px] uppercase tracking-wider bg-white/5 border border-white/10 px-2 py-1 rounded text-gray-300">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
