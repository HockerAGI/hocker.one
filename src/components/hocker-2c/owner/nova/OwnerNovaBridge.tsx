"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Loader2, Send, Sparkles } from "lucide-react";
import { ActionPreviewCard, EvidencePanel, PageState } from "@/components/hocker-2c";
import { HOCKER_HUMAN_COPY } from "@/lib/hocker-human-copy";
import { OwnerNovaInlineApprovals } from "./OwnerNovaInlineApprovals";

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
  "Revisa el estado del sistema y dime la siguiente acción importante.",
  "Prepara una mejora para Hocker ONE sin ejecutar nada todavía.",
  "Revisa pendientes y ordénalos por prioridad.",
  "Dime qué módulos están listos, parciales o protegidos.",
  "Prepara una acción segura para mejorar NOVA Chat.",
  "Resume la evidencia reciente en lenguaje simple.",
];

function modeInstruction(mode: NovaOwnerMode) {
  if (mode === "crear") {
    return "Modo Crear: responde con piezas claras, listas para revisar, sin ejecutar cambios reales.";
  }

  if (mode === "analizar") {
    return "Modo Analizar: revisa estado, riesgos, evidencia y próximos pasos con lenguaje simple.";
  }

  if (mode === "ejecutar") {
    return "Modo Ejecutar: sólo prepara una vista previa de acción. No ejecutes nada sin aprobación owner.";
  }

  return "Modo Normal: responde claro, breve y accionable.";
}

export function OwnerNovaBridge() {
  const [mode, setMode] = useState<NovaOwnerMode>("normal");
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState<string>(HOCKER_HUMAN_COPY.private_tagline);
  const [loading, setLoading] = useState(false);
  const [lastPrompt, setLastPrompt] = useState("");

  const selectedMode = useMemo(() => modes.find((item) => item.id === mode) ?? modes[0], [mode]);

  async function submit(input?: string) {
    const clean = (input ?? message).trim();
    if (!clean || loading) return;

    setLoading(true);
    setLastPrompt(clean);
    setReply("NOVA está revisando la solicitud...");

    try {
      const composedMessage = `${modeInstruction(mode)}\n\nSolicitud owner:\n${clean}`;

      const response = await fetch("/api/nova/chat", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          mode: "pro",
          message: composedMessage,
          messages: [
            {
              role: "user",
              content: composedMessage,
            },
          ],
          source: "owner-nova-bridge-13-2c-e",
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
    } catch {
      setReply("No pude conectar con NOVA en este entorno. La vista quedó segura y no ejecutó nada.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
      <div className="space-y-5">
        <div className="hocker-card p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-[var(--hocker-cyan)]">
                NOVA Owner Bridge
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-white">Habla. Ordena. Prepara.</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--hocker-text-soft)]">
                Esta entrada está pensada para operar sin saltar de módulo. NOVA puede preparar acciones, pero no ejecuta nada sensible sin aprobación.
              </p>
            </div>

            <div className="rounded-2xl border border-[var(--hocker-gold)]/30 bg-[var(--hocker-gold)]/10 px-4 py-3 text-sm text-amber-100">
              Owner Gate activo
            </div>
          </div>

          <div className="mt-5 grid gap-2 sm:grid-cols-4">
            {modes.map((item) => {
              const active = item.id === mode;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setMode(item.id)}
                  className={`hocker-focus-ring rounded-2xl border px-3 py-3 text-left transition ${
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
        </div>

        <div className="hocker-card p-5">
          <div className="min-h-56 rounded-3xl border border-white/10 bg-black/20 p-5">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-cyan-100/70">
              <Sparkles className="h-4 w-4" />
              Respuesta NOVA · {selectedMode.label}
            </div>

            <div className="mt-4 whitespace-pre-wrap text-sm leading-7 text-[var(--hocker-text-main)]">
              {reply}
            </div>

            <OwnerNovaInlineApprovals />

            {lastPrompt ? (
              <p className="mt-5 rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-xs leading-5 text-[var(--hocker-text-muted)]">
                Última solicitud: {lastPrompt}
              </p>
            ) : null}
          </div>

          <div className="mt-4 flex flex-col gap-3 md:flex-row">
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                  void submit();
                }
              }}
              placeholder="Dile a NOVA qué necesitas mover…"
              className="hocker-focus-ring min-h-28 flex-1 resize-none rounded-3xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white outline-none placeholder:text-[var(--hocker-text-muted)]"
            />

            <button
              type="button"
              onClick={() => void submit()}
              disabled={loading || !message.trim()}
              className="hocker-focus-ring flex min-h-16 items-center justify-center gap-2 rounded-3xl bg-[var(--hocker-blue)] px-5 py-3 text-sm font-semibold text-white shadow-[0_0_28px_rgba(3,102,255,0.22)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40 md:w-40"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              Enviar
            </button>
          </div>
        </div>

        <div className="hocker-card p-5">
          <p className="text-xs uppercase tracking-[0.24em] text-[var(--hocker-cyan)]">Acciones rápidas</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {quickActions.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => void submit(item)}
                className="hocker-focus-ring rounded-2xl border border-white/10 bg-white/[0.045] p-4 text-left text-sm leading-6 text-white transition hover:-translate-y-0.5 hover:border-cyan-300/30 hover:bg-white/[0.075]"
              >
                {item}
              </button>
            ))}
          </div>
        </div>
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

        <div className="hocker-card p-5">
          <p className="text-xs uppercase tracking-[0.24em] text-[var(--hocker-cyan)]">Accesos owner</p>
          <div className="mt-4 grid gap-3">
            <Link href="/owner/actions" className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 text-sm text-white transition hover:bg-white/[0.075]">
              Revisar pendientes
            </Link>
            <Link href="/owner/evidence" className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 text-sm text-white transition hover:bg-white/[0.075]">
              Ver evidencia
            </Link>
            <Link href="/owner/ecosystem" className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 text-sm text-white transition hover:bg-white/[0.075]">
              Ver ecosistema
            </Link>
          </div>
        </div>

        <PageState
          status="partial"
          title="Herramientas avanzadas en preparación"
          description="Archivo, imagen, video, voz, documentos y research se integrarán como herramientas reales por fases."
        />
      </div>
    </section>
  );
}
