/**
 * Hocker ONE — Nova Chat Helpers
 *
 * Pure utility functions extracted from the NovaRealtimeChat monolith.
 * No React components here — just data transformations and formatting.
 */

import {
  type ChatActionDraft,
  type QueueLock,
  type RuntimeAction,
  type NativeCapability,
  type CapabilityGroup,
  type GuidedGitHubChain,
  NATIVE_CAPABILITIES,
  GUIDED_GITHUB_ACTION_ORDER,
  GUIDED_GITHUB_TERMINAL_STATUSES,
} from "./nova-chat-types";

export function generateId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function compact(value: unknown, max = 220): string {
  const clean = String(value ?? "").replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
}

export function pickContent(data: unknown): string {
  if (typeof data === "string") return data;
  if (!data || typeof data !== "object") return "";
  const item = data as Record<string, unknown>;
  for (const key of ["delta", "content", "reply", "message", "text"]) {
    if (typeof item[key] === "string") return item[key] as string;
  }
  return "";
}

export function extractActions(data: unknown): ChatActionDraft[] {
  if (!data || typeof data !== "object") return [];
  const item = data as Record<string, unknown>;
  if (Array.isArray(item.actions)) return item.actions.filter((entry) => entry && typeof entry === "object") as ChatActionDraft[];

  const meta = item.meta && typeof item.meta === "object" ? (item.meta as Record<string, unknown>) : null;
  const draft = meta?.chat_action_draft;
  if (draft && typeof draft === "object" && !Array.isArray(draft)) return [draft as ChatActionDraft];

  return [];
}

function asQueueLock(value: unknown): QueueLock | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Partial<QueueLock>;
  if (typeof item.locked !== "boolean") return null;

  return {
    locked: item.locked,
    can_start_new_task: Boolean(item.can_start_new_task),
    reason: String(item.reason ?? ""),
    blocking_count: Number(item.blocking_count ?? 0),
    total_recent: Number(item.total_recent ?? 0),
    active_actions: Array.isArray(item.active_actions) ? item.active_actions : [],
    status_counts: item.status_counts && typeof item.status_counts === "object" ? item.status_counts : {},
    checked_at: String(item.checked_at ?? ""),
    error: typeof item.error === "string" ? item.error : undefined,
  };
}

export function extractQueueLock(payload: unknown): QueueLock | null {
  if (!payload || typeof payload !== "object") return null;
  const item = payload as Record<string, unknown>;
  const direct = asQueueLock(item.queue_lock);
  if (direct) return direct;

  const meta = item.meta && typeof item.meta === "object" ? (item.meta as Record<string, unknown>) : null;
  const metaLock = meta ? asQueueLock(meta.queue_lock) : null;
  if (metaLock) return metaLock;

  const runtime = meta?.hocker_runtime && typeof meta.hocker_runtime === "object" ? (meta.hocker_runtime as Record<string, unknown>) : null;
  return runtime ? asQueueLock(runtime.queue_lock) : null;
}

export function shouldAllowActionDraft(prompt: string) {
  return /haz|hacer|crea|crear|prepara|preparar|corrige|corregir|modifica|modificar|actualiza|actualizar|implementa|implementar|ejecuta|ejecutar|revisa|revisar|conecta|conectar|despliega|desplegar|genera|generar|github|repo|repositorio|c[oó]digo|branch|rama|pull request|\bpr\b|commit|supabase|vercel|terminal|meta ads|campaña|anuncio|zip|archivo|imagen|video|voz|avatar/i.test(prompt);
}

export function isReadyForProduction(action: RuntimeAction) {
  const payload = action.payload ?? {};
  const gate = typeof payload.production_gate === "object" && payload.production_gate !== null ? payload.production_gate as Record<string, unknown> : null;
  const validAction = ["github.merge_pr", "production.deploy", "vercel.promote"].includes(action.action_type);
  const ready = gate?.ready === true || action.status === "ready_for_production" || action.status === "production_ready";
  return Boolean(validAction && ready && !action.execution_error);
}

export function summarizeAction(action: RuntimeAction) {
  const payload = action.payload ?? {};
  const writePlan = typeof payload.write_plan === "object" && payload.write_plan !== null ? payload.write_plan as Record<string, unknown> : {};
  const repo = String(writePlan.repository ?? payload.repository ?? "No definido");
  const branch = String(writePlan.target_branch ?? payload.branch ?? payload.head ?? "No aplica");
  const path = String(writePlan.path ?? payload.path ?? "No aplica");
  return { repo, branch, path };
}

export function payloadString(payload: Record<string, unknown> | undefined, ...keys: string[]): string {
  for (const key of keys) {
    const value = payload?.[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

export function isGuidedGithubMaterializerAction(action: RuntimeAction): boolean {
  const payload = action.payload ?? {};
  return (
    action.tool_key === "github" &&
    GUIDED_GITHUB_ACTION_ORDER.includes(action.action_type) &&
    payload.materializer_version === "12.7K-2A"
  );
}

export function guidedGithubBranchKey(action: RuntimeAction): string | null {
  if (!isGuidedGithubMaterializerAction(action)) return null;
  return payloadString(action.payload, "target_branch", "branch", "head") || null;
}

export function isGuidedGithubTerminal(action: RuntimeAction): boolean {
  return GUIDED_GITHUB_TERMINAL_STATUSES.has(action.status);
}

export function isGuidedGithubCompleted(action: RuntimeAction): boolean {
  return ["executed", "completed"].includes(action.status);
}

export function guidedGithubStepLabel(actionType: string): string {
  if (actionType === "github.create_branch") return "Crear rama segura";
  if (actionType === "github.upsert_file") return "Guardar evidencia";
  if (actionType === "github.create_pr") return "Abrir PR draft";
  return actionType;
}

export function buildGuidedGitHubChain(items: RuntimeAction[]): GuidedGitHubChain | null {
  const groups = new Map<string, RuntimeAction[]>();

  for (const item of items) {
    const key = guidedGithubBranchKey(item);
    if (!key) continue;
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }

  if (groups.size === 0) return null;

  const chains = Array.from(groups.entries()).map(([key, group]) => {
    const latestByType = new Map<string, RuntimeAction>();

    for (const item of group) {
      const current = latestByType.get(item.action_type);
      if (!current || Date.parse(item.created_at || "") > Date.parse(current.created_at || "")) {
        latestByType.set(item.action_type, item);
      }
    }

    const ordered = GUIDED_GITHUB_ACTION_ORDER
      .map((actionType) => latestByType.get(actionType))
      .filter(Boolean) as RuntimeAction[];

    const nextAction = ordered.find((item) => !isGuidedGithubTerminal(item)) ?? null;
    const completed = ordered.filter(isGuidedGithubCompleted).length;
    const latestTime = Math.max(...ordered.map((item) => Date.parse(item.created_at || "") || 0), 0);

    return {
      key,
      targetBranch: key,
      actions: ordered,
      nextAction,
      completed,
      total: GUIDED_GITHUB_ACTION_ORDER.length,
      latestTime,
      hasOpenWork: Boolean(nextAction),
    };
  });

  chains.sort((a, b) => {
    if (a.hasOpenWork !== b.hasOpenWork) return a.hasOpenWork ? -1 : 1;
    return b.latestTime - a.latestTime;
  });

  const selected = chains[0];
  if (!selected) return null;

  return {
    key: selected.key,
    targetBranch: selected.targetBranch,
    actions: selected.actions,
    nextAction: selected.nextAction,
    completed: selected.completed,
    total: selected.total,
  };
}

export function capabilityItems(keys: string[]): NativeCapability[] {
  const allowed = new Set(keys);
  return NATIVE_CAPABILITIES.filter((item) => allowed.has(item.key));
}

export function makeCapabilityGroup(input: {
  key: CapabilityGroup["key"];
  title: string;
  subtitle: string;
  description: string;
  capabilityKeys: string[];
}): CapabilityGroup {
  const items = capabilityItems(input.capabilityKeys);

  return {
    key: input.key,
    title: input.title,
    label: input.title,
    name: input.title,
    subtitle: input.subtitle,
    description: input.description,
    items,
    capabilities: items,
    tools: items,
    keys: input.capabilityKeys,
  };
}

export const CAPABILITY_GROUPS: CapabilityGroup[] = [
  makeCapabilityGroup({
    key: "crear",
    title: "Crear",
    subtitle: "Contenido visual y creativo",
    description: "Imagen, video, voz, avatar y piezas creativas cuando el executor real esté conectado.",
    capabilityKeys: ["imagen", "video", "voz", "avatar"],
  }),
  makeCapabilityGroup({
    key: "trabajo",
    title: "Trabajo",
    subtitle: "Archivos, documentos y código",
    description: "Documentos, presentaciones, investigación, archivos y cambios protegidos en repositorio.",
    capabilityKeys: ["archivo", "documento", "presentacion", "investigacion", "repo"],
  }),
  makeCapabilityGroup({
    key: "sistema",
    title: "Sistema",
    subtitle: "Conexiones y operación",
    description: "Datos, conexiones, estado operativo y acciones protegidas bajo tu aprobación.",
    capabilityKeys: ["datos"],
  }),
];

export function statusTone(status: string) {
  if (["connected", "configured", "active", "executed", "completed", "approved"].includes(status)) return "border-emerald-400/30 bg-emerald-400/10 text-emerald-200";
  if (["partial", "needs_approval", "ready_for_production", "production_ready", "queued", "review"].includes(status)) return "border-amber-300/30 bg-amber-300/10 text-amber-100";
  if (["blocked", "failed", "error", "execution_failed", "missing", "missing_key", "missing_code", "rejected"].includes(status)) return "border-rose-400/30 bg-rose-400/10 text-rose-100";
  return "border-slate-400/20 bg-white/5 text-slate-200";
}

export function formatScope(scope?: string) {
  const map: Record<string, string> = {
    github_code: "Código / GitHub",
    supabase_data: "Datos / Supabase",
    vercel_cloud: "Vercel / Cloud",
    terminal_local: "Terminal / Entorno",
    ads_marketing: "Ads / Marketing",
    chido_sensitive: "Chido sensible",
    general_action: "Acción general",
  };
  return map[String(scope ?? "")] ?? "Acción detectada";
}

export function humanStatus(status?: string) {
  const map: Record<string, string> = {
    needs_approval: "Esperando aprobación",
    approved: "Autorizado",
    queued: "En espera",
    dry_run_queued: "En revisión",
    running: "En proceso",
    executing: "Ejecutando",
    executed: "Completado",
    completed: "Completado",
    failed: "Requiere revisión",
    error: "Requiere revisión",
    execution_failed: "Falló ejecución",
    needs_fix: "Necesita ajuste",
    review: "En revisión",
    rejected: "Cancelado",
    cancelled: "Cancelado",
    canceled: "Cancelado",
    production_ready: "Listo para producción",
    ready_for_production: "Listo para producción",
    pendiente: "Pendiente",
  };

  return map[String(status ?? "")] ?? compact(status || "Pendiente", 40);
}

export function humanRisk(risk?: string) {
  const map: Record<string, string> = {
    low: "Bajo",
    medium: "Medio",
    high: "Alto",
    critical: "Crítico",
  };

  return map[String(risk ?? "")] ?? compact(risk || "Medio", 24);
}

export function humanTool(tool?: string | null) {
  const map: Record<string, string> = {
    github: "Cambios en código",
    supabase: "Datos",
    vercel: "Cloud",
    trigger: "Automatización",
    nova_orchestrator: "NOVA",
  };

  return map[String(tool ?? "")] ?? "Preparación";
}

export function shortTechnicalValue(value: unknown, max = 54) {
  return compact(String(value ?? "No definido"), max);
}

export function actionEvidenceText(action: RuntimeAction) {
  const payload = action.payload ?? {};
  const result = action.execution_result && typeof action.execution_result === "object" ? action.execution_result : null;
  const resultItem = result?.result && typeof result.result === "object" ? result.result as Record<string, unknown> : null;
  const htmlUrl = typeof resultItem?.html_url === "string" ? resultItem.html_url : "";
  const path = payloadString(payload, "path", "evidence_path");

  if (htmlUrl) return "Evidencia generada y guardada en GitHub.";
  if (path) return `Se guardará evidencia en ${shortTechnicalValue(path, 72)}.`;
  if (action.action_type === "github.create_branch") return "La evidencia será la rama protegida creada fuera de main.";
  if (action.action_type === "github.create_pr") return "La evidencia será un PR draft con resumen y trazabilidad.";
  return "La evidencia se mostrará al ejecutar el paso autorizado.";
}

export function actionRollbackText(action: RuntimeAction) {
  if (action.action_type === "github.create_branch") return "Si no procede, la rama puede eliminarse o quedar cerrada sin tocar main.";
  if (action.action_type === "github.upsert_file") return "Si hay error, se revierte el archivo desde la rama protegida.";
  if (action.action_type === "github.create_pr") return "Si no procede, el PR se cierra sin merge; si se mergea, se revierte con commit nuevo.";
  return "Toda ejecución debe registrar resultado, error y plan de reversa.";
}

export function actionPrimaryLocation(action: RuntimeAction) {
  const info = summarizeAction(action);
  if (info.path !== "No aplica") return info.path;
  if (info.branch !== "No aplica") return info.branch;
  return info.repo;
}
