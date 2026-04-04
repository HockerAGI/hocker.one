'use client';

import { useState } from 'react';
import { useWorkspace } from '@/components/WorkspaceContext';

export default function CommandBox() {
  const { projectId, nodeId, refresh } = useWorkspace();

  const [command, setCommand] = useState('');
  const [payload, setPayload] = useState('{}');
  const [loading, setLoading] = useState(false);

  async function handleSend() {
    if (!command.trim()) return;

    setLoading(true);

    try {
      const res = await fetch('/api/commands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: projectId,
          node_id: nodeId,
          command,
          payload: JSON.parse(payload || '{}'),
        }),
      });

      if (!res.ok) throw new Error('Error enviando comando');

      setCommand('');
      setPayload('{}');

      // 🔥 Neural sync
      refresh();

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="hocker-surface-soft p-5 space-y-4 hocker-fade-up">
      <div>
        <p className="hocker-title-line">Emitir acción</p>
        <p className="hocker-kicker">Control directo del sistema</p>
      </div>

      <input
        value={command}
        onChange={(e) => setCommand(e.target.value)}
        placeholder="Ej: supply.create_order"
        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-sky-500 outline-none"
      />

      <textarea
        value={payload}
        onChange={(e) => setPayload(e.target.value)}
        rows={4}
        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs font-mono focus:border-sky-500 outline-none"
      />

      <button
        onClick={handleSend}
        disabled={loading}
        className="hocker-button-brand w-full"
      >
        {loading ? 'Ejecutando...' : 'Ejecutar'}
      </button>
    </div>
  );
}