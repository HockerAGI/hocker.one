"use client";

import { useEffect, useState } from "react";

type Props = {
  onText: (t: string) => void;
  disabled?: boolean;
};

type SpeechResultItem = { transcript: string };
type SpeechResultGroup = Array<SpeechResultItem>;
type SpeechRecognitionResultEvent = { results: Array<SpeechResultGroup> };

type SpeechRecognitionInstance = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  onresult: ((event: SpeechRecognitionResultEvent) => void) | null;
};

type SpeechRecognitionCtor = new () => SpeechRecognitionInstance;

interface WindowWithSpeech extends Window {
  SpeechRecognition?: SpeechRecognitionCtor;
  webkitSpeechRecognition?: SpeechRecognitionCtor;
}

export default function VoiceInput({ onText, disabled }: Props) {
  const [SpeechRec, setSpeechRec] = useState<SpeechRecognitionCtor | null>(null);
  const [listening, setListening] = useState(false);

  useEffect(() => {
    const win = window as WindowWithSpeech;
    const api = win.SpeechRecognition || win.webkitSpeechRecognition || null;
    setSpeechRec(() => api);
  }, []);

  function start() {
    if (disabled || !SpeechRec) return;

    const rec = new SpeechRec();
    rec.lang = "es-MX";
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    rec.onstart = () => setListening(true);
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);

    rec.onresult = (e) => {
      const transcript = e.results?.[0]?.[0]?.transcript;
      if (typeof transcript === "string" && transcript.trim()) {
        onText(transcript.trim());
      }
    };

    rec.start();
  }

  if (!SpeechRec) {
    return (
      <button
        type="button"
        className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/5 bg-white/5 text-slate-600 cursor-not-allowed transition-all"
        disabled
        title="Hardware no compatible con enlace de voz"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          <line x1="4" y1="4" x2="20" y2="20" strokeWidth="2.5" />
        </svg>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={start}
      disabled={disabled || listening}
      className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-all duration-300 outline-none ${
        listening
          ? "bg-rose-500 text-white shadow-[0_0_20px_rgba(244,63,94,0.6)] animate-pulse"
          : "bg-sky-500/10 border border-sky-400/20 text-sky-400 hover:bg-sky-500 hover:text-white hover:shadow-[0_0_15px_rgba(14,165,233,0.4)]"
      } disabled:opacity-50`}
      title="Iniciar enlace de voz con NOVA"
    >
      {listening && <span className="absolute inset-0 rounded-2xl bg-rose-400 opacity-50 animate-ping" />}
      <svg className="relative z-10 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
      </svg>
    </button>
  );
}