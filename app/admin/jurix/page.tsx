"use client";

import { useEffect, useState } from "react";

export default function JurixPanel() {
  const [logs, setLogs] = useState([]);
  const [events, setEvents] = useState([]);

  async function load() {
    const logsRes = await fetch("/api/jurix/audit/logs").then(r => r.json());
    const eventsRes = await fetch("/api/jurix/compliance").then(r => r.json());

    setLogs(logsRes.logs || []);
    setEvents(eventsRes.events || []);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="p-6 space-y-6 text-white">

      <h1 className="text-3xl font-bold">Jurix — Auditoría & Cumplimiento</h1>

      {/* COMPLIANCE EVENTS */}
      <div>
        <h2 className="text-xl mb-2">Eventos de Cumplimiento</h2>
        <div className="space-y-2">
          {events.map((e: any) => (
            <div key={e.id} className="p-4 bg-black/40 border border-white/10 rounded-xl">
              <div className="font-semibold">{e.title}</div>
              <div className="text-sm text-gray-400">{e.category} · {e.severity}</div>
              <div className="text-xs mt-2">{e.description}</div>
            </div>
          ))}
        </div>
      </div>

      {/* AUDIT LOGS */}
      <div>
        <h2 className="text-xl mb-2">Audit Logs</h2>
        <div className="space-y-2">
          {logs.map((l: any) => (
            <div key={l.id} className="p-4 bg-black/40 border border-white/10 rounded-xl">
              <div>{l.action}</div>
              <div className="text-xs text-gray-400">{l.role} · {l.entity_type}</div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}