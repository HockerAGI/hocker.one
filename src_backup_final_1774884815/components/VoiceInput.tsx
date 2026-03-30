"use client";

import React, { useMemo, useState } from "react";

type Props = {
  onText: (t: string) => void;
  disabled?: boolean;
};

type SpeechRecognitionResultLike = {
  transcript?: string;
};

type SpeechRecognitionResultsLike = ArrayLike<ArrayLike<SpeechRecognitionResultLike>>;

type SpeechRecognitionResultEventLike = Event & {
  results?: SpeechRecognitionResultsLike;
};

type SpeechRecognitionInstance = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  onresult: ((e: SpeechRecognitionResultEventLike) => void) | null;
  start: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

function getSpeechRecognitionConstructor(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;

  const w = window as Window & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };

  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export default function VoiceInput({ onText, disabled }: Props) {
  const [listening, setListening] = useState(false);

  const SpeechRecognition = useMemo(() => getSpeechRecognitionConstructor(), []);

  async function start() {
    if (disabled || !SpeechRecognition) return;

    const rec = new SpeechRecognition();
    rec.lang = "es-MX";
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    rec.onstart = () => setListening(true);
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);

    rec.onresult = (e) => {
      const t = e.results?.[0]?.[0]?.transcript;
      if (typeof t === "string" && t.trim()) onText(t.trim());
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
      disabled={disabled || listening}
      className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl transition-all outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
        listening
          ? "bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]"
          : "border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-100 hover:text-blue-600"
      }`}
      title={listening ? "Escuchando instrucción..." : "Dictado por voz"}
    >
      {listening && (
        <span className="absolute inset-0 rounded-2xl animate-ping border border-red-400 opacity-75"></span>
      )}
      <svg className={`h-4 w-4 ${listening ? "animate-pulse" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
      </svg>
    </button>
  );
}
