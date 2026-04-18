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
  Github,
  Image as ImageIcon,
  Loader2,
  Mic,
  Paperclip,
  Send,
  Sparkles,
  Trash2,
  Video,
  Wand2,
  X,
  Search,
  Plug,
} from "lucide-react";
import { useWorkspace } from "@/components/WorkspaceContext";

type Role = "user" | "nova" | "system";

type Message = {
  id: string;
  role: Role;
  content: string;
  createdAt: number;
};

type Provider = "auto" | "openai" | "gemini" | "anthropic" | "ollama";
type Mode = "auto" | "fast" | "pro";
type ToolKey =
  | "chat"
  | "files"
  | "image"
  | "video"
  | "research"
  | "reason"
  | "apps"
  | "github"
  | "voice";

type AttachmentItem = {
  id: string;
  file: File;
};

type SpeechRecognitionResultLike = {
  transcript?: string;
};

type SpeechRecognitionEventLike = {
  results: ArrayLike<ArrayLike<SpeechRecognitionResultLike>>;
};

type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: unknown) => void) | null;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

type WindowWithSpeechRecognition = Window &
  typeof globalThis & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };

const PROVIDERS: Array<{
  value: Provider;
  label: string;
  hint: string;
}> = [
  { value: "auto", label: "Auto", hint: "elige la mejor ruta" },
  { value: "openai", label: "ChatGPT", hint: "redacción y razonamiento" },
  { value: "gemini", label: "Gemini", hint: "contexto y documentos" },
  { value: "anthropic", label: "Claude", hint: "análisis y cuidado" },
  { value: "ollama", label: "Local", hint: "modo interno" },
];

const MODES: Array<{
  value: Mode;
  label: string;
  hint: string;
}> = [
  { value: "auto", label: "Auto", hint: "ajuste inteligente" },
  { value: "fast", label: "Rápido", hint: "respuestas cortas" },
  { value: "pro", label: "Profundo", hint: "más detalle" },
];

const ACTIONS: Array<{
  key: ToolKey;
  label: string;
  icon: typeof Paperclip;
  hint: string;
}> = [
  { key: "files", label: "Subir archivo", icon: Paperclip, hint: "PDF, imagen, código" },
  { key: "image", label: "Generar imagen", icon: ImageIcon, hint: "concepto visual" },
  { key: "video", label: "Generar video", icon: Video, hint: "pieza corta" },
  { key: "research", label: "Investigar", icon: Search, hint: "búsqueda profunda" },
  { key: "reason", label: "Razonar", icon: Brain, hint: "análisis paso a paso" },
  { key: "apps", label: "Conectar apps", icon: Plug, hint: "flujo y automatización" },
  { key: "github", label: "Importar GitHub", icon: Github, hint: "repos y código" },
  { key: "voice", label: "Voz", icon: Mic, hint: "dictado en el navegador" },
];

const QUICK_STARTS: Array<{
  label: string;
  text: string;
  tool?: ToolKey;
  provider?: Provider;
  mode?: Mode;
}> = [
  {
    label: "Diseña una propuesta",
    text: "Necesito una propuesta clara, elegante y fácil de entender para un cliente.",
    mode: "pro",
  },
  {
    label: "Revisa un archivo",
    text: "Voy a subir un archivo. Quiero que lo analices y me digas qué mejorar.",
    tool: "files",
    provider: "gemini",
    mode: "pro",
  },
  {
    label: "Investiga a fondo",
    text: "Haz una investigación profunda y dame conclusiones claras, accionables y sin relleno.",
    tool: "research",
    provider: "gemini",
    mode: "pro",
  },
];

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
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
  const [provider, setProvider] = useState<Provider>("auto");
  const [mode, setMode] = useState<Mode>("auto");
  const [selectedTool, setSelectedTool] = useState<ToolKey>("chat");
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [threadId] = useState(() => crypto.randomUUID());
  const [speechSupported, setSpeechSupported] = useState(false);
  const [voiceActive, setVoiceActive] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const speechRef = useRef<SpeechRecognitionLike | null>(null);

  const activeProvider = useMemo(
    () => PROVIDERS.find((item) => item.value === provider) ?? PROVIDERS[0],
    [provider],
  );

  const activeMode = useMemo(
    () => MODES.find((item) => item.value === mode) ?? MODES[0],
    [mode],
  );

  const toolLabel = useMemo(() => {
    const item = ACTIONS.find((a) => a.key === selectedTool);
    return item ? item.label : "Chat";
  }, [selectedTool]);

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isTyping]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
      if (speechRef.current) {
        speechRef.current.stop();
      }
    };
  }, []);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.max(el.scrollHeight, 58)}px`;
  }, [input]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const win = window as WindowWithSpeechRecognition;
    const SR = win.SpeechRecognition ?? win.webkitSpeechRecognition;

    setSpeechSupported(Boolean(SR));
    if (!SR) return;

    const recognition = new SR();

    recognition.lang = "es-MX";
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onresult = (event: SpeechRecognitionEventLike) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0]?.transcript ?? "")
        .join("")
        .trim();

      if (transcript) {
        setInput(transcript);
      }
    };

    recognition.onend = () => {
      setVoiceActive(false);
    };

    recognition.onerror = () => {
      setVoiceActive(false);
    };

    speechRef.current = recognition;

    return () => {
      recognition.stop();
      speechRef.current = null;
    };
  }, []);

  const clearComposer = () => {
    setInput("");
    setAttachments([]);
    setSelectedTool("chat");
    fileInputRef.current && (fileInputRef.current.value = "");
  };

  const handleOpenFiles = () => {
    fileInputRef.current?.click();
  };

  const handleFiles = (event: ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(event.target.files ?? []);
    if (list.length === 0) return;

    setAttachments((prev) => [
      ...prev,
      ...list.map((file) => ({
        id: `${file.name}-${file.size}-${crypto.randomUUID()}`,
        file,
      })),
    ]);

    setSelectedTool("files");
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((item) => item.id !== id));
  };

  const addQuickPrompt = (item: (typeof QUICK_STARTS)[number]) => {
    setInput(item.text);
    if (item.provider) setProvider(item.provider);
    if (item.mode) setMode(item.mode);
    if (item.tool) setSelectedTool(item.tool);
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
    });
  };

  const toggleVoice = () => {
    const recognition = speechRef.current;
    if (!recognition || !speechSupported) return;

    if (voiceActive) {
      recognition.stop();
      setVoiceActive(false);
      return;
    }

    try {
      recognition.start();
      setVoiceActive(true);
      setSelectedTool("voice");
    } catch {
      setVoiceActive(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isTyping) return;

    const prompt = input.trim();
    const outgoing: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: prompt,
      createdAt: Date.now(),
    };

    setMessages((prev) => [...prev, outgoing]);
    setIsTyping(true);
    setInput("");

    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    const attachmentMeta = attachments.map((item) => ({
      name: item.file.name,
      type: item.file.type,
      size: item.file.size,
      kind: fileKind(item.file),
    }));

    try {
      const res = await fetch("/api/nova/chat", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        signal: abortControllerRef.current.signal,
        body: JSON.stringify({
          project_id: projectId,
          thread_id: threadId,
          message: prompt,
          mode,
          prefer: provider,
          allow_actions: true,
          context_data: {
            selected_tool: selectedTool,
            attachments: attachmentMeta,
            provider_ui: activeProvider.label,
            mode_ui: activeMode.label,
            client: "hocker.one",
          },
        }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        reply?: string;
        error?: string;
      };

      if (!res.ok) {
        throw new Error(data.error || "No se pudo conectar con NOVA.");
      }

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "nova",
          content: data.reply || "Respuesta vacía.",
          createdAt: Date.now(),
        },
      ]);

      if (attachments.length > 0) {
        setAttachments([]);
        fileInputRef.current && (fileInputRef.current.value = "");
      }
      setSelectedTool("chat");
    } catch (error) {
      if ((error as { name?: string } | null)?.name !== "AbortError") {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "system",
            content: "La conexión con NOVA falló. Vuelve a intentarlo.",
            createdAt: Date.now(),
          },
        ]);
      }
    } finally {
      setIsTyping(false);
      setVoiceActive(false);
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
        "bg-slate-950/35 backdrop-blur-2xl",
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
          ...files.map((file) => ({
            id: `${file.name}-${file.size}-${crypto.randomUUID()}`,
            file,
          })),
        ]);
        setSelectedTool("files");
      }}
    >
      <div className="flex items-center justify-between gap-3 border-b border-white/5 bg-white/[0.02] px-4 py-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-sky-400/15 bg-sky-400/10">
            <Sparkles className="h-5 w-5 text-sky-300" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-black text-white">NOVA</p>
            <p className="truncate text-xs text-slate-400">
              Habla, adjunta o elige una acción. Todo en un solo lugar.
            </p>
          </div>
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <span className="rounded-full border border-white/5 bg-white/[0.03] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.28em] text-slate-300">
            {activeProvider.label}
          </span>
          <span className="rounded-full border border-white/5 bg-white/[0.03] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.28em] text-slate-300">
            {activeMode.label}
          </span>
          <span className="rounded-full border border-emerald-400/15 bg-emerald-400/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.28em] text-emerald-200">
            {toolLabel}
          </span>
        </div>
      </div>

      <div className="border-b border-white/5 px-4 py-4 sm:px-5">
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
          {PROVIDERS.map((item) => {
            const active = provider === item.value;
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => setProvider(item.value)}
                className={cx(
                  "rounded-[18px] border px-3 py-3 text-left transition-all",
                  active
                    ? "border-sky-400/20 bg-sky-400/10 shadow-[0_0_24px_rgba(14,165,233,0.12)]"
                    : "border-white/5 bg-white/[0.03] hover:border-white/10 hover:bg-white/[0.05]",
                )}
              >
                <p className="text-xs font-black uppercase tracking-[0.28em] text-white">
                  {item.label}
                </p>
                <p className="mt-1 text-[11px] text-slate-400">{item.hint}</p>
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {MODES.map((item) => {
            const active = mode === item.value;
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => setMode(item.value)}
                className={cx(
                  "rounded-full border px-3 py-2 text-[10px] font-black uppercase tracking-[0.28em] transition-all",
                  active
                    ? "border-sky-400/20 bg-sky-400/10 text-sky-200"
                    : "border-white/5 bg-white/[0.03] text-slate-300 hover:border-white/10 hover:bg-white/[0.05]",
                )}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {ACTIONS.map((item) => {
            const Icon = item.icon;
            const active = selectedTool === item.key;

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => {
                  if (item.key === "files") {
                    handleOpenFiles();
                    setSelectedTool("files");
                    return;
                  }

                  if (item.key === "voice") {
                    toggleVoice();
                    return;
                  }

                  setSelectedTool(item.key);
                }}
                className={cx(
                  "flex items-center gap-3 rounded-[18px] border px-3 py-3 text-left transition-all",
                  active
                    ? "border-sky-400/20 bg-sky-400/10 shadow-[0_0_24px_rgba(14,165,233,0.12)]"
                    : "border-white/5 bg-white/[0.03] hover:border-white/10 hover:bg-white/[0.05]",
                )}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/5 bg-slate-950/50">
                  <Icon className={cx("h-4.5 w-4.5", active ? "text-sky-300" : "text-slate-300")} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white">{item.label}</p>
                  <p className="text-[11px] text-slate-400">{item.hint}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {attachments.length > 0 ? (
        <div className="border-b border-white/5 px-4 py-3 sm:px-5">
          <div className="flex flex-wrap gap-2">
            {attachments.map((item) => {
              const kind = fileKind(item.file);
              return (
                <div
                  key={item.id}
                  className="flex items-center gap-2 rounded-full border border-white/5 bg-white/[0.04] px-3 py-2"
                >
                  <span className="text-[10px] font-black uppercase tracking-[0.26em] text-sky-300">
                    {kind}
                  </span>
                  <span className="max-w-[180px] truncate text-xs text-slate-200">
                    {item.file.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeAttachment(item.id)}
                    className="rounded-full p-1 text-slate-400 hover:bg-white/[0.05] hover:text-white"
                    aria-label={`Quitar ${item.file.name}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      <div
        ref={scrollRef}
        className="custom-scrollbar flex-1 overflow-y-auto px-4 py-4 sm:px-5"
      >
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-[28px] border border-white/5 bg-white/[0.03] p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-sky-400/15 bg-sky-400/10">
                    <Bot className="h-5 w-5 text-sky-300" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-white">Listo para empezar</p>
                    <p className="text-sm text-slate-400">
                      Escribe lo que necesitas y NOVA lo convierte en una respuesta clara.
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {QUICK_STARTS.map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => addQuickPrompt(item)}
                      className="rounded-full border border-white/5 bg-white/[0.03] px-3 py-2 text-[10px] font-black uppercase tracking-[0.28em] text-slate-200 transition-all hover:border-sky-400/20 hover:bg-sky-400/10"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-[28px] border border-white/5 bg-white/[0.03] p-5">
                <p className="text-[10px] font-black uppercase tracking-[0.34em] text-slate-400">
                  Acciones sugeridas
                </p>
                <div className="mt-4 space-y-2">
                  {[
                    "Sube un archivo y pide un resumen.",
                    "Pide una idea visual y te la estructuro.",
                    "Solicita una investigación profunda con conclusiones.",
                  ].map((text) => (
                    <div
                      key={text}
                      className="rounded-2xl border border-white/5 bg-slate-950/50 px-4 py-3 text-sm text-slate-300"
                    >
                      {text}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            messages.map((msg) => {
              const isUser = msg.role === "user";
              const isNova = msg.role === "nova";

              return (
                <div
                  key={msg.id}
                  className={cx("flex w-full", isUser ? "justify-end" : "justify-start")}
                >
                  <div
                    className={cx(
                      "max-w-[92%] rounded-[24px] px-4 py-3.5 shadow-[0_18px_60px_rgba(2,6,23,0.22)] sm:max-w-[82%]",
                      isUser
                        ? "border border-sky-400/20 bg-sky-400/10 text-sky-50"
                        : isNova
                          ? "border border-white/5 bg-white/[0.04] text-slate-100"
                          : "border border-amber-400/15 bg-amber-400/10 text-amber-50",
                    )}
                  >
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <span className="text-[10px] font-black uppercase tracking-[0.32em] text-slate-400">
                        {isUser ? "Tú" : isNova ? "NOVA" : "Sistema"}
                      </span>
                      <span className="text-[10px] font-medium uppercase tracking-[0.28em] text-slate-500">
                        {formatTime(msg.createdAt)}
                      </span>
                    </div>
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">
                      {msg.content}
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {isTyping ? (
            <div className="flex justify-start">
              <div className="rounded-[24px] border border-white/5 bg-white/[0.04] px-4 py-3 text-sm text-slate-200">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-4 w-4 animate-spin text-sky-300" />
                  <span>Procesando la respuesta...</span>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="border-t border-white/5 bg-slate-950/40 p-3 sm:p-4">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div
            className={cx(
              "rounded-[28px] border p-3 shadow-[0_18px_70px_rgba(2,6,23,0.20)] backdrop-blur-2xl",
              isDragOver
                ? "border-sky-400/30 bg-sky-400/[0.09]"
                : "border-white/5 bg-white/[0.03]",
            )}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.32em] text-slate-400">
                <Wand2 className="h-4 w-4 text-sky-300" />
                {activeProvider.label} · {activeMode.label} · {toolLabel}
              </div>

              <button
                type="button"
                onClick={handleOpenFiles}
                className="inline-flex items-center gap-2 rounded-full border border-white/5 bg-white/[0.03] px-3 py-2 text-[10px] font-black uppercase tracking-[0.28em] text-slate-200 transition-all hover:border-sky-400/20 hover:bg-sky-400/10"
              >
                <Paperclip className="h-3.5 w-3.5" />
                Adjuntar
              </button>
            </div>

            <textarea
              ref={textareaRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe aquí lo que necesitas, o elige una acción arriba..."
              rows={1}
              className={cx(
                "mt-3 w-full resize-none rounded-[22px] border border-white/5 bg-slate-950/55 px-4 py-4",
                "text-sm leading-relaxed text-white placeholder:text-slate-500 outline-none transition-all",
                "focus:border-sky-400/25 focus:ring-1 focus:ring-sky-400/20",
              )}
              disabled={isTyping}
              autoComplete="off"
              spellCheck={false}
            />

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full border border-white/5 bg-white/[0.03] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.28em] text-slate-300">
                  {attachments.length} archivo{attachments.length === 1 ? "" : "s"}
                </span>
                <span className="rounded-full border border-white/5 bg-white/[0.03] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.28em] text-slate-300">
                  Enter para enviar
                </span>
                {speechSupported ? (
                  <span
                    className={cx(
                      "rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.28em]",
                      voiceActive
                        ? "border-emerald-400/15 bg-emerald-400/10 text-emerald-200"
                        : "border-white/5 bg-white/[0.03] text-slate-300",
                    )}
                  >
                    Voz {voiceActive ? "activa" : "lista"}
                  </span>
                ) : null}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={clearComposer}
                  className="inline-flex items-center gap-2 rounded-[18px] border border-white/5 bg-white/[0.03] px-4 py-3 text-[10px] font-black uppercase tracking-[0.32em] text-slate-200 transition-all hover:bg-white/[0.06]"
                >
                  <Trash2 className="h-4 w-4" />
                  Limpiar
                </button>

                <button
                  type="submit"
                  disabled={!input.trim() || isTyping}
                  className={cx(
                    "inline-flex items-center gap-2 rounded-[18px] px-4 py-3 text-[10px] font-black uppercase tracking-[0.32em] transition-all",
                    !input.trim() || isTyping
                      ? "cursor-not-allowed border border-white/5 bg-white/[0.03] text-slate-500"
                      : "border border-sky-400/20 bg-sky-400 px-4 py-3 text-slate-950 shadow-[0_0_24px_rgba(14,165,233,0.18)] hover:-translate-y-0.5",
                  )}
                >
                  En