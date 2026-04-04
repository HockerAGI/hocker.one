'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { useWorkspace } from '@/components/WorkspaceContext';

interface Message {
  id: string;
  role: 'user' | 'nova' | 'system';
  content: string;
  timestamp: string;
}

export default function NovaChat() {
  const { projectId } = useWorkspace();

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init-0',
      role: 'system',
      content: 'ENLACE ESTABLECIDO.',
      timestamp: new Date().toISOString()
    },
    {
      id: 'init-1',
      role: 'nova',
      content: 'NOVA activa. Lista.',
      timestamp: new Date().toISOString()
    }
  ]);

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;

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

      if (!res.ok) throw new Error('Error de conexión');

      const data: { reply: string } = await res.json();

      const novaMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'nova',
        content: data.reply || '...',
        timestamp: new Date().toISOString()
      };

      setMessages((prev) => [...prev, novaMsg]);
    } catch (error: unknown) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'system',
          content: 'Error en enlace.',
          timestamp: new Date().toISOString()
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id}>
            <span className="text-xs text-gray-500">
              {msg.role}
            </span>
            <div className="text-sm">{msg.content}</div>
          </div>
        ))}

        {isTyping && <div className="text-xs text-sky-400">NOVA pensando...</div>}

        <div ref={bottomRef} />
      </div>

      <div className="p-3 border-t border-white/10 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-black/40 border border-white/10 px-3 py-2 rounded"
        />
        <button onClick={handleSend} className="hocker-button-brand">
          Enviar
        </button>
      </div>
    </div>
  );
}