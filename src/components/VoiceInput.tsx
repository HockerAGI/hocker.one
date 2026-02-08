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
  const supported = !!SpeechRecognition;
  const isDisabled = !!disabled || !supported;

  async function start() {
    if (isDisabled) return;

    const rec = new SpeechRecognition();
    rec.lang = "es-MX";
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    rec.onstart = () => setListening(true);
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);

    rec.onresult = (event: any) => {
      const text = event?.results?.[0]?.[0]?.transcript ?? "";
      if (text) onText(text);
    };

    rec.start();
  }

  return (
    <button
      onClick={start}
      disabled={isDisabled}
      style={{
        padding: "10px 12px",
        cursor: isDisabled ? "not-allowed" : "pointer",
        borderRadius: 12,
        border: "1px solid #1f2937",
        background: listening ? "rgba(59,130,246,0.12)" : "#0b1220",
        color: "#fff",
        fontWeight: 800,
        minWidth: 120,
        opacity: isDisabled ? 0.6 : 1,
      }}
      title={!supported ? "Voz no soportada en este navegador" : listening ? "Escuchando…" : "Hablar"}
    >
      {supported ? (listening ? "🎙️ Escuchando…" : "🎙️ Voz") : "🎙️ No disponible"}
    </button>
  );
}