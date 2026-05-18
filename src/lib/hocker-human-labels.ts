const AGI_NAMES: Record<string, string> = {
  nova: "NOVA",
  syntia: "Syntia",
  vertx: "Vertx",
  curvewind: "Curvewind",
  nova_ads: "Nova Ads",
  "nova-ads": "Nova Ads",
  candy: "Candy Ads",
  candy_ads: "Candy Ads",
  "candy-ads": "Candy Ads",
  pro_ia: "PRO IA",
  "pro-ia": "PRO IA",
  revia: "Revia",
  hostia: "Hostia",
  jurix: "Jurix",
  numia: "Numia",
  chido_wins: "Chido Wins",
  "chido-wins": "Chido Wins",
  chido_gerente: "Chido Gerente",
  "chido-gerente": "Chido Gerente",
  nexpa: "NEXPA",
  "nexpa-agi": "NEXPA",
  trackhok: "TrackHok",
  "trackhok-agi": "TrackHok",
  shadows: "Shadows IA",
};

const UPDATE_LABELS: Record<string, string> = {
  creative_trend: "Tendencia creativa",
  policy_update: "Regla actualizada",
  metric_learning: "Aprendizaje de métricas",
  algorithm_change: "Cambio de algoritmo",
  error_prevention: "Prevención de error",
  platform_rule: "Regla de plataforma",
  internal_result: "Resultado interno",
  client_context: "Contexto de cliente",
  agi_observation: "Observación de AGI",
  active: "Activo",
  hot: "Alta prioridad",
  warm: "Prioridad media",
  cold: "Baja prioridad",
  archive: "Archivado",
};

export function humanAgiName(value?: string | null): string {
  if (!value) return "AGI";
  return AGI_NAMES[value] ?? AGI_NAMES[value.toLowerCase()] ?? value.replace(/[_-]/g, " ");
}

export function humanLabel(value?: string | null): string {
  if (!value) return "Sin dato";
  return UPDATE_LABELS[value] ?? UPDATE_LABELS[value.toLowerCase()] ?? value.replace(/[_-]/g, " ");
}

export function humanLearningTitle(title?: string | null, sourceAgiId?: string | null): string {
  const raw = String(title || "").trim();
  const source = humanAgiName(sourceAgiId);

  if (!raw) return "Sin memoria activa todavía";

  const lower = raw.toLowerCase();

  if (lower.includes("safe-zone") || lower.includes("safe zone")) {
    return `${source} aprendió una regla visual`;
  }

  if (lower.includes("memory") || lower.includes("learning")) {
    return `${source} registró un aprendizaje`;
  }

  return raw
    .replace(/^Sprint\s+[0-9A-Z.\-]+\s*/i, "")
    .replace(/\d{4}-\d{2}-\d{2}T[0-9:.Z+-]+/g, "")
    .replace(/[_-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 90) || `${source} registró un aprendizaje`;
}
