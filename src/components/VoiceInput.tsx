"use client";

import { useEffect, useRef, useState } from "react";

type SpeechRecognitionCtor = new () => SpeechRecognition;

type BrowserWindowWithSpeech = Window & {
  SpeechRecognition?: SpeechRecognitionCtor;
  webkitSpeechRecognition?: SpeechRecognitionCtor;
};

type VoiceInputProps = {
  onResult: (text: string) => void;
};

export default function VoiceInput({ onResult }: VoiceInputProps) {
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [active, setActive] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const w = window as BrowserWindowWithSpeech;
    const SpeechRecognitionImpl = w.SpeechRecognition ?? w.webkitSpeechRecognition;

    if (!SpeechRecognitionImpl) {
      setSupported(false);
      return;
    }

    const recognition = new SpeechRecognitionImpl();
    recognition.lang = "es-MX";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setActive(true);
    recognition.onend = () => setActive(false);
    recognition.onerror = () => setActive(false);

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const result = event.results[0];
      const transcript = result?.[0]?.transcript;

      if (typeof transcript === "string" && transcript.trim().length > 0) {
        onResult(transcript.trim());
      }
    };

    recognitionRef.current = recognition;
    setSupported(true);

    return () => {
      recognitionRef.current?.stop();
      recognitionRef.current = null;
    };
  }, [onResult]);

  function start(): void {
    if (!recognitionRef.current) return;

    try {
      recognitionRef.current.start();
    } catch {
      // evita crash si ya está activo
    }
  }

  function stop(): void {
    recognitionRef.current?.stop();
  }

  if (!supported) return null;

  return (
    <button
      type="button"
      onClick={active ? stop : start}
      className={`flex items-center justify-center rounded-2xl px-4 py-3 text-xs font-black uppercase tracking-widest transition-all active:scale-95 ${
        active
          ? "bg-rose-500 text-white shadow-[0_0_20px_rgba(244,63,94,0.5)]"
          : "bg-sky-500 text-white hover:bg-sky-400"
      }`}
      aria-pressed={active}
    >
      {active ? "Escuchando..." : "Voz"}
    </button>
  );
}