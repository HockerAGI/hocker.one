'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';

interface HockerEvent {
  id: string;
  level: 'info' | 'warning' | 'error' | 'critical';
  type: string;
  message: string;
  node_id: string | null;
  created_at: string;
}

export default function EventsFeed({ projectId }: { projectId: string }) {
  const [events, setEvents] = useState<HockerEvent[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!projectId) return;

    const fetchEvents = async () => {
      const { data, error } = await supabase
        .from('events')
        .select('id, level, type, message, node_id, created_at')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (!error && data) {
        setEvents(data.reverse() as HockerEvent[]);
      }
    };

    fetchEvents();

    const channel = supabase
      .channel('public:events')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'events', filter: `project_id=eq.${projectId}` }, (payload) => {
        setEvents((prev) => [...prev, payload.new as HockerEvent].slice(-50)); // Mantiene los últimos 50
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [events]);

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'info': return 'text-hocker-success';
      case 'warning': return 'text-yellow-400';
      case 'error': return 'text-hocker-alert';
      case 'critical': return 'text-white bg-hocker-alert px-1 rounded';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="bg-[#050505] border border-white/10 rounded-xl flex flex-col h-[400px] overflow-hidden relative shadow-[0_0_20px_rgba(0,0,0,0.5)]">
      <div className="bg-hocker-dark border-b border-white/5 px-4 py-3 flex justify-between items-center z-10">
        <h3 className="text-xs font-mono font-bold text-gray-400 uppercase tracking-widest">
          Terminal de Eventos <span className="text-hocker-accent">/Live</span>
        </h3>
        <div className="flex gap-1">
          <div className="w-2 h-2 rounded-full bg-hocker-alert"></div>
          <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
          <div className="w-2 h-2 rounded-full bg-hocker-success"></div>
        </div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto font-mono text-[11px] md:text-xs space-y-2 custom-scrollbar">
        {events.map((ev) => (
          <div key={ev.id} className="flex flex-col sm:flex-row sm:gap-4 border-b border-white/5 pb-2 last:border-0 hover:bg-white/5 transition-colors p-1 rounded">
            <span className="text-gray-500 whitespace-nowrap">
              [{new Date(ev.created_at).toLocaleTimeString()}]
            </span>
            <div className="flex-1">
              <span className={`font-bold uppercase mr-2 ${getLevelColor(ev.level)}`}>
                {ev.level}
              </span>
              <span className="text-hocker-accent mr-2">[{ev.type}]</span>
              <span className="text-gray-300">{ev.message}</span>
              {ev.node_id && <span className="text-gray-600 ml-2 text-[10px]">({ev.node_id})</span>}
            </div>
          </div>
        ))}
        {events.length === 0 && (
          <p className="text-gray-600 italic animate-pulse">Esperando telemetría del ecosistema...</p>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
