"use client";

import React, { useMemo, useState } from "react";

type Props = { onText: (t: string) => void };

export default function VoiceInput({ onText }: Props) {
  const SpeechRecognition = useMemo(() => {
    return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  }, []);

  const [listening, setListening] = useState(false);
  const supported = !!SpeechRecognition;

  async function start() {
    if (!supported) return;

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
      disabled={!supported}
      style={{
        padding: "12px 14px",
        cursor: supported ? "pointer" : "not-allowed",
        borderRadius: 12,
        border: "1px solid #d6e3ff",
        background: supported ? (listening ? "#eaf1ff" : "#fff") : "#f2f3f7"
      }}
      title={supported ? "Hablar" : "Voz no soportada en este navegador"}
    >
      {supported ? (listening ? "🎙️ Escuchando..." : "🎙️ Voz") : "🎙️ No disponible"}
    </button>
  );
}