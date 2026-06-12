export type HockerCommandStatus =
  | "live"
  | "ready"
  | "protected"
  | "building"
  | "blocked";

export type HockerCommandItem = {
  id: string;
  name: string;
  label: string;
  status: HockerCommandStatus;
  owner: string;
  short: string;
  next: string;
};

export const HOCKER_COMMAND_CENTER_APPS: HockerCommandItem[] = [
  {
    id: "hocker-one",
    name: "Hocker ONE",
    label: "Centro de mando",
    status: "live",
    owner: "NOVA + Syntia + Vertx",
    short: "Panel principal para operar, revisar y aprobar acciones.",
    next: "Mantener como consola única de operación.",
  },
  {
    id: "hocker-ads",
    name: "Hocker Ads",
    label: "Publicidad IA",
    status: "building",
    owner: "Nova Ads + Candy Ads + PRO IA",
    short: "Campañas, contenido, reportes y automatización comercial.",
    next: "Separar funciones reales, pendientes y simuladas.",
  },
  {
    id: "chido-casino",
    name: "Chido Casino",
    label: "Gaming responsable",
    status: "protected",
    owner: "Chido Wins + Chido Gerente + Jurix",
    short: "Área sensible. Sólo lectura, simulación y aprobación controlada.",
    next: "Mantener bloqueo para acciones reales sensibles.",
  },
  {
    id: "hocker-wallet",
    name: "Hocker Wallet",
    label: "Finanzas",
    status: "blocked",
    owner: "Numia + Jurix",
    short: "Pagos, wallet y saldos. No se activa sin compliance real.",
    next: "Diseñar primero modo auditoría sin mover dinero.",
  },
  {
    id: "nexpa",
    name: "NEXPA",
    label: "Seguridad",
    status: "building",
    owner: "NEXPA + Vertx",
    short: "Supervisión y seguridad. Debe operar con reglas éticas claras.",
    next: "Convertir en módulo de protección y alertas.",
  },
  {
    id: "hocker-hub",
    name: "Hocker Hub",
    label: "CRM IA",
    status: "building",
    owner: "NOVA + Numia",
    short: "Clientes, leads, propuestas y seguimiento comercial.",
    next: "Crear vista de clientes y oportunidades.",
  },
  {
    id: "hocker-drive",
    name: "Hocker Drive Cloud",
    label: "Nube IA",
    status: "building",
    owner: "Syntia + Vertx",
    short: "Archivos, memoria, respaldo y evidencia.",
    next: "Conectar carga segura de archivos.",
  },
  {
    id: "hocker-up",
    name: "Hocker Up",
    label: "Learning / Social",
    status: "building",
    owner: "Candy Ads + Syntia",
    short: "Aprendizaje, comunidad y contenido.",
    next: "Definir primera versión educativa.",
  },
];

export const HOCKER_COMMAND_CENTER_AGIS: HockerCommandItem[] = [
  {
    id: "nova",
    name: "NOVA",
    label: "Núcleo central",
    status: "live",
    owner: "Armando / Owner Gate",
    short: "Coordina el ecosistema, responde, propone y prepara acciones.",
    next: "Convertir el chat en consola de mando completa.",
  },
  {
    id: "syntia",
    name: "Syntia",
    label: "Memoria y sincronía",
    status: "ready",
    owner: "NOVA",
    short: "Ordena contexto, memoria, evidencia y continuidad.",
    next: "Activar revisión automática de memoria.",
  },
  {
    id: "vertx",
    name: "Vertx",
    label: "Seguridad",
    status: "ready",
    owner: "NOVA",
    short: "Cuida accesos, riesgos, integridad y bloqueos.",
    next: "Crear alertas claras sin ruido técnico.",
  },
  {
    id: "jurix",
    name: "Jurix",
    label: "Legal",
    status: "building",
    owner: "NOVA",
    short: "Revisa riesgos legales, privacidad y cumplimiento.",
    next: "Pasar acciones sensibles por revisión.",
  },
  {
    id: "numia",
    name: "Numia",
    label: "Finanzas",
    status: "building",
    owner: "NOVA",
    short: "ROI, costos, pagos y control financiero.",
    next: "Primero modo lectura, después ejecución.",
  },
  {
    id: "hostia",
    name: "Hostia",
    label: "Infraestructura",
    status: "building",
    owner: "Vertx",
    short: "Dominios, servidores, APIs y despliegues.",
    next: "Conectar diagnósticos reales de Vercel/GitHub.",
  },
  {
    id: "nova-ads",
    name: "Nova Ads",
    label: "Campañas",
    status: "building",
    owner: "NOVA",
    short: "Estrategia, campañas, segmentación y reportes.",
    next: "No activar Ads reales sin APIs listas.",
  },
  {
    id: "candy-ads",
    name: "Candy Ads",
    label: "Diseño",
    status: "building",
    owner: "NOVA",
    short: "Visuales, estilo, creatividad y contenido emocional.",
    next: "Conectar generación de assets real.",
  },
  {
    id: "pro-ia",
    name: "PRO IA",
    label: "Video",
    status: "building",
    owner: "NOVA",
    short: "Edición, voz, reels, motion y piezas premium.",
    next: "Conectar proveedor de video real.",
  },
];

export const HOCKER_COMMAND_CENTER_INTEGRATIONS: HockerCommandItem[] = [
  {
    id: "github",
    name: "GitHub",
    label: "Código",
    status: "live",
    owner: "NOVA + Owner Gate",
    short: "Puede crear branch, archivo y PR con aprobación.",
    next: "Mantener ejecución real sólo con aprobación.",
  },
  {
    id: "supabase",
    name: "Supabase",
    label: "Datos",
    status: "ready",
    owner: "Syntia + Vertx",
    short: "Base de datos, memoria, cola y auditoría.",
    next: "No escribir sin gate.",
  },
  {
    id: "vercel",
    name: "Vercel",
    label: "Deploy",
    status: "building",
    owner: "Hostia",
    short: "Debe mostrar deploys, errores y estado.",
    next: "Crear diagnóstico real de despliegues.",
  },
  {
    id: "cloudflare",
    name: "Cloudflare",
    label: "DNS / seguridad",
    status: "building",
    owner: "Hostia + Vertx",
    short: "DNS, WAF, caché y dominios.",
    next: "Sólo lectura primero.",
  },
  {
    id: "ads",
    name: "Ads APIs",
    label: "Publicidad",
    status: "blocked",
    owner: "Nova Ads",
    short: "Meta, Google, TikTok y LinkedIn. No ejecutar todavía.",
    next: "Crear conexión read-only antes de campañas.",
  },
  {
    id: "payments",
    name: "Pagos",
    label: "Finanzas",
    status: "blocked",
    owner: "Numia + Jurix",
    short: "Stripe, PayPal y wallet quedan bloqueados.",
    next: "Activar sólo con compliance y pruebas.",
  },
];

export const HOCKER_COMMAND_CENTER_TASKS: HockerCommandItem[] = [
  {
    id: "fix-context",
    name: "Actualizar contexto",
    label: "Prioridad",
    status: "ready",
    owner: "NOVA",
    short: "NOVA debe saber que 12.7Z-1G ya cerró.",
    next: "Aplicar en 13-FIX-A2.",
  },
  {
    id: "stream-auth",
    name: "Blindar chat stream",
    label: "Seguridad",
    status: "ready",
    owner: "Vertx",
    short: "El stream debe usar la misma protección que el chat normal.",
    next: "Aplicar en 13-FIX-A2.",
  },
  {
    id: "bottom-dock",
    name: "Corregir navegación móvil",
    label: "Diseño",
    status: "ready",
    owner: "Candy Ads",
    short: "El dock inferior debe verse sólo en móvil.",
    next: "Aplicar ahora si el componente existe.",
  },
  {
    id: "read-only-system",
    name: "Diagnósticos limpios",
    label: "Sistema",
    status: "ready",
    owner: "Vertx",
    short: "Los chequeos deben leer por defecto, no generar ruido.",
    next: "Aplicar en 13-FIX-A2.",
  },
];
