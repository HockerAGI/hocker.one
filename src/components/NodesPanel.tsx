'use client';

import { useEffect, useState } from 'react';
import { NodeRow } from '@/lib/types';

export default function NodesPanel() {
  const [nodes, setNodes] = useState<NodeRow[]>([]);

  useEffect(() => {
    fetch('/api/nodes')
      .then((r) => r.json())
      .then((d) => setNodes(d.items || []))
      .catch(() => {});
  }, []);

  return (
    <div className="hocker-surface-soft p-5 space-y-4 hocker-fade-up">
      <div>
        <p className="hocker-title-line">Nodos</p>
        <p className="hocker-kicker">Estado de la red</p>
      </div>

      <div className="space-y-3">
        {nodes.map((n) => (
          <div
            key={n.id}
            className="hocker-card-pro flex items-center justify-between"
          >
            <div>
              <p className="text-sm font-bold">{n.name || 'Nodo'}</p>
              <p className="text-[10px] text-slate-500">{n.type}</p>
            </div>

            <span
              className={`hocker-chip ${
                n.status === 'online'
                  ? 'text-emerald-400'
                  : n.status === 'degraded'
                  ? 'text-yellow-400'
                  : 'text-red-400'
              }`}
            >
              {n.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}