"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type SpeechAlternativeLike = {
  transcript: string;
  confidence?: number;
};

type SpeechResultLike = {
  0?: SpeechAlternativeLike;
  length: number;
  isFinal?: boolean;
};

type SpeechResultsLike = {
  0?: SpeechResultLike;
  length: number;
};

type SpeechRecognitionEventLike = {
  results: SpeechResultsLike;
};

type SpeechRecognitionInstanceLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: unknown) => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  start(): void;
  stop(): void;
};

type SpeechRecognitionCtorLike = new () => SpeechRecognitionInstanceLike;

type BrowserWindowWithSpeech = Window & {
  SpeechRecognition?: SpeechRecognitionCtorLike;
  webkitSpeechRecognition?: SpeechRecognitionCtorLike;
};

type VoiceInputProps = {
  onResult: (text: string) => void;
};

export default function VoiceInput({ onResult }: VoiceInputProps) {
  const recognitionRef = useRef<SpeechRecognitionInstanceLike | null>(null);
  const [active, setActive] = useState(false);
  const [supported, setSupported] = useState(false);

  const buttonLabel = useMemo(() => (active ? "Escuchando..." : "Voz"), [active]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const w = window as BrowserWindowWithSpeech;
    const Impl = w.SpeechRecognition ?? w.webkitSpeechRecognition;

    if (!Impl) {
      setSupported(false);
      return;
    }

    const recognition = new Impl();
    recognition.lang = "es-MX";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setActive(true);
    recognition.onend = () => setActive(false);
    recognition.onerror = () => setActive(false);
    recognition.onresult = (event: SpeechRecognitionEventLike) => {
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
      // evita crash si el navegador ya está grabando
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
      {buttonLabel}
    </button>
  );
}