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
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages([
      {
        id: '0',
        role: 'nova',
        content: 'NOVA en línea. Lista.',
        timestamp: new Date().toISOString(),
      },
    ]);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function send(text: string) {
    if (!text.trim()) return;

    const parsed = parseVoice(text);

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };

    setMessages((p) => [...p, userMsg]);
    setTyping(true);

    try {
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

        speak('Orden ejecutada');
      } else {
        const res = await fetch('/api/nova/chat', {
          method: 'POST',
          body: JSON.stringify({
            projectId,
            message: parsed.message,
          }),
        });

        const data = await res.json();

        const reply = data.reply || 'Ok';

        speak(reply);

        setMessages((p) => [
          ...p,
          {
            id: Date.now().toString(),
            role: 'nova',
            content: reply,
            timestamp: new Date().toISOString(),
          },
        ]);
      }
    } catch {
      speak('Error');
    } finally {
      setTyping(false);
    }
  }

  function speak(text: string) {
    if (typeof window === 'undefined') return;

    const synth = window.speechSynthesis;
    const utter = new SpeechSynthesisUtterance(text);

    utter.lang = 'es-MX';
    utter.rate = 1;
    utter.pitch = 1.1;

    synth.speak(utter);
  }

  function handleKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      send(input);
      setInput('');
    }
  }

  return (
    <div className="hocker-surface-strong flex flex-col h-[600px] p-4">
      <div className="flex-1 overflow-y-auto space-y-4">
        {messages.map((m) => (
          <div key={m.id} className="text-sm">
            <b>{m.role}:</b> {m.content}
          </div>
        ))}
        {typing && <p className="text-xs text-slate-500">NOVA escribiendo...</p>}
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2 mt-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2"
        />

        <VoiceInput onResult={send} />

        <button
          onClick={() => {
            send(input);
            setInput('');
          }}
          className="hocker-button-brand"
        >
          OK
        </button>
      </div>
    </div>
  );
}