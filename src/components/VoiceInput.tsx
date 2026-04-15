"use client";

import React, { useState, useEffect, useRef } from "react";
import { Mic, MicOff } from "lucide-react";

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

export default function VoiceInput({ onTranscript, disabled }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [supported, setSupported] = useState(false);
  
  // Referencia utilizando los tipos globales declarados en global.d.ts
  const recognitionRef = useRef<ISpeechRecognition | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "es-MX";

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = (event: ISpeechRecognitionErrorEvent) => {
      console.error("[NOVA] Error de entrada de voz:", event.error);
      setIsListening(false);
    };

    recognition.onresult = (event: ISpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      if (transcript) {
        onTranscript(transcript);
      }
    };

    recognitionRef.current = recognition;
    setSupported(true);

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [onTranscript]);

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error("[NOVA] Anomalía al iniciar el micrófono:", err);
      }
    }
  };

  if (!supported) return null;

  return (
    <button
      type="button"
      onClick={toggleListening}
      disabled={disabled}
      className={`relative flex items-center justify-center p-2 rounded-full transition-all duration-300 ${
        isListening
          ? "bg-red-500/20 text-red-400 ring-2 ring-red-500/50"
          : "bg-slate-800/40 text-slate-400 hover:bg-slate-700/60 hover:text-sky-400"
      } disabled:opacity-30 disabled:cursor-not-allowed`}
      title={isListening ? "Detener micrófono" : "Dictar orden"}
    >
      {isListening ? (
        <>
          <span className="absolute inset-0 rounded-full bg-red-500/20 animate-ping" />
          <MicOff className="w-5 h-5 relative z-10" />
        </>
      ) : (
        <Mic className="w-5 h-5" />
      )}
    </button>
  );
}