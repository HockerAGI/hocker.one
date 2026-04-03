'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { HockerNode } from '@/types/hocker';

export default function NodesPanel({ projectId }: { projectId: string }) {
  const [nodes, setNodes] = useState<HockerNode[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!projectId) return;

    const fetchNodes = async () => {
      const { data, error } = await supabase
        .from('nodes')
        .select('*')
        .eq('project_id', projectId)
        .order('last_seen_at', { ascending: false });

      if (!error && data) {
        // Mapeo seguro y forzado de topología
        const typedNodes: HockerNode[] = data.map(node => ({
          id: node.id,
          projectId: node.project_id,
          name: node.name || 'Nodo Desconocido',
          type: (node.type === 'hocker-fabric' ? 'hocker-agi' : node.type) as HockerNode['type'],
          status: node.status as HockerNode['status'],
          lastSeenAt: node.last_seen_at || new Date().toISOString(),
          tags: node.tags || [],
          meta: node.meta as Record<string, unknown>
        }));
        setNodes(typedNodes);
      }
      setLoading(false);
    };

    fetchNodes();

    // Sincronización en Tiempo Real
    const channel = supabase
      .channel('public:nodes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'nodes', filter: `project_id=eq.${projectId}` }, () => {
        fetchNodes();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId]);

  if (loading) {
    return <div className="h-40 flex items-center justify-center text-hocker-accent font-mono text-sm animate-pulse">Escaneando topología...</div>;
  }

  return (
    <div className="bg-hocker-panel border border-white/5 rounded-xl p-6 backdrop-blur-sm">
      <h2 className="text-xl font-black uppercase tracking-tighter mb-6 flex items-center justify-between">
        Red Activa
        <span className="text-xs font-mono text-gray-500 font-normal">{nodes.length} Nodos Detectados</span>
      </h2>

      <div className="space-y-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
        {nodes.map((node) => (
          <div key={node.id} className="p-4 bg-[#0a0a0c] border border-white/5 rounded-lg hover:border-hocker-accent/30 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className={`relative flex h-3 w-3`}>
                {node.status === 'online' && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-hocker-success opacity-75"></span>}
                <span className={`relative inline-flex rounded-full h-3 w-3 ${node.status === 'online' ? 'bg-hocker-success' : 'bg-gray-600'}`}></span>
              </span>
              <div>
                <p className="font-bold text-sm text-white">{node.name}</p>
                <p className="text-xs font-mono text-gray-500">ID: {node.id} | Tipo: <span className="text-hocker-accent">{node.type}</span></p>
              </div>
            </div>
            
            <div className="text-right">
              <p className="text-xs text-gray-400 font-mono">Último pulso:</p>
              <p className="text-xs font-mono text-white">{new Date(node.lastSeenAt).toLocaleTimeString()}</p>
            </div>
          </div>
        ))}

        {nodes.length === 0 && (
          <div className="text-center py-8 text-gray-500 font-mono text-sm border border-dashed border-white/10 rounded-lg">
            No hay nodos en línea en este sector.
          </div>
        )}
      </div>
    </div>
  );
}
