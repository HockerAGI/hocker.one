'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface HealthMetrics {
  status: 'optimal' | 'degraded' | 'critical';
  latencyMs: number;
  lastSync: string;
}

export default function SystemStatus({ projectId }: { projectId: string }) {
  const [metrics, setMetrics] = useState<HealthMetrics>({
    status: 'optimal',
    latencyMs: 45,
    lastSync: new Date().toISOString()
  });

  useEffect(() => {
    // Simulación de latido de red; en producción esto escucha pings reales de los hocker-agi
    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        latencyMs: Math.floor(Math.random() * (120 - 30 + 1) + 30),
        lastSync: new Date().toISOString()
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: HealthMetrics['status']) => {
    switch (status) {
      case 'optimal': return 'text-hocker-success bg-hocker-success/10 border-hocker-success/30';
      case 'degraded': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30';
      case 'critical': return 'text-hocker-alert bg-hocker-alert/10 border-hocker-alert/30 animate-pulse';
    }
  };

  const getLatencyColor = (ms: number) => {
    if (ms < 60) return 'bg-hocker-success';
    if (ms < 100) return 'bg-yellow-400';
    return 'bg-hocker-alert';
  };

  return (
    <div className="bg-hocker-panel border border-white/5 rounded-xl p-6 backdrop-blur-sm relative overflow-hidden group">
      <div className="absolute -right-10 -top-10 w-32 h-32 bg-hocker-accent/5 rounded-full blur-3xl group-hover:bg-hocker-accent/10 transition-all"></div>
      
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xs font-mono font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
          Telemetría del Clúster
        </h3>
        <span className={`px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest ${getStatusColor(metrics.status)}`}>
          {metrics.status}
        </span>
      </div>

      <div className="space-y-6">
        <div>
          <div className="flex justify-between text-xs font-mono mb-2">
            <span className="text-gray-400">Latencia de Red (hocker-agi)</span>
            <span className="text-white font-bold">{metrics.latencyMs} ms</span>
          </div>
          <div className="w-full bg-[#0a0a0c] h-1.5 rounded-full overflow-hidden border border-white/5">
            <div 
              className={`h-full transition-all duration-500 ease-out ${getLatencyColor(metrics.latencyMs)}`} 
              style={{ width: `${Math.min((metrics.latencyMs / 200) * 100, 100)}%` }}
            ></div>
          </div>
        </div>

        <div className="pt-4 border-t border-white/5 flex justify-between items-center">
          <span className="text-xs font-mono text-gray-500">Última Sincronización</span>
          <span className="text-xs font-mono text-hocker-accent">
            {new Date(metrics.lastSync).toLocaleTimeString()}
          </span>
        </div>
      </div>
    </div>
  );
}
