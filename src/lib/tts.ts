import { NOVA_PROFILE } from "@/lib/novaPersona";

function pickVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  if (voices.length === 0) return null;

  const femaleHints = ["female", "mujer", "sabina", "luciana", "helena", "monica", "paulina"];
  const esVoices = voices.filter((voice) => /^es(-|_)?/i.test(voice.lang) || voice.lang.toLowerCase().includes("es"));

  const preferred =
    esVoices.find((voice) =>
      femaleHints.some((hint) => voice.name.toLowerCase().includes(hint)),
    ) ?? esVoices[0] ?? voices[0];

  return preferred ?? null;
}

export function speak(text: string): void {
  if (typeof window === "undefined") return;

  const utteranceText = String(text ?? "").trim();
  if (!utteranceText) return;

  const synth = window.speechSynthesis;
  if (!synth) return;

  const utterance = new SpeechSynthesisUtterance(utteranceText);
  utterance.lang = NOVA_PROFILE.locale;
  utterance.rate = NOVA_PROFILE.voiceRate;
  utterance.pitch = NOVA_PROFILE.voicePitch;
  utterance.volume = NOVA_PROFILE.voiceVolume;

  const voices = synth.getVoices();
  const selected = pickVoice(voices);
  if (selected) {
    utterance.voice = selected;
  }

  synth.cancel();
  synth.speak(utterance);
}

export function stopSpeaking(): void {
  if (typeof window === "undefined") return;
  window.speechSynthesis?.cancel();
}