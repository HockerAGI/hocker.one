"use client";

import { useEffect, useRef, useState } from "react";

type VoiceInputProps = {
  onResult: (text: string) => void;
};

type SpeechRecognitionAlternativeLike = {
  transcript: string;
  confidence?: number;
};

type SpeechRecognitionResultLike = ArrayLike<SpeechRecognitionAlternativeLike> & {
  0: SpeechRecognitionAlternativeLike;
  isFinal: boolean;
  length: number;
};

type SpeechRecognitionEventLike = Event & {
  results: ArrayLike<SpeechRecognitionResultLike>;
};

type SpeechRecognitionInstance = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: Event) => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

type SpeechRecognitionWindow = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

export default function VoiceInput({ onResult }: VoiceInputProps) {
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const onResultRef = useRef(onResult);
  const [active, setActive] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const browserWindow = window as SpeechRecognitionWindow;
    const Recognition =
      browserWindow.SpeechRecognition ?? browserWindow.webkitSpeechRecognition;

    if (!Recognition) {
      setSupported(false);
      return;
    }

    const recognition = new Recognition();
    recognition.lang = "es-MX";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setActive(true);
    recognition.onend = () => setActive(false);
    recognition.onerror = () => setActive(false);
    recognition.onresult = (event) => {
      const firstResult = event.results[0];
      const transcript = firstResult?.[0]?.transcript?.trim() ?? "";

      if (transcript) {
        onResultRef.current(transcript);
      }
    };

    recognitionRef.current = recognition;
    setSupported(true);

    return () => {
      recognitionRef.current?.stop();
      recognitionRef.current = null;
    };
  }, []);

  function start(): void {
    if (!recognitionRef.current) return;

    try {
      recognitionRef.current.start();
    } catch {
      // noop
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
      className={`inline-flex items-center justify-center rounded-2xl px-4 py-3 text-xs font-black uppercase tracking-widest transition-all active:scale-95 ${
        active
          ? "border border-rose-400/20 bg-rose-500/10 text-rose-300 shadow-[0_0_20px_rgba(244,63,94,0.5)]"
          : "border border-sky-400/20 bg-sky-500/10 text-sky-300 shadow-[0_0_20px_rgba(14,165,233,0.15)] hover:bg-sky-500/20"
      }`}
      aria-pressed={active}
    >
      {active ? "Escuchando..." : "Voz"}
    </button>
  );
}