'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { AGILevel } from '@/types/hocker';

interface Message {
  id: string;
  role: 'user' | 'nova' | 'system';
  content: string;
  timestamp: string;
}

export default function NovaChat({ projectId }: { projectId: string }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init-0',
      role: 'system',
      content: 'ENLACE ESTABLECIDO. CANAL DE COMUNICACIÓN ENCRIPTADO.',
      timestamp: new Date().toISOString()
    },
    {
      id: 'init-1',
      role: 'nova',
      content: 'Aquí NOVA. Orquestador central en línea. Esperando directivas tácticas, Director.',
      timestamp: new Date().toISOString()
    }
  ]);
  const [input, setInput] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || !projectId) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const res = await fetch('/api/nova/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, message: userMsg.content }),
      });

      if (!res.ok) throw new Error('Fallo en la matriz de transmisión.');

      const data: { reply: string } = await res.json();
      
      const novaMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'nova',
        content: data.reply || 'Silencio en la red.',
        timestamp: new Date().toISOString()
      };

      setMessages((prev) => [...prev, novaMsg]);
    } catch (error: unknown) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'system',
        content: `ERROR CRÍTICO: ${error instanceof Error ? error.message : 'Anomalía detectada en el enlace.'}`,
        timestamp: new Date().toISOString()
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[600px] bg-[#050505] border border-white/10 rounded-xl overflow-hidden relative shadow-[0_0_20px_rgba(0,240,255,0.05)]">
      {/* Header Visual */}
      <div className="bg-hocker-dark border-b border-white/5 p-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="relative flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-hocker-accent opacity-50"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-hocker-accent shadow-[0_0_10px_#00f0ff]"></span>
          </div>
          <div>
            <h2 className="text-sm font-black text-white uppercase tracking-widest">Enlace Directo: NOVA</h2>
            <p className="text-[10px] font-mono text-hocker-accent">Inteligencia Central Suprema</p>
          </div>
        </div>
      </div>

      {/* Área de Mensajes */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar relative z-10 bg-[url('/1381.png')] bg-no-repeat bg-center bg-[length:300px_300px] bg-blend-overlay" style={{ backgroundColor: 'rgba(5, 5, 5, 0.95)' }}>
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <span className="text-[9px] font-mono text-gray-600 mb-1 tracking-widest uppercase">
              {msg.role} // {new Date(msg.timestamp).toLocaleTimeString()}
            </span>
            <div className={`max-w-[80%] p-4 rounded-xl text-sm font-mono leading-relaxed border ${
              msg.role === 'user' 
                ? 'bg-hocker-accent/10 border-hocker-accent/30 text-white rounded-br-none' 
                : msg.role === 'system'
                  ? 'bg-hocker-alert/10 border-hocker-alert/30 text-hocker-alert rounded-bl-none animate-pulse'
                  : 'bg-white/5 border-white/10 text-gray-300 rounded-bl-none shadow-[0_0_15px_rgba(0,0,0,0.5)]'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex flex-col items-start">
            <span className="text-[9px] font-mono text-hocker-accent mb-1 tracking-widest uppercase animate-pulse">
              NOVA // PROCESANDO...
            </span>
            <div className="p-4 rounded-xl rounded-bl-none bg-white/5 border border-white/10 flex gap-2 items-center h-12">
              <span className="w-2 h-2 bg-hocker-accent rounded-full animate-bounce"></span>
              <span className="w-2 h-2 bg-hocker-accent rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
              <span className="w-2 h-2 bg-hocker-accent rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-hocker-dark border-t border-white/5 z-10">
        <div className="flex gap-3">
          <input
            type="text"
            className="flex-1 bg-[#0a0a0c] border border-white/10 rounded-lg px-5 py-3 text-white font-mono text-sm focus:outline-none focus:border-hocker-accent focus:ring-1 focus:ring-hocker-accent transition-all placeholder:text-gray-700"
            placeholder="Escribe una directiva..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isTyping}
            spellCheck={false}
          />
          <button
            onClick={handleSend}
            disabled={isTyping || !input.trim()}
            className="px-6 py-3 bg-hocker-accent hover:bg-hocker-accent/80 text-black font-black uppercase font-mono text-sm rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed tracking-widest"
          >
            Emitir
          </button>
        </div>
      </div>
    </div>
  );
}
