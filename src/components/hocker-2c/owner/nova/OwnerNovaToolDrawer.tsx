"use client";

import type { Dispatch, SetStateAction } from "react";
import { useRef } from "react";
import {
  Brain,
  FileText,
  Image as ImageIcon,
  Paperclip,
  Search,
  Sparkles,
  Video,
  Wand2,
  X,
  type LucideIcon,
} from "lucide-react";

export type OwnerNovaIntentKey =
  | "chat"
  | "files"
  | "image"
  | "video"
  | "research"
  | "reason";

export type OwnerNovaAttachmentMeta = {
  id: string;
  name: string;
  type: string;
  size: number;
  kind: string;
};

type OwnerNovaIntentOption = {
  key: OwnerNovaIntentKey;
  label: string;
  hint: string;
  icon: LucideIcon;
  starter: string;
};

export const OWNER_NOVA_INTENT_OPTIONS: OwnerNovaIntentOption[] = [
  {
    key: "chat",
    label: "Criterio",
    hint: "decisión clara",
    icon: Sparkles,
    starter: "Analiza esto con criterio ejecutivo y dime la mejor ruta.",
  },
  {
    key: "files",
    label: "Archivo",
    hint: "revisión segura",
    icon: Paperclip,
    starter: "Voy a revisar archivos. Analiza el contexto sin romper nada y dime qué corregir.",
  },
  {
    key: "research",
    label: "Research",
    hint: "hallazgos",
    icon: Search,
    starter: "Investiga a fondo y dame hallazgos, estrategia y acciones concretas.",
  },
  {
    key: "reason",
    label: "Pensar",
    hint: "lógica",
    icon: Brain,
    starter: "Razonemos esto con calma: identifica el problema, riesgos y solución real.",
  },
  {
    key: "image",
    label: "Imagen",
    hint: "concepto visual",
    icon: ImageIcon,
    starter: "Estructura un concepto visual premium para HOCKER ONE.",
  },
  {
    key: "video",
    label: "Video",
    hint: "guion corto",
    icon: Video,
    starter: "Crea un guion breve, cinematográfico y vendible para HOCKER ONE.",
  },
];

type OwnerNovaToolDrawerProps = {
  intent: OwnerNovaIntentKey;
  onIntentChange: (intent: OwnerNovaIntentKey) => void;
  attachments: OwnerNovaAttachmentMeta[];
  onAttachmentsChange: Dispatch<SetStateAction<OwnerNovaAttachmentMeta[]>>;
  onPrompt: (text: string) => void;
  disabled?: boolean;
};

function makeId(): string {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function fileKind(file: File): string {
  if (file.type.startsWith("image/")) return "Imagen";
  if (file.type.startsWith("video/")) return "Video";
  if (file.type === "application/pdf") return "PDF";
  if (file.type.includes("json")) return "JSON";

  if (
    file.type.includes("javascript") ||
    file.type.includes("typescript") ||
    file.name.match(/\.(js|ts|tsx|jsx|vue|svelte|html|css|md|txt|py|go|rb|php|java|sql)$/i)
  ) {
    return "Código";
  }

  return "Archivo";
}

function formatBytes(size: number): string {
  if (!Number.isFinite(size) || size <= 0) return "0 KB";
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

export function OwnerNovaToolDrawer({
  intent,
  onIntentChange,
  attachments,
  onAttachmentsChange,
  onPrompt,
  disabled = false,
}: OwnerNovaToolDrawerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  function applyIntent(option: OwnerNovaIntentOption) {
    if (disabled) return;

    onIntentChange(option.key);

    if (option.key === "files") {
      fileInputRef.current?.click();
    }

    onPrompt(option.starter);
  }

  function handleFiles(files: FileList | null) {
    const list = Array.from(files ?? []);
    if (list.length === 0) return;

    onIntentChange("files");
    onAttachmentsChange((current) => [
      ...current,
      ...list.map((file) => ({
        id: `${file.name}-${file.size}-${makeId()}`,
        name: file.name,
        type: file.type || "unknown",
        size: file.size,
        kind: fileKind(file),
      })),
    ]);

    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeAttachment(id: string) {
    onAttachmentsChange((current) => current.filter((item) => item.id !== id));
  }

  function clearAttachments() {
    onAttachmentsChange([]);
  }

  return (
    <section className="hocker-card p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-[var(--hocker-cyan)]">
            Herramientas NOVA
          </p>
          <h3 className="mt-2 text-lg font-semibold text-white">Elige cómo debe pensar la solicitud</h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--hocker-text-soft)]">
            Fusionado desde el chat anterior: intención, archivos, research, razonamiento, imagen y video. Todo prepara contexto; nada ejecuta por sí solo.
          </p>
        </div>

        {attachments.length > 0 ? (
          <button
            type="button"
            onClick={clearAttachments}
            className="hocker-focus-ring rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-white/[0.08]"
          >
            Limpiar archivos
          </button>
        ) : null}
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-6">
        {OWNER_NOVA_INTENT_OPTIONS.map((option) => {
          const Icon = option.icon;
          const active = intent === option.key;

          return (
            <button
              key={option.key}
              type="button"
              onClick={() => applyIntent(option)}
              disabled={disabled}
              className={`hocker-focus-ring rounded-2xl border px-3 py-3 text-left transition disabled:cursor-not-allowed disabled:opacity-45 ${
                active
                  ? "border-cyan-300/40 bg-cyan-300/15 text-white shadow-[0_0_28px_rgba(22,200,255,0.12)]"
                  : "border-white/10 bg-white/[0.045] text-[var(--hocker-text-soft)] hover:bg-white/[0.075]"
              }`}
            >
              <span className="flex items-center gap-2 text-sm font-semibold">
                <Icon className="h-4 w-4" />
                {option.label}
              </span>
              <span className="mt-1 block text-xs leading-5 opacity-70">{option.hint}</span>
            </button>
          );
        })}
      </div>

      {attachments.length > 0 ? (
        <div className="mt-4 rounded-3xl border border-white/10 bg-black/20 p-3">
          <p className="px-1 text-xs uppercase tracking-[0.2em] text-[var(--hocker-text-muted)]">
            Archivos declarados para análisis
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {attachments.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.045] px-3 py-2 text-xs text-slate-200"
              >
                <FileText className="h-4 w-4 text-cyan-200" />
                <span className="font-semibold text-cyan-100">{item.kind}</span>
                <span className="max-w-[180px] truncate">{item.name}</span>
                <span className="text-[var(--hocker-text-muted)]">{formatBytes(item.size)}</span>
                <button
                  type="button"
                  onClick={() => removeAttachment(item.id)}
                  className="rounded-full p-1 text-slate-400 hover:bg-white/10 hover:text-white"
                  aria-label={`Quitar ${item.name}`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-4 rounded-2xl border border-[var(--hocker-gold)]/20 bg-[var(--hocker-gold)]/10 p-3">
        <div className="flex items-start gap-2 text-xs leading-5 text-amber-50/80">
          <Wand2 className="mt-0.5 h-4 w-4 text-amber-100" />
          <span>
            Los archivos aquí sólo se pasan como metadata al contexto. El análisis profundo de contenido real debe hacerse con subida/lectura controlada en una fase dedicada.
          </span>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(event) => handleFiles(event.target.files)}
      />
    </section>
  );
}
