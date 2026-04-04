"use client";

import { useEffect, useRef, useState } from "react";

type VoiceInputProps = {
  onResult: (text: string) => void;
};

type SpeechRecognitionInstance = {
  start: () => void;
  stop: () => void;
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onresult: ((event: any) => void) | null;
  onerror: (() => void) | null;
};

export default function VoiceInput({ onResult }: VoiceInputProps) {
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const [active, setActive] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognitionImpl =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionImpl) {
      setSupported(false);
      return;
    }

    const recognition: SpeechRecognitionInstance =
      new SpeechRecognitionImpl();

    recognition.lang = "es-MX";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setActive(true);
    recognition.onend = () => setActive(false);

    recognition.onresult = (event: any) => {
      const result = event?.results?.[0]?.[0]?.transcript;
      if (typeof result === "string" && result.trim()) {
        onResult(result.trim());
      }
    };

    recognition.onerror = () => setActive(false);

    recognitionRef.current = recognition;
    setSupported(true);
  }, [onResult]);

  function start() {
    try {
      recognitionRef.current?.start();
    } catch {}
  }

  function stop() {
    recognitionRef.current?.stop();
  }

  if (!supported) return null;

  return (
    <button
      onClick={active ? stop : start}
      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
        active
          ? "bg-red-500 text-white"
          : "bg-sky-500 text-black hover:bg-sky-400"
      }`}
    >
      {active ? "Escuchando..." : "Voz"}
    </button>
  );
}