export const AGI_RESEARCH_GATE_VERSION = "agi-research-gate-v1.0.0";

export type AgiResearchSource = {
  id: string;
  title: string;
  authority: string;
  url: string;
  appliesTo: string[];
  gateRule: string;
};

export type AgiResearchRule = {
  id: string;
  label: string;
  appliesTo: string[];
  guardianAgis: string[];
  requiredEvidence: string[];
  blockedUntilSatisfied: boolean;
};

export const AGI_RESEARCH_GATE_SOURCES: AgiResearchSource[] = [
  {
    id: "next-route-handlers",
    title: "Next.js Route Handlers",
    authority: "Next.js",
    url: "https://nextjs.org/docs/app/getting-started/route-handlers",
    appliesTo: ["hostia", "vertx", "nova"],
    gateRule: "Endpoints nuevos deben usar Route Handlers server-side y validar método, entrada, salida y modo dinámico cuando dependen de datos vivos.",
  },
  {
    id: "supabase-rls",
    title: "Supabase Row Level Security",
    authority: "Supabase",
    url: "https://supabase.com/docs/guides/database/postgres/row-level-security",
    appliesTo: ["vertx", "hostia", "jurix", "nova"],
    gateRule: "Toda tabla expuesta debe tener RLS evaluado; service_role solo en backend seguro.",
  },
  {
    id: "supabase-api-keys",
    title: "Supabase API Keys",
    authority: "Supabase",
    url: "https://supabase.com/docs/guides/api/api-keys",
    appliesTo: ["vertx", "hostia", "numia"],
    gateRule: "service_role y secret keys nunca deben llegar al cliente, navegador, URL, logs públicos ni bundle.",
  },
  {
    id: "vercel-env",
    title: "Vercel Environment Variables",
    authority: "Vercel",
    url: "https://vercel.com/docs/environment-variables",
    appliesTo: ["hostia", "vertx"],
    gateRule: "Todo cambio de variables requiere nuevo deployment para aplicar en producción.",
  },
  {
    id: "owasp-api-top10-2023",
    title: "OWASP API Security Top 10 2023",
    authority: "OWASP",
    url: "https://owasp.org/API-Security/editions/2023/en/0x11-t10/",
    appliesTo: ["vertx", "jurix", "numia", "hostia", "nova"],
    gateRule: "Flujos sensibles deben controlar autorización por objeto, función, propiedad, autenticación y abuso de flujos de negocio.",
  },
  {
    id: "nist-sp-800-63-4",
    title: "NIST SP 800-63-4 Digital Identity Guidelines",
    authority: "NIST",
    url: "https://www.nist.gov/publications/nist-sp-800-63-4-digital-identity-guidelines",
    appliesTo: ["jurix", "vertx", "chido_gerente"],
    gateRule: "KYC, identidad y autenticación deben tratarse como procesos de assurance, proofing, privacidad y riesgo.",
  },
  {
    id: "segob-juegos-sorteos",
    title: "Dirección General de Juegos y Sorteos",
    authority: "SEGOB",
    url: "https://juegosysorteos.segob.gob.mx/es/Juegos_y_Sorteos/Prohibiciones",
    appliesTo: ["jurix", "chido_gerente", "nova"],
    gateRule: "Operación de juegos con apuesta o sorteos exige revisión legal y permiso aplicable antes de ejecución real.",
  },
  {
    id: "sat-actividades-vulnerables",
    title: "SAT Actividades Vulnerables",
    authority: "SAT",
    url: "https://www.sat.gob.mx/minisitio/ActividadesVulnerables/index.html",
    appliesTo: ["jurix", "numia", "chido_gerente", "nova"],
    gateRule: "Juegos con apuesta, concursos o sorteos pueden implicar obligaciones PLD/AML, alta, identificación, avisos e informes.",
  },
];

export const AGI_RESEARCH_GATE_RULES: AgiResearchRule[] = [
  {
    id: "official_sources_required",
    label: "Fuentes oficiales obligatorias",
    appliesTo: ["all"],
    guardianAgis: ["syntia", "jurix", "vertx"],
    requiredEvidence: ["official_url", "date_checked", "source_summary", "decision"],
    blockedUntilSatisfied: true,
  },
  {
    id: "sensitive_actions_dry_run_only",
    label: "Acciones sensibles solo dry-run hasta aprobación",
    appliesTo: ["approve_kyc", "confirm_deposit", "reject_deposit", "pay_withdrawal", "modify_balance"],
    guardianAgis: ["jurix", "vertx", "numia", "chido_gerente"],
    requiredEvidence: ["research_gate", "audit_log", "explicit_approval", "hmac_signature"],
    blockedUntilSatisfied: true,
  },
  {
    id: "no_bet_execution",
    label: "Apuestas reales bloqueadas",
    appliesTo: ["execute_bet"],
    guardianAgis: ["jurix", "vertx", "chido_wins", "nova"],
    requiredEvidence: ["legal_authorization", "risk_review", "business_approval"],
    blockedUntilSatisfied: true,
  },
  {
    id: "server_side_secrets_only",
    label: "Secretos solo server-side",
    appliesTo: ["supabase_service_role", "hmac_secret", "payment_keys"],
    guardianAgis: ["vertx", "hostia"],
    requiredEvidence: ["server_only_usage", "no_client_exposure", "deployment_validation"],
    blockedUntilSatisfied: true,
  },
];

export const CHIDO_RESEARCH_GATE_MATRIX = [
  {
    area: "KYC",
    actions: ["approve_kyc"],
    guardianAgis: ["jurix", "vertx", "chido_gerente"],
    requiredSources: ["nist-sp-800-63-4", "owasp-api-top10-2023"],
    status: "dry_run_only",
  },
  {
    area: "Dinero",
    actions: ["confirm_deposit", "reject_deposit", "pay_withdrawal", "modify_balance"],
    guardianAgis: ["numia", "vertx", "jurix", "chido_gerente"],
    requiredSources: ["sat-actividades-vulnerables", "owasp-api-top10-2023", "supabase-rls"],
    status: "dry_run_only",
  },
  {
    area: "Apuestas",
    actions: ["execute_bet"],
    guardianAgis: ["jurix", "vertx", "chido_wins", "nova"],
    requiredSources: ["segob-juegos-sorteos", "sat-actividades-vulnerables"],
    status: "blocked",
  },
  {
    area: "Infraestructura",
    actions: ["deploy", "env_change", "endpoint_change"],
    guardianAgis: ["hostia", "vertx"],
    requiredSources: ["next-route-handlers", "vercel-env", "supabase-api-keys"],
    status: "controlled",
  },
] as const;
