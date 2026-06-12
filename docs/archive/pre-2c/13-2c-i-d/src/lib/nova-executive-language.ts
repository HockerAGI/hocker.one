import type { CommandStatus, DashboardCommandItem, DashboardSummary } from "@/lib/hocker-dashboard";

export type ExecutiveSystemMood = "stable" | "attention" | "working";

const COMMAND_LABELS: Array<[RegExp, string]> = [
  [/github\.upsert_file/i, "Preparación de mejora en código"],
  [/github\.create_pr/i, "Propuesta de cambio lista para revisión"],
  [/github\.read_file/i, "Lectura controlada de archivo"],
  [/github\.list_tree/i, "Revisión de estructura del proyecto"],
  [/status/i, "Revisión de estado operativo"],
  [/read_dir/i, "Lectura de carpeta autorizada"],
  [/read_file_head/i, "Vista previa segura de archivo"],
  [/shell\.exec/i, "Ejecución interna controlada"],
  [/fs\.write/i, "Preparación de archivo interno"],
];

export function describeOperationalAction(command: string): string {
  const value = String(command || "").trim();
  if (!value) return "Acción interna";

  const match = COMMAND_LABELS.find(([pattern]) => pattern.test(value));
  return match?.[1] ?? "Acción interna supervisada";
}

export function getExecutiveStatusLabel(status: CommandStatus | string): string {
  switch (status) {
    case "done":
      return "Completada";
    case "running":
      return "En proceso";
    case "queued":
      return "Preparada";
    case "needs_approval":
      return "Esperando revisión";
    case "error":
      return "Atención requerida";
    case "canceled":
      return "Cancelada";
    default:
      return "En revisión";
  }
}

export function getExecutiveMood(summary: DashboardSummary): ExecutiveSystemMood {
  const hasErrors =
    summary.recentCommands.some((item) => item.status === "error") ||
    summary.recentEvents.some((item) => item.level === "error");

  if (hasErrors) return "attention";

  const hasWork = summary.recentCommands.some(
    (item) =>
      item.status === "running" ||
      item.status === "queued" ||
      item.status === "needs_approval",
  );

  if (hasWork) return "working";

  return "stable";
}

export function getExecutiveMoodLabel(mood: ExecutiveSystemMood): string {
  if (mood === "attention") return "Atención requerida";
  if (mood === "working") return "Supervisando cambios";
  return "Estable";
}

export function getExecutiveMoodCopy(mood: ExecutiveSystemMood): string {
  if (mood === "attention") {
    return "NOVA detectó una señal que necesita revisión antes de seguir avanzando.";
  }

  if (mood === "working") {
    return "NOVA está coordinando acciones internas con revisión activa.";
  }

  return "NOVA mantiene producción, seguridad y módulos bajo supervisión estable.";
}

export function summarizeRecentAction(action: DashboardCommandItem): string {
  return `${describeOperationalAction(action.command)} · ${getExecutiveStatusLabel(action.status)}`;
}

export const NOVA_EXECUTIVE_RESPONSE_STYLE = [
  "Habla con estructura clara: diagnóstico, hallazgos, estrategia, acciones y resultado esperado cuando aplique.",
  "Usa markdown limpio, tablas cuando compares opciones y listas cortas cuando hay pasos.",
  "No muestres comandos internos al usuario final salvo que Armando pida ejecución técnica explícita.",
  "Traduce estados técnicos a lenguaje humano: estable, en proceso, esperando revisión o atención requerida.",
  "Sé directa, cálida, precisa y honesta. No inventes estados ni ejecuciones.",
].join("\n");
