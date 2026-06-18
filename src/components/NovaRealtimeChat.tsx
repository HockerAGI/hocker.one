"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import {
  Activity,
  Bot,
  Brain,
  CheckCircle2,
  CircleAlert,
  Code2,
  Database,
  FileText,
  ImageIcon,
  Loader2,
  LockKeyhole,
  Mic2,
  PanelRight,
  Paperclip,
  Plus,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Square,
  Video,
  Wand2,
  XCircle,
  Zap,
} from "lucide-react";
import { useWorkspace } from "@/components/WorkspaceContext";

type ChatActionDraft = {
  version?: string;
  requested?: boolean;
  enqueued?: boolean;
  executed?: boolean;
  project_id?: string;
  scope?: string;
  tool_key?: string | null;
  owner_agi?: string;
  risk_level?: string;
  can_enqueue?: boolean;
  reason?: string;
  current_limit?: string;
  next_step?: string;
  draft?: {
    title?: string;
    original_message?: string;
    action_policy?: string;
    execution_ready?: boolean;
    owner_gate_required?: boolean;
    queue_lock_checked?: boolean;
    proposed_flow?: string[];
  };
  public_context?: Record<string, unknown>;
};

type Msg = {
  id: string;
  role: "user" | "nova" | "system";
  content: string;
  createdAt: number;
  streaming?: boolean;
  actions?: ChatActionDraft[];
  meta?: Record<string, unknown> | null;
};

type Integration = {
  tool_key: string;
  name: string;
  provider: string;
  status: "configured" | "connected" | "partial" | "missing" | "blocked" | "missing_key" | "missing_code";
  supports_read: boolean;
  supports_write: boolean;
  supports_realtime: boolean;
  safe_note?: string;
};

type RuntimeAction = {
  id: string;
  agi_id: string;
  tool_key: string | null;
  action_type: string;
  title: string;
  status: string;
  risk_level: string;
  created_at: string;
  execution_error?: string | null;
  payload?: Record<string, unknown>;
  execution_result?: Record<string, unknown> | null;
};

type QueueLock = {
  locked: boolean;
  can_start_new_task: boolean;
  reason: string;
  blocking_count: number;
  total_recent: number;
  active_actions: RuntimeAction[];
  status_counts: Record<string, number>;
  checked_at: string;
  error?: string;
};

type RuntimeSummary = {
  counts?: { agents: number; tools_configured: number; tools_total: number; actions: number; runs: number };
  integrations?: Integration[];
  schema_ready?: boolean;
  message?: string;
};

type NativeCapability = {
  key: string;
  label: string;
  status: "Activo" | "Protegido" | "Parcial" | "Pendiente";
  detail: string;
  prompt: string;
};

type ActionListResponse = { ok?: boolean; actions?: RuntimeAction[]; error?: string };
type MutateResponse = { ok?: boolean; message?: string; error?: string };

const BLOCKING_STATUSES = new Set([
  "needs_approval",
  "approved",
  "queued",
  "dry_run_queued",
  "running",
  "executing",
  "execution_failed",
  "failed",
  "error",
  "needs_fix",
  "review",
]);

const NATIVE_CAPABILITIES: NativeCapability[] = [
  {
    key: "archivo",
    label: "Archivos",
    status: "Pendiente",
    detail: "PDF, DOC, CSV, ZIP e importación segura. Falta subir archivos desde Hocker ONE.",
    prompt: "NOVA, quiero importar un archivo. Dime cómo lo vas a procesar sin exponer datos sensibles.",
  },
  {
    key: "imagen",
    label: "Imagen",
    status: "Pendiente",
    detail: "Candy Ads será responsable. Falta executor visual real conectado a Hocker ONE.",
    prompt: "NOVA, prepara una solicitud de imagen para Candy Ads con branding Hocker.",
  },
  {
    key: "video",
    label: "Video",
    status: "Pendiente",
    detail: "PRO IA será responsable. HeyGen/video requiere integración validada.",
    prompt: "NOVA, prepara un guion y storyboard de video para PRO IA.",
  },
  {
    key: "voz",
    label: "Voz",
    status: "Pendiente",
    detail: "Texto a voz y clonación de voz requieren integración real y permisos.",
    prompt: "NOVA, prepara un flujo de voz para el ecosistema y dime qué falta conectar.",
  },
  {
    key: "avatar",
    label: "Avatar",
    status: "Pendiente",
    detail: "Avatar y humanoide NOVA requieren pipeline visual/video validado.",
    prompt: "NOVA, prepara el flujo para avatar de NOVA sin fingir generación.",
  },
  {
    key: "documento",
    label: "Documentos",
    status: "Pendiente",
    detail: "Puede estructurar contenido. Exportación PDF/DOCX queda como siguiente módulo.",
    prompt: "NOVA, prepara un documento ejecutivo listo para exportar.",
  },
  {
    key: "presentacion",
    label: "Slides",
    status: "Pendiente",
    detail: "Presentaciones exportables quedan pendientes de generador real.",
    prompt: "NOVA, prepara una presentación ejecutiva estilo Hocker ONE.",
  },
  {
    key: "repo",
    label: "Código",
    status: "Protegido",
    detail: "GitHub real protegido. Branch/PR/Owner Gate. Nunca main directo.",
    prompt: "NOVA, revisa el repo y prepara una mejora sin ejecutar nada.",
  },
  {
    key: "investigacion",
    label: "Research",
    status: "Parcial",
    detail: "Puede preparar análisis. Investigación profunda con citas entra en módulo dedicado.",
    prompt: "NOVA, investiga este tema con fuentes verificables y separa hechos de recomendaciones.",
  },
  {
    key: "datos",
    label: "Datos",
    status: "Protegido",
    detail: "Supabase lectura/estado. Escritura solo con Owner Gate.",
    prompt: "NOVA, revisa el estado de Supabase sin cambiar datos.",
  },
];

type CapabilityGroup = {
  key: "crear" | "trabajo" | "sistema";
  title: string;
  label: string;
  name: string;
  subtitle: string;
  description: string;
  items: NativeCapability[];
  capabilities: NativeCapability[];
  tools: NativeCapability[];
  keys: string[];
};

function capabilityItems(keys: string[]): NativeCapability[] {
  const allowed = new Set(keys);
  return NATIVE_CAPABILITIES.filter((item) => allowed.has(item.key));
}

function makeCapabilityGroup(input: {
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

const CAPABILITY_GROUPS: CapabilityGroup[] = [
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


function id() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function compact(value: unknown, max = 220): string {
  const clean = String(value ?? "").replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
}

function pickContent(data: unknown): string {
  if (typeof data === "string") return data;
  if (!data || typeof data !== "object") return "";
  const item = data as Record<string, unknown>;
  for (const key of ["delta", "content", "reply", "message", "text"]) {
    if (typeof item[key] === "string") return item[key] as string;
  }
  return "";
}

function extractActions(data: unknown): ChatActionDraft[] {
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

function extractQueueLock(payload: unknown): QueueLock | null {
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

function shouldAllowActionDraft(prompt: string) {
  return /haz|hacer|crea|crear|prepara|preparar|corrige|corregir|modifica|modificar|actualiza|actualizar|implementa|implementar|ejecuta|ejecutar|revisa|revisar|conecta|conectar|despliega|desplegar|genera|generar|github|repo|repositorio|c[oó]digo|branch|rama|pull request|\bpr\b|commit|supabase|vercel|terminal|meta ads|campaña|anuncio|zip|archivo|imagen|video|voz|avatar/i.test(prompt);
}

function isReadyForProduction(action: RuntimeAction) {
  const payload = action.payload ?? {};
  const gate = typeof payload.production_gate === "object" && payload.production_gate !== null ? payload.production_gate as Record<string, unknown> : null;
  const validAction = ["github.merge_pr", "production.deploy", "vercel.promote"].includes(action.action_type);
  const ready = gate?.ready === true || action.status === "ready_for_production" || action.status === "production_ready";
  return Boolean(validAction && ready && !action.execution_error);
}

function summarizeAction(action: RuntimeAction) {
  const payload = action.payload ?? {};
  const writePlan = typeof payload.write_plan === "object" && payload.write_plan !== null ? payload.write_plan as Record<string, unknown> : {};
  const repo = String(writePlan.repository ?? payload.repository ?? "No definido");
  const branch = String(writePlan.target_branch ?? payload.branch ?? payload.head ?? "No aplica");
  const path = String(writePlan.path ?? payload.path ?? "No aplica");
  return { repo, branch, path };
}


const GUIDED_GITHUB_ACTION_ORDER = ["github.create_branch", "github.upsert_file", "github.create_pr"];
const GUIDED_GITHUB_TERMINAL_STATUSES = new Set(["executed", "completed", "rejected", "cancelled", "canceled"]);

type GuidedGitHubChain = {
  key: string;
  targetBranch: string;
  actions: RuntimeAction[];
  nextAction: RuntimeAction | null;
  completed: number;
  total: number;
};

function payloadString(payload: Record<string, unknown> | undefined, ...keys: string[]): string {
  for (const key of keys) {
    const value = payload?.[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }

  return "";
}

function isGuidedGithubMaterializerAction(action: RuntimeAction): boolean {
  const payload = action.payload ?? {};
  return (
    action.tool_key === "github" &&
    GUIDED_GITHUB_ACTION_ORDER.includes(action.action_type) &&
    payload.materializer_version === "12.7K-2A"
  );
}

function guidedGithubBranchKey(action: RuntimeAction): string | null {
  if (!isGuidedGithubMaterializerAction(action)) return null;
  return payloadString(action.payload, "target_branch", "branch", "head") || null;
}

function isGuidedGithubTerminal(action: RuntimeAction): boolean {
  return GUIDED_GITHUB_TERMINAL_STATUSES.has(action.status);
}

function isGuidedGithubCompleted(action: RuntimeAction): boolean {
  return ["executed", "completed"].includes(action.status);
}

function guidedGithubStepLabel(actionType: string): string {
  if (actionType === "github.create_branch") return "Crear rama segura";
  if (actionType === "github.upsert_file") return "Guardar evidencia";
  if (actionType === "github.create_pr") return "Abrir PR draft";
  return actionType;
}

function buildGuidedGitHubChain(items: RuntimeAction[]): GuidedGitHubChain | null {
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


function statusTone(status: string) {
  if (["connected", "configured", "active", "executed", "completed", "approved"].includes(status)) return "border-emerald-400/30 bg-emerald-400/10 text-emerald-200";
  if (["partial", "needs_approval", "ready_for_production", "production_ready", "queued", "review"].includes(status)) return "border-amber-300/30 bg-amber-300/10 text-amber-100";
  if (["blocked", "failed", "error", "execution_failed", "missing", "missing_key", "missing_code", "rejected"].includes(status)) return "border-rose-400/30 bg-rose-400/10 text-rose-100";
  return "border-slate-400/20 bg-white/5 text-slate-200";
}

function capabilityIcon(key: string) {
  if (key === "archivo") return <Paperclip className="h-4 w-4" />;
  if (key === "imagen") return <ImageIcon className="h-4 w-4" />;
  if (key === "video") return <Video className="h-4 w-4" />;
  if (key === "voz") return <Mic2 className="h-4 w-4" />;
  if (key === "avatar") return <Bot className="h-4 w-4" />;
  if (key === "repo") return <Code2 className="h-4 w-4" />;
  if (key === "investigacion") return <Search className="h-4 w-4" />;
  if (key === "datos") return <Database className="h-4 w-4" />;
  return <FileText className="h-4 w-4" />;
}

function formatScope(scope?: string) {
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

function humanStatus(status?: string) {
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

function humanRisk(risk?: string) {
  const map: Record<string, string> = {
    low: "Bajo",
    medium: "Medio",
    high: "Alto",
    critical: "Crítico",
  };

  return map[String(risk ?? "")] ?? compact(risk || "Medio", 24);
}

function humanTool(tool?: string | null) {
  const map: Record<string, string> = {
    github: "Cambios en código",
    supabase: "Datos",
    vercel: "Cloud",
    trigger: "Automatización",
    nova_orchestrator: "NOVA",
  };

  return map[String(tool ?? "")] ?? "Preparación";
}

function shortTechnicalValue(value: unknown, max = 54) {
  return compact(String(value ?? "No definido"), max);
}

function actionEvidenceText(action: RuntimeAction) {
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

function actionRollbackText(action: RuntimeAction) {
  if (action.action_type === "github.create_branch") return "Si no procede, la rama puede eliminarse o quedar cerrada sin tocar main.";
  if (action.action_type === "github.upsert_file") return "Si hay error, se revierte el archivo desde la rama protegida.";
  if (action.action_type === "github.create_pr") return "Si no procede, el PR se cierra sin merge; si se mergea, se revierte con commit nuevo.";
  return "Toda ejecución debe registrar resultado, error y plan de reversa.";
}

function actionPrimaryLocation(action: RuntimeAction) {
  const info = summarizeAction(action);
  if (info.path !== "No aplica") return info.path;
  if (info.branch !== "No aplica") return info.branch;
  return info.repo;
}

function DraftCard({ draft, onShowSummary, onCancel }: { draft: ChatActionDraft; onShowSummary: () => void; onCancel: () => void }) {
  const flow = Array.isArray(draft.draft?.proposed_flow) ? draft.draft?.proposed_flow ?? [] : [];
  const safe = draft.executed === false && draft.enqueued === false;

  return (
    <div className="mt-3 overflow-hidden rounded-[1.6rem] border border-sky-300/20 bg-[radial-gradient(circle_at_top_left,rgba(30,200,255,0.10),transparent_34%),rgba(255,255,255,0.045)] shadow-[0_18px_64px_rgba(14,165,233,0.10)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-2xl bg-sky-300/10 text-sky-200">
            <Wand2 className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-black text-white">NOVA preparó una acción</p>
            <p className="text-[11px] text-slate-400">{formatScope(draft.scope)} · requiere tu revisión</p>
          </div>
        </div>

        <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${safe ? "border-emerald-300/30 bg-emerald-300/10 text-emerald-200" : "border-amber-300/30 bg-amber-300/10 text-amber-100"}`}>
          {safe ? "Sin ejecutar" : "Esperando aprobación"}
        </span>
      </div>

      <div className="space-y-3 px-4 py-4">
        <p className="text-sm leading-6 text-slate-100">{compact(draft.draft?.title || draft.reason || "NOVA preparó un borrador seguro.")}</p>

        <div className="grid gap-2 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-3">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Tipo</p>
            <p className="mt-1 text-sm font-bold text-white">{humanTool(draft.tool_key)}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-3">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Cuidado</p>
            <p className="mt-1 text-sm font-bold text-white">{humanRisk(draft.risk_level)}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-3">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Tu aprobación</p>
            <p className="mt-1 text-sm font-bold text-white">{draft.draft?.owner_gate_required ? "Requerida" : "No requerida"}</p>
          </div>
        </div>

        {flow.length > 0 ? (
          <details className="group rounded-2xl border border-white/10 bg-slate-950/32 p-3">
            <summary className="cursor-pointer list-none text-xs font-black text-sky-100 outline-none transition hover:text-white">
              Ver detalle del plan
            </summary>
            <div className="mt-3 space-y-2">
              {flow.map((item, index) => (
                <div key={`${item}-${index}`} className="flex gap-2 text-xs text-slate-300">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white/10 text-[10px] font-black text-sky-200">{index + 1}</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </details>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={onShowSummary} className="min-h-10 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-white hover:bg-white/10">
            Ver estado
          </button>
          <button type="button" disabled className="min-h-10 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-bold text-slate-500">
            Requiere materialización segura
          </button>
          <button type="button" onClick={onCancel} className="min-h-10 rounded-xl border border-rose-300/20 bg-rose-300/10 px-3 py-2 text-xs font-bold text-rose-100 hover:bg-rose-300/15">
            Cancelar flujo
          </button>
        </div>
      </div>
    </div>
  );
}

function GuidedGitHubChainCard({ chain, busyAction, onShowSummary, onMutate }: { chain: GuidedGitHubChain; busyAction: string | null; onShowSummary: () => void; onMutate: (action: RuntimeAction, mode: "approve" | "reject" | "execute") => void }) {
  const nextAction = chain.nextAction;
  const loading = nextAction ? busyAction === nextAction.id : false;
  const canApprove = Boolean(nextAction && ["needs_approval", "ready_for_production", "production_ready", "queued", "dry_run_queued"].includes(nextAction.status));
  const canExecute = Boolean(nextAction && nextAction.status === "approved");
  const canReject = Boolean(nextAction && BLOCKING_STATUSES.has(nextAction.status));
  const nextLabel = nextAction ? guidedGithubStepLabel(nextAction.action_type) : "Cadena completada";

  return (
    <div className="rounded-[1.7rem] border border-sky-300/20 bg-[radial-gradient(circle_at_top_left,rgba(30,200,255,0.10),transparent_32%),rgba(255,255,255,0.045)] p-4 shadow-[0_0_38px_rgba(56,189,248,0.08)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-sky-200">Cambios en código</p>
          <h3 className="mt-1 text-base font-black text-white">{nextAction ? `Siguiente: ${nextLabel}` : "Todo listo"}</h3>
          <p className="mt-1 text-xs leading-5 text-slate-400">NOVA prepara. Tú apruebas. El sistema ejecuta un paso a la vez con evidencia.</p>
        </div>
        <span className="rounded-full border border-amber-300/25 bg-amber-300/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-amber-100">
          {chain.completed} de {chain.total} completados
        </span>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-3 text-xs text-slate-300">
          <b className="text-slate-100">Rama protegida:</b> {shortTechnicalValue(chain.targetBranch, 84)}
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-3 text-xs text-slate-300">
          <b className="text-slate-100">Estado:</b> {nextAction ? humanStatus(nextAction.status) : "Completado"}
        </div>
      </div>

      <div className="mt-3 grid gap-2 lg:grid-cols-3">
        {GUIDED_GITHUB_ACTION_ORDER.map((actionType, index) => {
          const action = chain.actions.find((item) => item.action_type === actionType);
          const active = Boolean(action && nextAction?.id === action.id);
          const done = Boolean(action && isGuidedGithubCompleted(action));

          return (
            <div key={actionType} className={`rounded-2xl border p-3 ${active ? "border-sky-300/30 bg-sky-300/10" : done ? "border-emerald-300/25 bg-emerald-300/10" : "border-white/10 bg-white/[0.035]"}`}>
              <div className="flex items-center justify-between gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-white/10 text-xs font-black text-sky-100">{index + 1}</span>
                <span className={`rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.14em] ${statusTone(action?.status ?? "pendiente")}`}>
                  {humanStatus(action?.status ?? "pendiente")}
                </span>
              </div>
              <p className="mt-2 text-sm font-black text-white">{guidedGithubStepLabel(actionType)}</p>
              <p className="mt-1 text-[11px] leading-5 text-slate-400">{action ? actionEvidenceText(action) : "Se activará cuando el paso anterior esté listo."}</p>
              {action ? (
                <details className="mt-2 rounded-xl border border-white/10 bg-slate-950/35 p-2">
                  <summary className="cursor-pointer list-none text-[11px] font-bold text-sky-100">Evidencia y reversa</summary>
                  <div className="mt-2 space-y-2 text-[11px] leading-5 text-slate-400">
                    <p><b className="text-slate-200">Dónde:</b> {shortTechnicalValue(actionPrimaryLocation(action), 88)}</p>
                    <p><b className="text-slate-200">Reversa:</b> {actionRollbackText(action)}</p>
                    <p className="text-slate-500">ID técnico: {action.id}</p>
                  </div>
                </details>
              ) : null}
              {action?.execution_error ? (
                <p className="mt-2 rounded-xl border border-rose-300/20 bg-rose-300/10 p-2 text-[11px] text-rose-100">{action.execution_error}</p>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={onShowSummary} className="min-h-10 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-white hover:bg-white/10">
          Ver estado
        </button>

        {nextAction && canApprove ? (
          <button type="button" disabled={loading} onClick={() => onMutate(nextAction, "approve")} className="min-h-10 rounded-xl bg-emerald-400 px-3 py-2 text-xs font-black text-slate-950 hover:bg-emerald-300 disabled:opacity-50">
            {loading ? "Procesando…" : `Aprobar ${nextLabel}`}
          </button>
        ) : null}

        {nextAction && canExecute ? (
          <button type="button" disabled={loading} onClick={() => onMutate(nextAction, "execute")} className="min-h-10 rounded-xl bg-sky-300 px-3 py-2 text-xs font-black text-slate-950 hover:bg-sky-200 disabled:opacity-50">
            {loading ? "Ejecutando…" : `Ejecutar ${nextLabel}`}
          </button>
        ) : null}

        {nextAction && canReject ? (
          <button type="button" disabled={loading} onClick={() => onMutate(nextAction, "reject")} className="min-h-10 rounded-xl border border-rose-300/20 bg-rose-300/10 px-3 py-2 text-xs font-bold text-rose-100 hover:bg-rose-300/15 disabled:opacity-50">
            Cancelar flujo
          </button>
        ) : null}

        {!nextAction ? (
          <span className="min-h-10 rounded-xl border border-emerald-300/25 bg-emerald-300/10 px-3 py-2 text-xs font-black text-emerald-100">
            Cadena completada
          </span>
        ) : null}
      </div>
    </div>
  );
}

function RuntimeActionCard({ action, busyAction, onShowSummary, onMutate }: { action: RuntimeAction; busyAction: string | null; onShowSummary: () => void; onMutate: (action: RuntimeAction, mode: "approve" | "reject" | "execute") => void }) {
  const info = summarizeAction(action);
  const loading = busyAction === action.id;

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/48 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-black text-white">{action.title}</p>
          <p className="mt-1 text-xs text-slate-400">{humanTool(action.tool_key)} · {guidedGithubStepLabel(action.action_type)}</p>
        </div>
        <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${statusTone(action.status)}`}>
          {humanStatus(action.status)}
        </span>
      </div>

      <div className="mt-3 grid gap-2 text-xs sm:grid-cols-3">
        <div className="rounded-xl bg-white/[0.04] p-2 text-slate-300"><b className="text-slate-100">Repositorio:</b> {info.repo}</div>
        <div className="rounded-xl bg-white/[0.04] p-2 text-slate-300"><b className="text-slate-100">Rama:</b> {shortTechnicalValue(info.branch, 54)}</div>
        <div className="rounded-xl bg-white/[0.04] p-2 text-slate-300"><b className="text-slate-100">Evidencia:</b> {shortTechnicalValue(info.path, 54)}</div>
      </div>

      <details className="mt-3 rounded-xl border border-white/10 bg-white/[0.035] p-3">
        <summary className="cursor-pointer list-none text-xs font-black text-sky-100">Ver evidencia y reversa</summary>
        <div className="mt-2 space-y-2 text-xs leading-5 text-slate-400">
          <p>{actionEvidenceText(action)}</p>
          <p><b className="text-slate-200">Reversa:</b> {actionRollbackText(action)}</p>
          <p className="text-slate-500">ID técnico: {action.id}</p>
        </div>
      </details>

      {action.execution_error ? (
        <p className="mt-3 rounded-xl border border-rose-300/20 bg-rose-300/10 p-3 text-xs text-rose-100">{action.execution_error}</p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={onShowSummary} className="min-h-10 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-white hover:bg-white/10">
          Ver estado
        </button>

        {(action.status === "needs_approval" || action.status === "ready_for_production" || action.status === "production_ready") ? (
          <button type="button" disabled={loading} onClick={() => onMutate(action, "approve")} className="min-h-10 rounded-xl bg-emerald-400 px-3 py-2 text-xs font-black text-slate-950 hover:bg-emerald-300 disabled:opacity-50">
            {loading ? "Procesando…" : "Aprobar cambio"}
          </button>
        ) : null}

        {action.status === "approved" ? (
          <button type="button" disabled={loading} onClick={() => onMutate(action, "execute")} className="min-h-10 rounded-xl bg-sky-300 px-3 py-2 text-xs font-black text-slate-950 hover:bg-sky-200 disabled:opacity-50">
            {loading ? "Ejecutando…" : "Ejecutar paso autorizado"}
          </button>
        ) : null}

        {BLOCKING_STATUSES.has(action.status) ? (
          <button type="button" disabled={loading} onClick={() => onMutate(action, "reject")} className="min-h-10 rounded-xl border border-rose-300/20 bg-rose-300/10 px-3 py-2 text-xs font-bold text-rose-100 hover:bg-rose-300/15 disabled:opacity-50">
            Cancelar flujo
          </button>
        ) : null}
      </div>
    </div>
  );
}

export default function NovaRealtimeChat() {
  const { projectId } = useWorkspace();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [summary, setSummary] = useState<RuntimeSummary | null>(null);
  const [actions, setActions] = useState<RuntimeAction[]>([]);
  const [queueLock, setQueueLock] = useState<QueueLock | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [showCapabilities, setShowCapabilities] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [threadId] = useState(id);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const integrations = useMemo(() => summary?.integrations ?? [], [summary]);
  const configured = integrations.filter((item) => ["configured", "connected"].includes(item.status));
  const partial = integrations.filter((item) => item.status === "partial");
  const blockingActions = useMemo(() => actions.filter((item) => BLOCKING_STATUSES.has(item.status)), [actions]);
  const productionAction = useMemo(() => actions.find(isReadyForProduction) ?? null, [actions]);
  const guidedGitHubChain = useMemo(() => buildGuidedGitHubChain(actions), [actions]);
  const guidedGitHubActionIds = useMemo(() => new Set(guidedGitHubChain?.actions.map((item) => item.id) ?? []), [guidedGitHubChain]);
  const standaloneBlockingActions = useMemo(
    () => blockingActions.filter((item) => !guidedGitHubActionIds.has(item.id)),
    [blockingActions, guidedGitHubActionIds],
  );
  const latestDraft = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      const draft = messages[i]?.actions?.[0];
      if (draft) return draft;
    }
    return null;
  }, [messages]);

  const effectiveLock: QueueLock = queueLock ?? {
    locked: blockingActions.length > 0,
    can_start_new_task: blockingActions.length === 0,
    reason: blockingActions.length > 0 ? "Hay una tarea pendiente. NOVA no debe iniciar otra todavía." : "Cola limpia.",
    blocking_count: blockingActions.length,
    total_recent: actions.length,
    active_actions: blockingActions,
    status_counts: {},
    checked_at: "",
  };

  const loadRuntime = useCallback(async () => {
    try {
      const [summaryRes, actionsRes] = await Promise.all([
        fetch(`/api/agi/runtime/summary?project_id=${encodeURIComponent(projectId)}`, { credentials: "include", cache: "no-store" }),
        fetch(`/api/agi/runtime/actions?project_id=${encodeURIComponent(projectId)}&limit=30`, { credentials: "include", cache: "no-store" }),
      ]);

      const summaryData = await summaryRes.json().catch(() => ({}));
      const actionsData = (await actionsRes.json().catch(() => ({}))) as ActionListResponse;

      setSummary(summaryData.summary ?? null);
      if (!actionsRes.ok || actionsData.error) throw new Error(actionsData.error || "No se pudo leer la cola AGI.");
      setActions(actionsData.actions ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo leer el runtime.");
    }
  }, [projectId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isSending]);

  useEffect(() => {
    void loadRuntime();
    return () => { abortRef.current?.abort(); };
  }, [loadRuntime]);

  async function send(event?: { preventDefault: () => void }) {
    event?.preventDefault();
    const prompt = input.trim();
    if (!prompt || isSending) return;

    const actionLike = shouldAllowActionDraft(prompt);
    // eslint-disable-next-line react-hooks/purity -- id()/Date.now() run only inside the send() event handler, never during render
    const userMsg: Msg = { id: id(), role: "user", content: prompt, createdAt: Date.now() };
    const novaId = id();

    setMessages((prev) => [...prev, userMsg, { id: novaId, role: "nova", content: "", createdAt: Date.now(), streaming: true }]);
    setInput("");
    setIsSending(true);
    setError(null);

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    try {
      if (actionLike) {
        const res = await fetch("/api/nova/chat", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          signal: abortRef.current.signal,
          body: JSON.stringify({
            project_id: projectId,
            thread_id: threadId,
            message: prompt,
            mode: "auto",
            allow_actions: false,
            context_data: {
              source: "nova_chat_ux_12_7k_preview",
              expectation: "preview visual seguro, sin encolar ni ejecutar desde chat",
            },
          }),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok || data?.ok === false) throw new Error(String(data?.error || `Hablar con NOVA HTTP ${res.status}`));

        const nextLock = extractQueueLock(data);
        if (nextLock) setQueueLock(nextLock);

        const draftActions = extractActions(data);
        const content = pickContent(data) || "NOVA preparó un preview seguro.";

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === novaId
              ? {
                  ...msg,
                  content,
                  streaming: false,
                  actions: draftActions,
                  meta: data && typeof data === "object" ? (data as Record<string, unknown>).meta as Record<string, unknown> : null,
                }
              : msg,
          ),
        );

        await loadRuntime();
        return;
      }

      const res = await fetch("/api/nova/chat/stream", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        signal: abortRef.current.signal,
        body: JSON.stringify({
          project_id: projectId,
          thread_id: threadId,
          message: prompt,
          mode: "auto",
          allow_actions: false,
          tools_requested: [],
          context_data: {
            source: "nova_chat_ux_12_7k_stream",
            expectation: "respuesta natural, clara, sin ejecutar tareas nuevas desde chat",
          },
        }),
      });

      if (!res.ok || !res.body) throw new Error(`Hablar con NOVA HTTP ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let received = false;
      let streamedActions: ChatActionDraft[] = [];

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";

        for (const raw of events) {
          const dataLine = raw.split("\n").find((line) => line.startsWith("data:"));
          if (!dataLine) continue;

          const rawData = dataLine.replace(/^data:\s*/, "");
          if (!rawData || rawData === "[DONE]") continue;

          let parsed: unknown = rawData;
          try { parsed = JSON.parse(rawData); } catch {}

          const nextLock = extractQueueLock(parsed);
          if (nextLock) setQueueLock(nextLock);

          const eventActions = extractActions(parsed);
          if (eventActions.length) streamedActions = eventActions;

          const maybeError = parsed && typeof parsed === "object" ? (parsed as { error?: unknown }).error : null;
          if (typeof maybeError === "string") {
            setError(maybeError);
            continue;
          }

          const piece = pickContent(parsed);
          if (!piece) continue;

          received = true;
          setMessages((prev) => prev.map((msg) => msg.id === novaId ? { ...msg, content: `${msg.content}${piece}`, streaming: true } : msg));
        }
      }

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === novaId
            ? {
                ...msg,
                content: msg.content || (received ? msg.content : "NOVA respondió sin texto visible."),
                streaming: false,
                actions: streamedActions,
              }
            : msg,
        ),
      );

      await loadRuntime();
    } catch (err) {
      const msg = err instanceof Error ? msgFromError(err) : "Fallo en Hablar con NOVA.";
      setError(msg);
      setMessages((prev) => prev.map((item) => item.id === novaId ? { ...item, role: "system", content: msg, streaming: false } : item));
    } finally {
      setIsSending(false);
    }
  }

  function msgFromError(err: Error) {
    if (err.name === "AbortError") return "Solicitud detenida.";
    return err.message || "Fallo en Hablar con NOVA.";
  }

  function stopCurrentRequest() {
    abortRef.current?.abort();
    setIsSending(false);
  }

  function applyCapability(capability: NativeCapability) {
    setInput(capability.prompt);
    setShowCapabilities(false);
  }

  async function mutateAction(action: RuntimeAction, mode: "approve" | "reject" | "execute") {
    setBusyAction(action.id);
    setError(null);

    try {
      const url = mode === "execute" ? "/api/agi/runtime/actions/execute" : "/api/agi/runtime/actions/decision";
      const body =
        mode === "execute"
          ? { project_id: projectId, action_id: action.id }
          : {
              project_id: projectId,
              action_id: action.id,
              decision: mode,
              note: mode === "approve" ? "Aprobado desde NOVA Chat UX." : "Rechazado desde NOVA Chat UX.",
            };

      const res = await fetch(url, {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = (await res.json().catch(() => ({}))) as MutateResponse;
      if (!res.ok || data.error) throw new Error(data.error || "No se pudo actualizar la acción.");

      setMessages((prev) => [
        ...prev,
        {
          id: id(),
          role: "system",
          content:
            data.message ||
            (mode === "execute"
              ? "Acción ejecutada por worker seguro."
              : mode === "approve"
                ? "Acción aprobada por Owner Gate."
                : "Acción descartada."),
          createdAt: Date.now(),
        },
      ]);

      await loadRuntime();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo actualizar la acción.");
    } finally {
      setBusyAction(null);
    }
  }

  function onComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void send();
    }
  }


  return (
    <div className="flex h-full min-h-[68dvh] flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-[#06152D]/80 shadow-2xl">
      <div className="border-b border-white/10 bg-[#06152D]/90 px-4 py-3 backdrop-blur-xl sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="relative grid h-10 w-10 shrink-0 place-items-center rounded-[1.15rem] border border-sky-300/25 bg-sky-300/10 text-sky-100 shadow-[0_0_32px_rgba(30,200,255,0.18)]">
              <Sparkles className="h-5 w-5" />
              <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-slate-950 bg-emerald-400" />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate text-base font-black text-white">NOVA</h2>
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.18em] ${effectiveLock.locked ? "border-amber-300/30 bg-amber-300/10 text-amber-100" : "border-emerald-300/30 bg-emerald-300/10 text-emerald-200"}`}>
                  {effectiveLock.locked ? "Acciones pendientes" : "Lista"}
                </span>
              </div>
              <p className="truncate text-xs text-slate-400">Chat privado · tu aprobación activa</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setShowSummary((value) => !value)} className="min-h-10 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-slate-100 hover:bg-white/10">
              <PanelRight className="mr-1.5 inline h-3.5 w-3.5" />
              Sistema
            </button>
            <button type="button" onClick={() => void loadRuntime()} className="grid min-h-10 min-w-10 place-items-center rounded-xl border border-white/10 bg-white/5 text-slate-100 hover:bg-white/10" aria-label="Actualizar estado">
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-400">
          <span className="rounded-full border border-white/10 bg-white/[0.035] px-3 py-1.5"><ShieldCheck className="mr-1 inline h-3.5 w-3.5 text-emerald-300" /> Sin ejecución oculta</span>
          <span className="rounded-full border border-white/10 bg-white/[0.035] px-3 py-1.5"><Activity className="mr-1 inline h-3.5 w-3.5 text-sky-300" /> {configured.length}/{integrations.length || summary?.counts?.tools_total || 0} conexiones</span>
          <span className="rounded-full border border-white/10 bg-white/[0.035] px-3 py-1.5"><Brain className="mr-1 inline h-3.5 w-3.5 text-amber-300" /> {blockingActions.length} pendientes</span>
        </div>
      </div>

      {showSummary ? (
        <aside className="border-b border-white/10 bg-slate-950/55 px-4 py-3 sm:px-5">
          <div className="grid gap-3 lg:grid-cols-[1fr_1fr]">
            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-sm font-black text-white">Sistema</p>
                <span className="text-[11px] text-slate-500">Proyecto privado</span>
              </div>
              <div className="grid gap-2 text-xs sm:grid-cols-2">
                <div className="rounded-xl bg-slate-950/45 p-3 text-slate-300">AGIs: <b className="text-white">{summary?.counts?.agents ?? "—"}</b></div>
                <div className="rounded-xl bg-slate-950/45 p-3 text-slate-300">Runs: <b className="text-white">{summary?.counts?.runs ?? "—"}</b></div>
                <div className="rounded-xl bg-slate-950/45 p-3 text-slate-300">Pendientes: <b className="text-white">{blockingActions.length}</b></div>
                <div className="rounded-xl bg-slate-950/45 p-3 text-slate-300">Parciales: <b className="text-white">{partial.length}</b></div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
              <p className="mb-3 text-sm font-black text-white">Conexiones</p>
              <div className="flex flex-wrap gap-2">
                {integrations.slice(0, 10).map((item) => (
                  <span key={item.tool_key} className={`rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] ${statusTone(item.status)}`}>
                    {item.name}
                  </span>
                ))}
                {integrations.length === 0 ? <span className="text-xs text-slate-500">Cargando estado real.</span> : null}
              </div>
            </div>
          </div>
        </aside>
      ) : null}

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-4 sm:px-5">
        {messages.length === 0 ? (
          <div className="mx-auto flex max-w-3xl flex-col items-center justify-center py-8 text-center sm:py-12">
            <div className="grid h-16 w-16 place-items-center rounded-[1.4rem] border border-sky-300/25 bg-sky-300/10 text-sky-100 shadow-[0_0_50px_rgba(30,200,255,0.18)]">
              <Bot className="h-8 w-8" />
            </div>
            <h3 className="mt-5 text-2xl font-black text-white">Lista para trabajar contigo.</h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              Pídele algo a NOVA. Si requiere tocar código, datos o integraciones, primero verás un preview claro y la acción esperará tu aprobación.
            </p>

            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {NATIVE_CAPABILITIES.slice(0, 6).map((capability) => (
                <button
                  key={capability.key}
                  type="button"
                  onClick={() => applyCapability(capability)}
                  className="min-h-10 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-bold text-slate-100 transition hover:border-sky-300/25 hover:bg-sky-300/10"
                >
                  {capability.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-5xl space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[92%] sm:max-w-[78%] ${msg.role === "user" ? "items-end" : "items-start"}`}>
                  <div className={`rounded-[1.4rem] border px-4 py-3 shadow-lg ${
                    msg.role === "user"
                      ? "border-sky-300/20 bg-sky-300/12 text-sky-50"
                      : msg.role === "system"
                        ? "border-amber-300/25 bg-amber-300/10 text-amber-50"
                        : "border-white/10 bg-white/[0.055] text-slate-100"
                  }`}>
                    <div className="mb-2 flex items-center gap-2">
                      {msg.role === "user" ? <Zap className="h-3.5 w-3.5 text-sky-200" /> : msg.role === "system" ? <CircleAlert className="h-3.5 w-3.5 text-amber-200" /> : <Sparkles className="h-3.5 w-3.5 text-sky-200" />}
                      <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                        {msg.role === "user" ? "Tú" : msg.role === "system" ? "Sistema" : "NOVA"}
                      </span>
                      {msg.streaming ? <Loader2 className="h-3.5 w-3.5 animate-spin text-sky-200" /> : null}
                    </div>
                    <p className="whitespace-pre-wrap text-sm leading-6">{msg.content || (msg.streaming ? "Pensando…" : "")}</p>
                  </div>

                  {msg.actions?.map((draft, index) => (
                    <DraftCard key={`${msg.id}-draft-${index}`} draft={draft} onShowSummary={() => setShowSummary(true)} onCancel={() => setMessages((prev) => prev.filter((m) => m.actions?.[0] !== draft))} />
                  ))}
                </div>
              </div>
            ))}

            {productionAction ? (
              <RuntimeActionCard action={productionAction} busyAction={busyAction} onShowSummary={() => setShowSummary(true)} onMutate={mutateAction} />
            ) : null}
          </div>
        )}
      </div>

      {blockingActions.length > 0 ? (
        <div className="border-t border-white/10 bg-slate-950/50 px-4 py-3 sm:px-5">
          <div className="mx-auto max-w-5xl space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-100">
              <LockKeyhole className="h-4 w-4" />
              Hay tareas esperando tu aprobación. NOVA guía un paso a la vez.
            </div>
            <div className="grid gap-3">
              {guidedGitHubChain ? <GuidedGitHubChainCard chain={guidedGitHubChain} busyAction={busyAction} onShowSummary={() => setShowSummary(true)} onMutate={mutateAction} /> : null}

              {standaloneBlockingActions.slice(0, guidedGitHubChain ? 1 : 2).map((action) => (
                <RuntimeActionCard key={action.id} action={action} busyAction={busyAction} onShowSummary={() => setShowSummary(true)} onMutate={mutateAction} />
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {latestDraft ? (
        <div className="border-t border-white/10 bg-sky-300/[0.035] px-4 py-2 text-center text-xs text-sky-100">
          Preview seguro: {formatScope(latestDraft.scope)} · sin ejecutar nada.
        </div>
      ) : null}

      {error ? (
        <div className="border-t border-rose-300/20 bg-rose-300/10 px-4 py-3 text-sm text-rose-100">
          <XCircle className="mr-2 inline h-4 w-4" />
          {error}
        </div>
      ) : null}

      <form onSubmit={(event) => void send(event)} className="border-t border-white/10 bg-[#06152D]/95 p-3 pb-[calc(env(safe-area-inset-bottom)+1rem)] backdrop-blur-xl sm:p-4">
        {showCapabilities ? (
          <div className="mb-3 rounded-[1.35rem] border border-white/10 bg-white/[0.04] p-3 shadow-[0_18px_60px_rgba(0,0,0,0.18)]">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-xs font-black text-white">Herramientas</p>
              <span className="text-[11px] text-slate-500">Se activan cuando aplique</span>
            </div>
            <div className="grid gap-3 lg:grid-cols-3">
              {CAPABILITY_GROUPS.map((group) => (
                <div key={group.title} className="rounded-2xl border border-white/10 bg-slate-950/35 p-3">
                  <p className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">{group.title}</p>
                  <div className="flex flex-wrap gap-2">
                    {group.keys.map((key) => {
                      const capability = NATIVE_CAPABILITIES.find((item) => item.key === key);
                      if (!capability) return null;
                      return (
                        <button
                          key={capability.key}
                          type="button"
                          onClick={() => applyCapability(capability)}
                          title={capability.detail}
                          className="min-h-10 rounded-xl border border-white/10 bg-white/[0.045] px-3 py-2 text-left text-xs font-bold text-slate-200 hover:border-sky-300/25 hover:bg-sky-300/10"
                        >
                          <span className="mr-1.5 inline-flex align-middle text-sky-200">{capabilityIcon(capability.key)}</span>
                          {capability.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mx-auto flex max-w-5xl items-end gap-2 rounded-[1.4rem] border border-white/10 bg-white/[0.045] p-2 shadow-[0_18px_60px_rgba(0,0,0,0.25)]">
          <button type="button" onClick={() => setShowCapabilities((value) => !value)} className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10" aria-label="Abrir herramientas">
            <Plus className="h-5 w-5" />
          </button>

          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={onComposerKeyDown}
            rows={1}
            placeholder="Pídele algo a NOVA…"
            className="max-h-40 min-h-[44px] flex-1 resize-none bg-transparent px-2 py-3 text-sm text-white outline-none placeholder:text-slate-500"
          />

          {isSending ? (
            <button type="button" onClick={stopCurrentRequest} className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-amber-300/20 bg-amber-300/10 text-amber-100 hover:bg-amber-300/15" aria-label="Detener">
              <Square className="h-4 w-4" />
            </button>
          ) : null}

          <button
            type="submit"
            disabled={!input.trim() || isSending}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-sky-300 text-slate-950 shadow-[0_0_24px_rgba(56,189,248,0.25)] hover:bg-sky-200 disabled:cursor-not-allowed disabled:opacity-45"
            aria-label="Enviar"
          >
            {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </button>
        </div>

        <div className="mx-auto mt-2 flex max-w-5xl flex-wrap items-center justify-between gap-2 px-1 text-[11px] text-slate-500">
          <span>NOVA entiende lenguaje natural.</span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />
            Sin ejecución oculta · tu aprobación activa
          </span>
        </div>
      </form>
    </div>
  );
}
