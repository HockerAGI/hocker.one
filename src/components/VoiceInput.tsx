"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    webkitSpeechRecognition?: any;
    SpeechRecognition?: any;
  }
}

export default function VoiceInput({ onText, disabled }: { onText: (t: string) => void; disabled?: boolean }) {
  const [listening, setListening] = useState(false);
  const recRef = useRef<any>(null);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;

    const r = new SR();
    r.lang = "es-MX";
    r.interimResults = false;
    r.maxAlternatives = 1;

    r.onresult = (e: any) => {
      const t = e.results?.[0]?.[0]?.transcript ?? "";
      if (t) onText(t);
    };
    r.onend = () => setListening(false);

    recRef.current = r;
  }, [onText]);

  function toggle() {
    if (!recRef.current || disabled) return;
    if (listening) {
      recRef.current.stop();
      setListening(false);
    } else {
      setListening(true);
      recRef.current.start();
    }
  }

  const supported = !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  return (
    <button
      className="rounded-xl border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-50"
      onClick={toggle}
      disabled={!supported || disabled}
      title={!supported ? "Tu navegador no soporta voz" : "Voz"}
    >
      {listening ? "🎙️" : "🎤"}
    </button>
  );
}