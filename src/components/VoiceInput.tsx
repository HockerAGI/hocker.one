"use client";

import { useEffect, useRef, useState } from "react";

type SpeechRecognitionType = typeof window extends undefined
  ? never
  : typeof window & {
      SpeechRecognition?: new () => SpeechRecognition;
      webkitSpeechRecognition?: new () => SpeechRecognition;
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

    const w = window as SpeechRecognitionType;

    const SpeechRecognitionImpl =
      w.SpeechRecognition || w.webkitSpeechRecognition;

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

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const result = event.results[0];
      if (!result) return;

      const transcript = result[0]?.transcript;
      if (typeof transcript === "string" && transcript.trim().length > 0) {
        onResult(transcript.trim());
      }
    };

    recognition.onerror = () => {
      setActive(false);
    };

    recognitionRef.current = recognition;
    setSupported(true);
  }, [onResult]);

  function start() {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.start();
    } catch {
      // evita crash si ya está activo
    }
  }

  function stop() {
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
    >
      {active ? "Escuchando..." : "Voz"}
    </button>
  );
}