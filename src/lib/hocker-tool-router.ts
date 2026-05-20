import { getHockerCapabilitiesContract, type HockerCapability, type HockerCapabilitiesContract } from "@/lib/hocker-capabilities-contract";

export type HockerToolRouteDecision = {
  ok: true;
  message: string;
  capability_key: string;
  capability_label: string;
  owner_agi: string;
  support_agis: string[];
  status: string;
  mode: string;
  requires_owner_gate: boolean;
  can_execute_now: boolean;
  should_show_final_buttons: boolean;
  final_buttons: string[];
  reason: string;
  next_step: string;
};

const ROUTES: Array<{ key: string; patterns: RegExp[]; reason: string }> = [
  { key: "image_generation", reason: "La solicitud pide imagen/visual creativo.", patterns: [/imagen|foto|visual|diseño|diseño|logo|wallpaper|fondo/i] },
  { key: "video_generation", reason: "La solicitud pide video, avatar, reels o producción audiovisual.", patterns: [/video|avatar|heygen|reel|storyboard|guion audiovisual/i] },
  { key: "document_generation", reason: "La solicitud pide documento, PDF, contrato, ficha o reporte.", patterns: [/documento|pdf|docx|reporte|ficha|contrato|manual/i] },
  { key: "presentation_generation", reason: "La solicitud pide presentación o slides.", patterns: [/presentaci[oó]n|slides|pptx|deck|diapositivas/i] },
  { key: "file_import_analysis", reason: "La solicitud pide importar o analizar archivos.", patterns: [/archivo|subir|importar|csv|zip|excel|xlsx|doc|pdf/i] },
  { key: "repo_code_github", reason: "La solicitud involucra repositorios, código, GitHub, PR o deploy.", patterns: [/repo|repositorio|github|c[oó]digo|commit|branch|rama|pull request|pr|deploy|build|typecheck/i] },
  { key: "deep_research", reason: "La solicitud pide investigación, comparación o análisis profundo.", patterns: [/investiga|investigaci[oó]n|compara|benchmark|fuentes|citas|topolog[ií]a|auditor[ií]a/i] },
  { key: "supabase_memory_data", reason: "La solicitud trata datos, Supabase, memoria o Syntia.", patterns: [/supabase|datos|tabla|memoria|syntia|sql|base de datos/i] },
  { key: "ads_campaigns", reason: "La solicitud trata campañas, ads, funnel, leads o marketing.", patterns: [/ads|campaña|campana|meta|tiktok|google ads|linkedin|lead|funnel|crm/i] },
  { key: "chido_monitoring", reason: "La solicitud trata Chido Casino en modo monitoreo/estado.", patterns: [/chido|casino|wallet|kyc|retiro|dep[oó]sito|apuesta/i] },
  { key: "payments_wallet", reason: "La solicitud trata pagos, wallet, retiro o pasarela.", patterns: [/stripe|paypal|d24|pago|wallet|retiro|pasarela|spei/i] },
  { key: "domains_cloud_ops", reason: "La solicitud trata dominios, DNS, Cloudflare, Hetzner o Vercel.", patterns: [/dominio|dns|cloudflare|namecheap|hetzner|vercel|railway|cloud/i] },
  { key: "hocker_node_agent", reason: "La solicitud trata nodo local, agente, shell o ejecución local.", patterns: [/hocker-node|agente local|node agent|shell|termux|ubuntu|comando/i] },
  { key: "email_notifications", reason: "La solicitud trata emails, notificaciones o mensajes transaccionales.", patterns: [/email|correo|notificaci[oó]n|resend|smtp/i] },
];

function findCapability(contract: HockerCapabilitiesContract, key: string): HockerCapability | undefined {
  return contract.capabilities.find((item) => item.key === key);
}

function fallbackCapability(contract: HockerCapabilitiesContract): HockerCapability {
  return findCapability(contract, "nova_native_chat") ?? contract.capabilities[0];
}

export function routeHockerCapabilityRequest(message: string, contract = getHockerCapabilitiesContract()): HockerToolRouteDecision {
  const clean = String(message || "").trim();

  const matched = ROUTES.find((route) => route.patterns.some((pattern) => pattern.test(clean)));
  const capability = matched ? findCapability(contract, matched.key) ?? fallbackCapability(contract) : fallbackCapability(contract);

  const shouldShowFinalButtons =
    capability.requires_owner_gate &&
    capability.status !== "pending" &&
    capability.status !== "blocked" &&
    capability.mode === "owner_gate";

  return {
    ok: true,
    message: clean,
    capability_key: capability.key,
    capability_label: capability.label,
    owner_agi: capability.owner_agi,
    support_agis: capability.support_agis,
    status: capability.status,
    mode: capability.mode,
    requires_owner_gate: capability.requires_owner_gate,
    can_execute_now: capability.can_execute_now,
    should_show_final_buttons: shouldShowFinalButtons,
    final_buttons: shouldShowFinalButtons ? capability.final_buttons : [],
    reason: matched?.reason ?? "Solicitud general: NOVA responde y decide si necesita delegar internamente.",
    next_step: capability.next_step,
  };
}
