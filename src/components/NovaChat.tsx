'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import VoiceInput from '@/components/VoiceInput';
import { parseVoice } from '@/lib/voiceParser';

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
      content: 'Aquí NOVA. Sistema operativo activo. Puedes emitir voz o texto.',
      timestamp: new Date().toISOString()
    }
  ]);

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // 🔥 CORE: MANEJO TOTAL
  async function processInput(text: string) {
    if (!text.trim()) return;

    const parsed = parseVoice(text);

    setIsTyping(true);

    try {
      // 🔥 COMANDO
      if (parsed.type === 'create_command') {
        await fetch('/api/commands', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            project_id: projectId,
            command: parsed.command,
            payload: parsed.payload,
          }),
        });

        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            role: 'system',
            content: `COMANDO EJECUTADO: ${parsed.command}`,
            timestamp: new Date().toISOString()
          }
        ]);

        return;
      }

      // 🔥 CHAT
      const res = await fetch('/api/nova/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, message: parsed.message }),
      });

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'nova',
          content: data.reply || 'Sin respuesta.',
          timestamp: new Date().toISOString()
        }
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'system',
          content: 'ERROR EN EJECUCIÓN',
          timestamp: new Date().toISOString()
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  }

  const handleSend = async () => {
    if (!input.trim()) return;

    const text = input;

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        role: 'user',
        content: text,
        timestamp: new Date().toISOString()
      }
    ]);

    setInput('');
    await processInput(text);
  };

  const handleVoice = async (text: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        role: 'user',
        content: `[VOZ] ${text}`,
        timestamp: new Date().toISOString()
      }
    ]);

    await processInput(text);
  };

  return (
    <div className="flex flex-col h-[600px] bg-black border rounded-xl">

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id}>
            <b>{msg.role}:</b> {msg.content}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="p-3 flex gap-2">
        <input
          className="flex-1 bg-zinc-900 text-white p-2"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter') handleSend();
          }}
        />

        <VoiceInput onResult={handleVoice} />

        <button onClick={handleSend}>Enviar</button>
      </div>
    </div>
  );
}