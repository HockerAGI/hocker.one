"use client";
import React, { useEffect, useState } from "react";

export default function VoiceInput({ onText, disabled }: { onText: (t: string) => void; disabled?: boolean }) {
  const [SpeechRecognition, setSpeechRecognition] = useState<any>(null);
  const [listening, setListening] = useState(false);

  useEffect(() => {
    const api = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null;
    setSpeechRecognition(() => api);
  }, []);

  
  useEffect(() => {
    const api = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null;
    setSpeechRecognition(() => api);
  }, []);

  async function start() {
    if (disabled || !SpeechRecognition) return;

    const rec = new SpeechRecognition();
    rec.lang = "es-MX";
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    rec.onstart = () => setListening(true);
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);

    rec.onresult = (e: any) => {
      const t = e?.results?.[0]?.[0]?.transcript;
      if (t && typeof t === "string") onText(t);
    };

    rec.start();
  }

  if (!SpeechRecognition) {
    return (
      <button
        type="button"
        className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed"
        disabled
        title="Micrófono no soportado en este navegador"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          <line x1="4" y1="4" x2="20" y2="20" strokeWidth="2" />
        </svg>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={start}
      disabled={disabled || !SpeechRecognition}
      className={`relative flex h-11 w-11 items-center justify-center rounded-2xl transition-all duration-500 active:scale-90 ${
        listening 
          ? "bg-rose-600 shadow-[0_0_20px_rgba(225,29,72,0.5)]" 
          : "bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10 hover:text-white"
      } disabled:opacity-30`}
    >
      {listening && <div className="absolute inset-0 animate-ping rounded-2xl bg-rose-500/20" />}
      <svg className={`h-5 w-5 ${listening ? "text-white" : "currentColor"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
      </svg>
    </button>
  );
}
