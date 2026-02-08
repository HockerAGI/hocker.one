"use client";

import React, { useMemo, useState } from "react";

type Props = {
  onText: (t: string) => void;
  disabled?: boolean;
};

export default function VoiceInput({ onText, disabled }: Props) {
  const SpeechRecognition = useMemo(() => {
    return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  }, []);

  const [listening, setListening] = useState(false);

  async function start() {
    if (disabled) return;
    if (!SpeechRecognition) return;

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
        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-500"
        disabled
        title="SpeechRecognition no disponible en este navegador"
      >
        Voice (no disponible)
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={start}
      disabled={disabled}
      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 hover:bg-slate-50 disabled:opacity-50"
      title="Dicta por voz"
    >
      {listening ? "Escuchando…" : "Voice"}
    </button>
  );
}