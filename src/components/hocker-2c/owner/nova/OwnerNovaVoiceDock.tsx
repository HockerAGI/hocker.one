"use client";

import { useMemo, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import VoiceInput from "@/components/VoiceInput";
import { speak, stopSpeaking } from "@/lib/tts";
import { parseVoice } from "@/lib/voiceParser";

type OwnerNovaVoiceDockProps = {
  onPrompt: (text: string) => void;
  responseText?: string;
  disabled?: boolean;
};

function cleanText(value: string): string {
  return String(value ?? "").trim().replace(/\s+/g, " ");
}

export function OwnerNovaVoiceDock({
  onPrompt,
  responseText = "",
  disabled = false,
}: OwnerNovaVoiceDockProps) {
  const [lastTranscript, setLastTranscript] = useState("");
  const [lastMode, setLastMode] = useState<"chat" | "action">("chat");

  const canSpeak = useMemo(() => cleanText(responseText).length > 0, [responseText]);

  function handleTranscript(text: string) {
    const transcript = cleanText(text);
    if (!transcript) return;

    const parsed = parseVoice(transcript);

    if (parsed.type === "create_command") {
      setLastMode("action");
      setLastTranscript(transcript);
      onPrompt(
        [
          "Prepara esta solicitud como acción segura, pero no ejecutes nada sin aprobación owner:",
          transcript,
          "",
          `Tipo detectado: ${parsed.command}`,
        ].join("\n"),
      );
      return;
    }

    setLastMode("chat");
    setLastTranscript(transcript);
    onPrompt(parsed.message);
  }

  function handleSpeak() {
    const text = cleanText(responseText);
    if (!text) return;
    speak(text.slice(0, 900));
  }

  return (
    <section className="hocker-card p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-[var(--hocker-cyan)]">Voz NOVA</p>
          <h3 className="mt-2 text-lg font-semibold text-white">Dicta sin ejecutar</h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--hocker-text-soft)]">
            Puedes hablarle a NOVA. Si detecta una acción, sólo la prepara como solicitud segura; nada se ejecuta sin aprobación.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <VoiceInput onTranscript={handleTranscript} disabled={disabled} />

          <button
            type="button"
            onClick={handleSpeak}
            disabled={!canSpeak}
            className="hocker-focus-ring inline-flex h-10 items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-3 text-sm font-medium text-cyan-50 transition hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Volume2 size={16} />
            Escuchar
          </button>

          <button
            type="button"
            onClick={stopSpeaking}
            className="hocker-focus-ring inline-flex h-10 items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-3 text-sm font-medium text-slate-200 transition hover:bg-white/[0.08]"
          >
            <VolumeX size={16} />
            Detener
          </button>
        </div>
      </div>

      {lastTranscript ? (
        <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-3">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--hocker-text-muted)]">
            Último dictado · {lastMode === "action" ? "acción preparada" : "mensaje"}
          </p>
          <p className="mt-2 text-sm leading-6 text-white">{lastTranscript}</p>
        </div>
      ) : null}
    </section>
  );
}
