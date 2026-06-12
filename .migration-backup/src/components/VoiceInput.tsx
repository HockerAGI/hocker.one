"use client";

import { Mic, MicOff } from "lucide-react";
import { useRef, useState } from "react";

type SpeechAlternative = {
  transcript: string;
  confidence: number;
};

type SpeechResult = {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechAlternative;
  [index: number]: SpeechAlternative;
};

type SpeechResultList = {
  readonly length: number;
  item(index: number): SpeechResult;
  [index: number]: SpeechResult;
};

type SpeechRecognitionEventLike = Event & {
  readonly resultIndex: number;
  readonly results: SpeechResultList;
};

type SpeechRecognitionErrorEventLike = Event & {
  readonly error: string;
  readonly message?: string;
};

type SpeechRecognitionLike = EventTarget & {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives?: number;

  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;

  start(): void;
  stop(): void;
  abort(): void;
};

type SpeechRecognitionConstructorLike = new () => SpeechRecognitionLike;

type SpeechWindow = Window &
  typeof globalThis & {
    SpeechRecognition?: SpeechRecognitionConstructorLike;
    webkitSpeechRecognition?: SpeechRecognitionConstructorLike;
  };

type VoiceInputProps = {
  onTranscript: (text: string) => void;
  disabled?: boolean;
};

export default function VoiceInput({ onTranscript, disabled = false }: VoiceInputProps) {
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const [supported, setSupported] = useState(true);
  const [listening, setListening] = useState(false);

  function getRecognition(): SpeechRecognitionLike | null {
    if (typeof window === "undefined") return null;

    const speechWindow = window as SpeechWindow;
    const SpeechRecognition =
      speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSupported(false);
      return null;
    }

    const recognition = new SpeechRecognition();

    recognition.lang = "es-MX";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setListening(true);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognition.onerror = () => {
      setListening(false);
    };

    recognition.onresult = (event: SpeechRecognitionEventLike) => {
      const result = event.results[event.resultIndex];
      const alternative = result?.[0];

      if (alternative?.transcript) {
        onTranscript(alternative.transcript.trim());
      }
    };

    return recognition;
  }

  function toggleListening() {
    if (disabled) return;

    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const recognition = getRecognition();

    if (!recognition) return;

    recognitionRef.current = recognition;
    recognition.start();
  }

  if (!supported) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={toggleListening}
      disabled={disabled}
      aria-label={listening ? "Detener voz" : "Dictar mensaje"}
      className={`nova-voice-button ${listening ? "is-listening" : ""}`}
    >
      {listening ? <MicOff size={18} /> : <Mic size={18} />}
    </button>
  );
}
