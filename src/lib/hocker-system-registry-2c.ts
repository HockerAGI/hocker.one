export type HockerSystemKind =
  | "app"
  | "repo"
  | "service"
  | "integration"
  | "protected-module";

export type HockerSystemStatus =
  | "live"
  | "ready"
  | "protected"
  | "building"
  | "blocked";

export type HockerSystemRegistryItem = {
  id: string;
  name: string;
  kind: HockerSystemKind;
  status: HockerSystemStatus;
  visibleName: string;
  purpose: string;
  owner: string;
  protected: boolean;
};

export const HOCKER_SYSTEM_REGISTRY_2C: HockerSystemRegistryItem[] = [
  {
    id: "hocker-one",
    name: "Hocker ONE",
    kind: "app",
    status: "live",
    visibleName: "Centro de mando",
    purpose: "Sistema operativo conversacional para operar HOCKER desde NOVA.",
    owner: "NOVA + Syntia + Vertx",
    protected: false,
  },
  {
    id: "nova-agi",
    name: "nova.agi",
    kind: "repo",
    status: "live",
    visibleName: "Motor NOVA",
    purpose: "Runtime y orquestación de NOVA.",
    owner: "NOVA + Hostia",
    protected: true,
  },
  {
    id: "hocker-ads",
    name: "Hocker Ads",
    kind: "app",
    status: "building",
    visibleName: "Publicidad IA",
    purpose: "Campañas, creatividad, automatización y reportes.",
    owner: "Nova Ads + Candy Ads + PRO IA + Revia",
    protected: false,
  },
  {
    id: "hocker-hub",
    name: "Hocker Hub",
    kind: "app",
    status: "building",
    visibleName: "CRM inteligente",
    purpose: "Clientes, leads, ventas, soporte y seguimiento.",
    owner: "NOVA + Revia + Numia",
    protected: false,
  },
  {
    id: "hocker-drive",
    name: "Hocker Drive Cloud",
    kind: "app",
    status: "building",
    visibleName: "Archivos inteligentes",
    purpose: "Archivos, memoria, respaldo, búsqueda y evidencia.",
    owner: "Syntia + Hostia",
    protected: false,
  },
  {
    id: "hocker-wallet",
    name: "Hocker Wallet",
    kind: "protected-module",
    status: "blocked",
    visibleName: "Finanzas protegidas",
    purpose: "Wallet, pagos, presupuestos y facturación bajo compliance.",
    owner: "Numia + Jurix + Vertx",
    protected: true,
  },
  {
    id: "chido-casino",
    name: "Chido Casino",
    kind: "protected-module",
    status: "protected",
    visibleName: "Chido",
    purpose: "Gaming protegido, métricas, operación y responsabilidad.",
    owner: "Chido Wins + Chido Gerente + Jurix + Numia",
    protected: true,
  },
  {
    id: "trackhok",
    name: "TrackHok",
    kind: "protected-module",
    status: "protected",
    visibleName: "Monitoreo",
    purpose: "Rastreo, logística, alertas y reportes con permisos claros.",
    owner: "TrackHok AGI + Vertx",
    protected: true,
  },
  {
    id: "nexpa",
    name: "NEXPA",
    kind: "protected-module",
    status: "protected",
    visibleName: "Protección",
    purpose: "Seguridad familiar/operativa con consentimiento y auditoría.",
    owner: "NEXPA AGI + Vertx + Jurix",
    protected: true,
  },
  {
    id: "hocker-up",
    name: "Hocker Up",
    kind: "app",
    status: "building",
    visibleName: "Learning y comunidad",
    purpose: "Aprendizaje, comunidad, mentoría y progreso.",
    owner: "Syntia + Candy Ads + Revia",
    protected: false,
  },
  {
    id: "github",
    name: "GitHub",
    kind: "integration",
    status: "live",
    visibleName: "Código",
    purpose: "Cambios de código controlados con rama, PR y evidencia.",
    owner: "Hostia + Vertx",
    protected: true,
  },
  {
    id: "supabase",
    name: "Supabase",
    kind: "integration",
    status: "ready",
    visibleName: "Datos",
    purpose: "Base de datos, memoria, cola, auditoría y estados.",
    owner: "Syntia + Vertx",
    protected: true,
  },
  {
    id: "vercel",
    name: "Vercel",
    kind: "integration",
    status: "building",
    visibleName: "Deployments",
    purpose: "Publicación, logs y estado de despliegues.",
    owner: "Hostia",
    protected: true,
  },
  {
    id: "ads-apis",
    name: "Ads APIs",
    kind: "integration",
    status: "blocked",
    visibleName: "Publicidad",
    purpose: "Meta, Google, TikTok y LinkedIn Ads cuando existan permisos reales.",
    owner: "Nova Ads + Revia",
    protected: true,
  },
  {
    id: "payments",
    name: "Payments",
    kind: "integration",
    status: "blocked",
    visibleName: "Pagos",
    purpose: "Stripe, PayPal y pagos sólo bajo compliance.",
    owner: "Numia + Jurix",
    protected: true,
  },
];

export const HOCKER_SYSTEM_REGISTRY_2C_VERSION = "13-2C-A";

export function getHockerSystemById(id: string) {
  return HOCKER_SYSTEM_REGISTRY_2C.find((system) => system.id === id) ?? null;
}

export function getProtectedHockerSystems() {
  return HOCKER_SYSTEM_REGISTRY_2C.filter((system) => system.protected);
}

