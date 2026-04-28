"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import {
  Bot,
  Brain,
  FileText,
  Image as ImageIcon,
  Loader2,
  Paperclip,
  Search,
  Send,
  Sparkles,
  Video,
  Wand2,
  X,
  type LucideIcon,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useWorkspace } from "@/components/WorkspaceContext";

type Role = "user" | "nova" | "system";
type Mode = "auto" | "fast" | "pro";
type IntentKey = "chat" | "files" | "image" | "video" | "research" | "reason";

type Message = {
  id: string;
  role: Role;
  content: string;
  createdAt: number;
};

type AttachmentItem = {
  id: string;
  file: File;
};

type IntentOption = {
  key: IntentKey;
  label: string;
  hint: string;
  icon: LucideIcon;
  starter?: string;
};

const MODES: Array<{ value: Mode; label: string; hint: string }> = [
  { value: "auto", label: "Auto", hint: "mejor ruta" },
  { value: "fast", label: "Rápido", hint: "directo" },
  { value: "pro", label: "Profundo", hint: "quirúrgico" },
];

const INTENTS: IntentOption[] = [
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
    hint: "revisión real",
    icon: Paperclip,
    starter: "Voy a subir un archivo. Analízalo sin romper nada y dime qué corregir.",
  },
  {
    key: "research",
    label: "Investigar",
    hint: "conclusiones",
    icon: Search,
    starter: "Investiga a fondo y dame hallazgos, estrategia y acciones concretas.",
  },
  {
    key: "reason",
    label: "Razonar",
    hint: "paso lógico",
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

const QUICK_STARTS = [
  "Corrige este flujo para que sea más claro y vendible.",
  "Dame una estrategia de ejecución por fases.",
  "Detecta errores, riesgos y mejoras sin inventar.",
];

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

function makeId(): string {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();

  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (char) => {
    const value = Number(char);
    const random = Math.floor(Math.random() * 16);
    return (value ^ (random & (15 >> (value / 4)))).toString(16);
  });
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

export default function NovaChat() {
  const { projectId } = useWorkspace();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [mode, setMode] = useState<Mode>("auto");
  const [intent, setIntent] = useState<IntentKey>("chat");
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [threadId] = useState(makeId);

  const abortControllerRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeMode = useMemo(() => MODES.find((item) => item.value === mode) ?? MODES[0], [mode]);
  const activeIntent = useMemo(
    () => INTENTS.find((item) => item.key === intent) ?? INTENTS[0],
    [intent],
  );

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isTyping]);

  useEffect(() => () => abortControllerRef.current?.abort(), []);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(Math.max(el.scrollHeight, 54), 150)}px`;
  }, [input]);

  const clearComposer = () => {
    setInput("");
    setAttachments([]);
    setIntent("chat");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFiles = (event: ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(event.target.files ?? []);
    if (list.length === 0) return;

    setAttachments((prev) => [
      ...prev,
      ...list.map((file) => ({
        id: `${file.name}-${file.size}-${makeId()}`,
        file,
      })),
    ]);
    setIntent("files");
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((item) => item.id !== id));
  };

  const applyIntent = (item: IntentOption) => {
    if (item.key === "files") {
      fileInputRef.current?.click();
      setIntent("files");
      return;
    }

    setIntent(item.key);
    if (!input.trim() && item.starter) setInput(item.starter);
    requestAnimationFrame(() => textareaRef.current?.focus());
  };

  const sendMessage = async () => {
    if (!input.trim() || isTyping) return;

    const prompt = input.trim();
    const attachmentMeta = attachments.map((item) => ({
      name: item.file.name,
      type: item.file.type,
      size: item.file.size,
      kind: fileKind(item.file),
    }));

    setMessages((prev) => [
      ...prev,
      { id: makeId(), role: "user", content: prompt, createdAt: Date.now() },
    ]);
    setIsTyping(true);
    setInput("");

    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    try {
      const res = await fetch("/api/nova/chat", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        signal: abortControllerRef.current.signal,
        body: JSON.stringify({
          project_id: projectId,
          thread_id: threadId,
          message: prompt,
          prefer: "auto",
          mode,
          allow_actions: true,
          context_data: {
            selected_intent: intent,
            attachments: attachmentMeta,
            mode_ui: activeMode.label,
            client: "hocker.one",
          },
        }),
      });

      const data = (await res.json().catch(() => ({}))) as { reply?: string; error?: string };
      if (!res.ok) throw new Error(data.error || "No se pudo conectar con NOVA.");

      setMessages((prev) => [
        ...prev,
        {
          id: makeId(),
          role: "nova",
          content: data.reply || "NOVA recibió la solicitud, pero no devolvió contenido.",
          createdAt: Date.now(),
        },
      ]);

      if (attachments.length > 0) {
        setAttachments([]);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
      setIntent("chat");
    } catch (error) {
      if ((error as { name?: string } | null)?.name !== "AbortError") {
        setMessages((prev) => [
          ...prev,
          {
            id: makeId(),
            role: "system",
            content: error instanceof Error ? error.message : "La conexión con NOVA falló.",
            createdAt: Date.now(),
          },
        ]);
      }
    } finally {
      setIsTyping(false);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void sendMessage();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage();
    }
  };

  return (
    <div
      className={cx(
        "flex h-full w-full flex-col overflow-hidden rounded-[30px] border border-white/5",
        "bg-slate-950/30 shadow-[0_22px_90px_rgba(2,6,23,0.28)] backdrop-blur-2xl",
        isDragOver && "ring-1 ring-sky-400/30",
      )}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragOver(false);
        const files = Array.from(e.dataTransfer.files ?? []);
        if (files.length === 0) return;
        setAttachments((prev) => [
          ...prev,
          ...files.map((file) => ({ id: `${file.name}-${file.size}-${makeId()}`, file })),
        ]);
        setIntent("files");
      }}
    >
      <header className="shrink-0 border-b border-white/5 bg-white/[0.025] px-4 py-4 sm:px-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="relative grid h-12 w-12 place-items-center rounded-2xl border border-sky-300/20 bg-sky-400/10 shadow-[0_0_30px_rgba(56,189,248,0.12)]">
              <span className="absolute h-2.5 w-2.5 translate-x-4 -translate-y-4 rounded-full bg-emerald-400 shadow-[0_0_18px_rgba(52,211,153,0.8)]" />
              <Sparkles className="h-5 w-5 text-sky-200" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-black tracking-tight text-white">NOVA</p>
              <p className="truncate text-xs text-slate-400">AGI nativa · criterio, contexto y ejecución</p>
            </div>
          </div>

          <button
            type="button"
            onClick={clearComposer}
            className="rounded-full border border-white/5 bg-white/[0.035] px-3 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-slate-300 transition-all hover:border-sky-400/20 hover:bg-sky-400/10"
          >
            Limpiar
          </button>
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {INTENTS.map((item) => {
            const Icon = item.icon;
            const active = intent === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => applyIntent(item)}
                className={cx(
                  "inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-left transition-all",
                  active
                    ? "border-sky-300/25 bg-sky-400/12 text-sky-100 shadow-[0_0_24px_rgba(14,165,233,0.12)]"
                    : "border-white/5 bg-white/[0.03] text-slate-300 hover:border-white/10 hover:bg-white/[0.055]",
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="text-[10px] font-black uppercase tracking-[0.22em]">{item.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {attachments.length > 0 ? (
        <div className="shrink-0 border-b border-white/5 px-4 py-3 sm:px-5">
          <div className="flex flex-wrap gap-2">
            {attachments.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-2 rounded-full border border-white/5 bg-white/[0.04] px-3 py-2"
              >
                <span className="text-[10px] font-black uppercase tracking-[0.22em] text-sky-300">
                  {fileKind(item.file)}
                </span>
                <span className="max-w-[180px] truncate text-xs text-slate-200">{item.file.name}</span>
                <button
                  type="button"
                  onClick={() => removeAttachment(item.id)}
                  className="rounded-full p-1 text-slate-400 hover:bg-white/[0.05] hover:text-white"
                  aria-label={`Quitar ${item.file.name}`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div ref={scrollRef} className="custom-scrollbar flex-1 overflow-y-auto px-4 py-5 sm:px-5">
        <AnimatePresence initial={false}>
          {messages.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 12, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="mx-auto flex min-h-[42dvh] max-w-2xl flex-col justify-center gap-4 text-center"
            >
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-[24px] border border-sky-300/20 bg-sky-400/10 shadow-[0_0_40px_rgba(56,189,248,0.16)]">
                <Bot className="h-7 w-7 text-sky-200" />
              </div>
              <div>
                <h2 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
                  ¿Qué necesitas resolver?
                </h2>
                <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-slate-400">
                  Escribe una intención clara. NOVA convierte contexto en decisión, plan o ejecución.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {QUICK_STARTS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      setInput(item);
                      requestAnimationFrame(() => textareaRef.current?.focus());
                    }}
                    className="rounded-full border border-white/5 bg-white/[0.035] px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 hover:border-sky-300/20 hover:bg-sky-400/10 hover:text-sky-100"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => {
                const isUser = message.role === "user";
                const isSystem = message.role === "system";
                return (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.22 }}
                    className={cx("flex", isUser ? "justify-end" : "justify-start")}
                  >
                    <div
                      className={cx(
                        "max-w-[88%] rounded-[24px] border px-4 py-3 text-sm leading-relaxed sm:max-w-[76%]",
                        isUser && "border-sky-300/20 bg-sky-400/12 text-sky-50",
                        !isUser && !isSystem && "border-white/5 bg-white/[0.045] text-slate-100",
                        isSystem && "border-rose-300/15 bg-rose-500/10 text-rose-100",
                      )}
                    >
                      {!isUser ? (
                        <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-sky-300">
                          {isSystem ? <FileText className="h-3.5 w-3.5 text-rose-200" /> : <Sparkles className="h-3.5 w-3.5" />}
                          {isSystem ? "Sistema" : "NOVA"}
                        </div>
                      ) : null}
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </AnimatePresence>

        {isTyping ? (
          <div className="mt-4 flex justify-start">
            <div className="rounded-[24px] border border-white/5 bg-white/[0.045] px-4 py-3 text-sm text-slate-200">
              <div className="flex items-center gap-3">
                <Loader2 className="h-4 w-4 animate-spin text-sky-300" />
                <span>NOVA está procesando...</span>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <div className="shrink-0 border-t border-white/5 bg-slate-950/45 p-3 sm:p-4">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div
            className={cx(
              "rounded-[28px] border p-3 shadow-[0_18px_70px_rgba(2,6,23,0.20)] backdrop-blur-2xl",
              isDragOver ? "border-sky-400/30 bg-sky-400/[0.09]" : "border-white/5 bg-white/[0.035]",
            )}
          >
            <div className="mb-2 flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2 text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">
                <Wand2 className="h-4 w-4 text-sky-300" />
                <span className="truncate">NOVA · {activeMode.label} · {activeIntent.label}</span>
              </div>

              <div className="hidden gap-1 sm:flex">
                {MODES.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setMode(item.value)}
                    title={item.hint}
                    className={cx(
                      "rounded-full border px-2.5 py-1.5 text-[9px] font-black uppercase tracking-[0.18em]",
                      mode === item.value
                        ? "border-sky-300/25 bg-sky-400/12 text-sky-100"
                        : "border-white/5 bg-white/[0.03] text-slate-400 hover:text-slate-200",
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-end gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-white/5 bg-white/[0.035] text-slate-300 hover:border-sky-300/20 hover:bg-sky-400/10 hover:text-sky-100"
                aria-label="Subir archivo"
              >
                <Paperclip className="h-5 w-5" />
              </button>

              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escribe aquí. Enter envía, Shift+Enter baja línea."
                rows={1}
                className="custom-scrollbar min-h-[54px] flex-1 resize-none rounded-2xl border border-white/5 bg-slate-950/45 px-4 py-4 text-sm leading-relaxed text-white outline-none transition-all placeholder:text-slate-600 focus:border-sky-300/25"
              />

              <button
                type="submit"
                disabled={!input.trim() || isTyping}
                className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-sky-300/20 bg-sky-400 text-slate-950 shadow-[0_18px_48px_rgba(14,165,233,0.20)] transition-all hover:scale-105 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:scale-100"
                aria-label="Enviar mensaje"
              >
                {isTyping ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFiles} />
        </form>
      </div>
    </div>
  );
}
