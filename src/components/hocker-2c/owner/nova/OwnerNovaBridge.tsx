"use client";

import { useMemo, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { ActionPreviewCard, EvidencePanel } from "@/components/hocker-2c";
import { HOCKER_HUMAN_COPY } from "@/lib/hocker-human-copy";
import { GlassCard, Composer } from "@/components/system";
import { OwnerNovaInlineApprovals } from "./OwnerNovaInlineApprovals";
import { OwnerNovaInlineExecutions } from "./OwnerNovaInlineExecutions";
import { OwnerNovaVoiceDock } from "./OwnerNovaVoiceDock";
import {
  OwnerNovaToolDrawer,
  type OwnerNovaAttachmentMeta,
  type OwnerNovaIntentKey,
} from "./OwnerNovaToolDrawer";

type NovaOwnerMode = "normal" | "crear" | "analizar" | "ejecutar";

const modes: Array<{
  id: NovaOwnerMode;
  label: string;
  description: string;
}> = [
  {
    id: "normal",
    label: "Normal",
    description: "Preguntar, revisar y ordenar ideas.",
  },
  {
    id: "crear",
    label: "Crear",
    description: "Textos, campañas, documentos y piezas.",
  },
  {
    id: "analizar",
    label: "Analizar",
    description: "Datos, sistema, rendimiento y riesgos.",
  },
  {
    id: "ejecutar",
    label: "Ejecutar",
    description: "Preparar acciones con aprobación.",
  },
];

const quickActions = [
  "Revisa mi estado actual y dime qué conviene hacer primero.",
  "Prepara una mejora para Hocker ONE sin ejecutar nada todavía.",
  "Resume pendientes por prioridad y urgencia.",
  "Dime qué módulos están listos y cuáles siguen protegidos.",
  "Prepara una propuesta segura para mejorar NOVA Chat.",
  "Resume la evidencia reciente en lenguaje simple.",
];

function modeInstruction(mode: NovaOwnerMode) {
  if (mode === "crear") {
    return "Modo Crear: responde con piezas listas para revisar. No ejecutes cambios reales.";
  }

  if (mode === "analizar") {
    return "Modo Analizar: revisa estado, riesgos, evidencia y próximos pasos con lenguaje claro y directo.";
  }

  if (mode === "ejecutar") {
    return "Modo Ejecutar: prepara la acción con contexto claro. La ejecución real sólo ocurre con aprobación owner.";
  }

  return "Modo Normal: responde natural, breve y útil. Si falta contexto, pide sólo lo mínimo.";
}

export function OwnerNovaBridge() {
  const [mode, setMode] = useState<NovaOwnerMode>("normal");
  const [message, setMessage] = useState("");
  const [intent, setIntent] = useState<OwnerNovaIntentKey>("chat");
  const [attachments, setAttachments] = useState<OwnerNovaAttachmentMeta[]>([]);
  const [reply, setReply] = useState<string>(HOCKER_HUMAN_COPY.private_tagline);
  const [loading, setLoading] = useState(false);
  const [lastPrompt, setLastPrompt] = useState("");

  const selectedMode = useMemo(
    () => modes.find((item) => item.id === mode) ?? modes[0],
    [mode],
  );

  function appendToComposer(text: string) {
    const clean = String(text ?? "").trim();
    if (!clean) return;

    setMessage((current) => {
      const previous = String(current ?? "").trim();
      return previous ? `${previous}\n${clean}` : clean;
    });
  }

  async function submit(input?: string) {
    const clean = (input ?? message).trim();
    if (!clean || loading) return;

    setLoading(true);
    setLastPrompt(clean);
    setReply("NOVA está preparando una respuesta clara...");

    try {
      const attachmentSummary = attachments.length
        ? attachments
            .map(
              (item, index) =>
                `${index + 1}. ${item.kind}: ${item.name} (${item.type || "unknown"}, ${item.size} bytes)`,
            )
            .join("\n")
        : "";

      const composedMessage = [
        modeInstruction(mode),
        `Intención seleccionada: ${intent}.`,
        attachmentSummary ? `Archivos declarados para contexto:\n${attachmentSummary}` : "",
        `Solicitud owner:\n${clean}`,
      ]
        .filter(Boolean)
        .join("\n\n");

      const response = await fetch("/api/nova/chat", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          project_id: "hocker-one",
          mode: "pro",
          prefer: "auto",
          allow_actions: mode === "ejecutar",
          message: composedMessage,
          messages: [
            {
              role: "user",
              content: composedMessage,
            },
          ],
          context_data: {
            owner_mode: mode,
            selected_intent: intent,
            attachments,
            client: "hocker.one.owner",
            source: "owner-nova-bridge-13-2c-i-c",
            safety: {
              direct_execution: false,
              owner_gate_required: true,
              allow_actions_only_in_execute_mode: true,
            },
          },
          source: "owner-nova-bridge-13-2c-i-c",
        }),
      });

      const data = await response.json().catch(() => ({}));
      const text =
        data.reply ||
        data.response ||
        data.message ||
        data.text ||
        data.error ||
        "NOVA respondió, pero no recibí un texto limpio para mostrar.";

      setReply(String(text));
      setMessage("");
      setAttachments([]);
    } catch {
      setReply("No pude conectar con NOVA en este entorno. La vista quedó segura y no ejecutó nada.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
      <div className="space-y-5">
        <GlassCard
          eyebrow="NOVA Owner Bridge"
          title="Habla. Ordena. Prepara."
          description="Esta entrada está pensada para operar sin saltar de módulo. NOVA puede preparar acciones, pero no ejecuta nada sensible sin aprobación."
          actions={
            <div className="rounded-2xl border border-[var(--hocker-gold)]/30 bg-[var(--hocker-gold)]/10 px-4 py-3 text-sm text-amber-100">
              Owner Gate activo
            </div>
          }
          contentClassName="space-y-5"
        >
          <div className="grid gap-2 sm:grid-cols-4">
            {modes.map((item) => {
              const active = item.id === mode;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setMode(item.id)}
                  className={`rounded-2xl border px-3 py-3 text-left transition ${
                    active
                      ? "border-cyan-300/40 bg-cyan-300/15 text-white shadow-[0_0_28px_rgba(22,200,255,0.12)]"
                      : "border-white/10 bg-white/[0.045] text-[var(--hocker-text-soft)] hover:bg-white/[0.075]"
                  }`}
                >
                  <span className="block text-sm font-semibold">{item.label}</span>
                  <span className="mt-1 block text-xs leading-5 opacity-70">{item.description}</span>
                </button>
              );
            })}
          </div>

          <OwnerNovaToolDrawer
            intent={intent}
            onIntentChange={setIntent}
            attachments={attachments}
            onAttachmentsChange={setAttachments}
            onPrompt={(text) => appendToComposer(text)}
            disabled={loading}
          />
        </GlassCard>

        <GlassCard
          eyebrow="Chat"
          title="Conversación con NOVA"
          description="La experiencia debe sentirse más como un workspace conversacional que como un formulario."
          interactive
        >
          <div className="space-y-4">
            <div className="min-h-56 rounded-3xl border border-white/10 bg-black/20 p-5">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-cyan-100/70">
                <Sparkles className="h-4 w-4" />
                Respuesta NOVA · {selectedMode?.label ?? "Normal"}
              </div>

              <div className="mt-4 whitespace-pre-wrap text-sm leading-7 text-[var(--hocker-text-main)]">
                {reply}
              </div>

              <OwnerNovaInlineApprovals />
              <OwnerNovaInlineExecutions />

              {lastPrompt ? (
                <p className="mt-5 rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-xs leading-5 text-[var(--hocker-text-muted)]">
                  Última solicitud: {lastPrompt}
                </p>
              ) : null}
            </div>

            <Composer
              placeholder="Escribe aquí lo que necesitas que haga NOVA…"
              onSend={(text) => void submit(text)}
              className="border border-white/10 bg-white/[0.06]"
            />
          </div>
        </GlassCard>

        <OwnerNovaVoiceDock
          onPrompt={(text) => appendToComposer(text)}
          responseText={reply}
          disabled={loading}
        />

        <GlassCard
          eyebrow="Acciones rápidas"
          title="Sugerencias"
          description="Úsalas para acelerar análisis, creación o preparación de acciones."
        >
          <div className="grid gap-3 md:grid-cols-2">
            {quickActions.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => void submit(item)}
                className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 text-left text-sm leading-6 text-white transition hover:-translate-y-0.5 hover:border-cyan-300/30 hover:bg-white/[0.075]"
              >
                {item}
              </button>
            ))}
          </div>
        </GlassCard>
      </div>

      <div className="space-y-5">
        <ActionPreviewCard
          title="Ejecutar con aprobación"
          summary="Cuando NOVA prepare una acción real, debe explicar qué cambia, riesgo, destino y pasos antes de solicitar aprobación."
          risk="low"
          target="Owner Gate"
          steps={[
            "NOVA entiende la intención.",
            "Clasifica si es respuesta, creación, análisis o ejecución.",
            "Si toca algo real, prepara vista previa.",
            "El owner aprueba o rechaza.",
          ]}
          requiresApproval
        />

        <EvidencePanel
          title="Panel de confianza"
          description="La meta es que cada acción real sea entendible y comprobable."
          items={[
            { label: "Ejecución directa", value: "No permitida" },
            { label: "Aprobación", value: "Obligatoria si cambia algo real" },
            { label: "Evidencia", value: "Requerida" },
            { label: "Rollback", value: "Cuando aplique" },
          ]}
          footer="NOVA prepara. Tú decides. El sistema registra."
        />

        <GlassCard
          eyebrow="Estado"
          title="Flujo conversacional"
          description="La próxima etapa será que approvals y ejecuciones vivan todavía más dentro del hilo."
        >
          <div className="space-y-2 text-sm leading-7 text-slate-300">
            <p>• Chat natural</p>
            <p>• Herramientas visibles</p>
            <p>• Aprobación inline</p>
            <p>• Ejecución protegida</p>
          </div>
        </GlassCard>
      </div>
    </section>
  );
}
