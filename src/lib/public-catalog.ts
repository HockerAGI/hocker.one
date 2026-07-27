export type PublicAssetRefs = {
  logo: string;
  icon: string;
  cover: string;
};

export type PublicApp = {
  slug: string;
  title: string;
  tagline: string;
  summary: string;
  audience: string;
  integration: string;
  benefits: string[];
  accent: "cyan" | "rose" | "violet" | "emerald" | "amber" | "sky";
  featured?: boolean;
  asset: PublicAssetRefs;
};

export type PublicAgi = {
  slug: string;
  title: string;
  role: string;
  summary: string;
  impact: string;
  cluster: "core" | "creative" | "operations" | "support";
  partnerApps: string[];
  accent: "cyan" | "rose" | "violet" | "emerald" | "amber" | "sky";
  asset: PublicAssetRefs;
};

export const PUBLIC_APPS: PublicApp[] = [
  {
    slug: "hocker-one",
    title: "Hocker ONE",
    tagline: "Centro de mando del ecosistema.",
    summary:
      "El panel principal para ver estado, coordinar módulos y tomar decisiones con claridad.",
    audience: "Dirección, operación y control interno.",
    integration: "NOVA + Syntia + Vertx",
    benefits: ["Estado en vivo", "Aprobaciones", "Evidencia", "Nodos y comandos"],
    accent: "cyan",
    featured: true,
    asset: {
      logo: "/ecosystem/apps/hocker-one/logo.png",
      icon: "/ecosystem/apps/hocker-one/icon.png",
      cover: "/ecosystem/apps/hocker-one/cover.png",
    },
  },
  {
    slug: "hocker-ads",
    title: "Hocker Ads",
    tagline: "Marketing que vende con más precisión.",
    summary:
      "Campañas, contenido y branding con una capa de IA pensada para crecimiento real.",
    audience: "Marcas, negocios y lanzamientos.",
    integration: "Nova Ads + Candy Ads + PRO IA",
    benefits: ["Meta Ads", "TikTok Ads", "Copy y creativos", "Optimización"],
    accent: "rose",
    asset: {
      logo: "/ecosystem/apps/hocker-ads/logo.png",
      icon: "/ecosystem/apps/hocker-ads/icon.png",
      cover: "/ecosystem/apps/hocker-ads/cover.png",
    },
  },
  {
    slug: "hocker-hub",
    title: "Hocker Hub",
    tagline: "CRM inteligente para cerrar mejor.",
    summary:
      "Captura, seguimiento y atención comercial en una vista clara y fácil de operar.",
    audience: "Equipos de ventas y soporte.",
    integration: "Revia + Numia + Syntia",
    benefits: ["CRM", "Pipeline", "Seguimiento", "Atención"],
    accent: "violet",
    asset: {
      logo: "/ecosystem/apps/hocker-hub/logo.png",
      icon: "/ecosystem/apps/hocker-hub/icon.png",
      cover: "/ecosystem/apps/hocker-hub/cover.png",
    },
  },
  {
    slug: "hocker-wallet",
    title: "Hocker Wallet",
    tagline: "Pagos y control financiero del ecosistema.",
    summary:
      "Una capa financiera pensada para operar con trazabilidad, orden y cumplimiento.",
    audience: "Operación financiera y administración.",
    integration: "Numia + Jurix + Vertx",
    benefits: ["Pagos", "Control", "Trazabilidad", "Cumplimiento"],
    accent: "emerald",
    asset: {
      logo: "/ecosystem/apps/hocker-wallet/logo.png",
      icon: "/ecosystem/apps/hocker-wallet/icon.png",
      cover: "/ecosystem/apps/hocker-wallet/cover.png",
    },
  },
  {
    slug: "hocker-drive-cloud",
    title: "Hocker Drive Cloud",
    tagline: "Nube privada para archivos y respaldo.",
    summary:
      "Espacio seguro para organizar, sincronizar y respaldar información crítica.",
    audience: "Equipos, proyectos y archivos sensibles.",
    integration: "Syntia + Vertx",
    benefits: ["Nube privada", "Respaldo", "Sincronización", "Orden"],
    accent: "sky",
    asset: {
      logo: "/ecosystem/apps/hocker-drive-cloud/logo.png",
      icon: "/ecosystem/apps/hocker-drive-cloud/icon.png",
      cover: "/ecosystem/apps/hocker-drive-cloud/cover.png",
    },
  },
  {
    slug: "hocker-supply",
    title: "Hocker Supply",
    tagline: "Operación, pedidos y abastecimiento.",
    summary:
      "Control de inventario, flujo de pedidos y trazabilidad para operación ordenada.",
    audience: "Compras, inventario y administración.",
    integration: "Numia + Hostia + Vertx",
    benefits: ["Pedidos", "Inventario", "Trazabilidad", "Operación"],
    accent: "amber",
    asset: {
      logo: "/ecosystem/apps/hocker-supply/logo.png",
      icon: "/ecosystem/apps/hocker-supply/icon.png",
      cover: "/ecosystem/apps/hocker-supply/cover.png",
    },
  },
  {
    slug: "trackhok",
    title: "Trackhok",
    tagline: "Seguimiento y monitoreo con visibilidad.",
    summary:
      "Rastreo autorizado para estado, ubicación y alertas operativas cuando hacen falta.",
    audience: "Operación, logística y control.",
    integration: "Trackhok + Vertx",
    benefits: ["Rastreo", "Alertas", "Visibilidad", "Monitoreo"],
    accent: "sky",
    asset: {
      logo: "/ecosystem/apps/trackhok/logo.png",
      icon: "/ecosystem/apps/trackhok/icon.png",
      cover: "/ecosystem/apps/trackhok/cover.png",
    },
  },
  {
    slug: "nexpa-app",
    title: "NEXPA App",
    tagline: "Seguridad y bienestar digital.",
    summary:
      "Protección y control pensado para acompañar dispositivos, familias y entornos digitales.",
    audience: "Seguridad personal y familiar.",
    integration: "NEXPA + Jurix",
    benefits: ["Protección", "Control", "Supervisión", "Privacidad"],
    accent: "violet",
    asset: {
      logo: "/ecosystem/apps/nexpa-app/logo.png",
      icon: "/ecosystem/apps/nexpa-app/icon.png",
      cover: "/ecosystem/apps/nexpa-app/cover.png",
    },
  },
  {
    slug: "hocker-up",
    title: "Hocker Up",
    tagline: "Aprendizaje y comunidad con marca propia.",
    summary:
      "Espacio para formación, contenido y comunidad con una capa visual consistente.",
    audience: "Estudiantes, creadores y marcas.",
    integration: "Syntia + Candy Ads",
    benefits: ["Aprendizaje", "Comunidad", "Contenido", "Crecimiento"],
    accent: "cyan",
    asset: {
      logo: "/ecosystem/apps/hocker-up/logo.png",
      icon: "/ecosystem/apps/hocker-up/icon.png",
      cover: "/ecosystem/apps/hocker-up/cover.png",
    },
  },
  {
    slug: "chido-casino",
    title: "Chido Casino",
    tagline: "Experiencia digital protegida y responsable.",
    summary:
      "Una ruta sensible del ecosistema, presentada con control, claridad y juego responsable +18.",
    audience: "Usuarios adultos y operación protegida.",
    integration: "Chido Wins + Chido Gerente + Curvewind",
    benefits: ["Acceso protegido", "Control", "Responsable +18", "Operación"],
    accent: "rose",
    asset: {
      logo: "/ecosystem/apps/chido-casino/logo.png",
      icon: "/ecosystem/apps/chido-casino/icon.png",
      cover: "/ecosystem/apps/chido-casino/cover.png",
    },
  },
];

export const PUBLIC_AGIS: PublicAgi[] = [
  {
    slug: "nova",
    title: "NOVA",
    role: "Dirección estratégica y coordinación",
    summary:
      "La IA madre del ecosistema, pensada para alinear contexto, prioridades y decisiones.",
    impact: "Convierte información dispersa en acción clara.",
    cluster: "core",
    partnerApps: ["Hocker ONE", "Hocker Ads", "Hocker Hub"],
    accent: "cyan",
    asset: {
      logo: "/ecosystem/agis/nova/logo.png",
      icon: "/ecosystem/agis/nova/icon.png",
      cover: "/ecosystem/agis/nova/cover.png",
    },
  },
  {
    slug: "syntia",
    title: "Syntia",
    role: "Memoria y sincronización",
    summary:
      "Mantiene continuidad, orden y contexto para que el ecosistema responda mejor.",
    impact: "Hace que el sistema recuerde, compare y conecte.",
    cluster: "core",
    partnerApps: ["Hocker ONE", "Hocker Drive Cloud", "Hocker Hub"],
    accent: "sky",
    asset: {
      logo: "/ecosystem/agis/syntia/logo.png",
      icon: "/ecosystem/agis/syntia/icon.png",
      cover: "/ecosystem/agis/syntia/cover.png",
    },
  },
  {
    slug: "vertx",
    title: "Vertx",
    role: "Seguridad, integridad y auditoría",
    summary:
      "Protege accesos, valida acciones y mantiene el sistema en control.",
    impact: "Reduce riesgo y aumenta confianza.",
    cluster: "core",
    partnerApps: ["Hocker ONE", "Hocker Wallet", "Trackhok"],
    accent: "emerald",
    asset: {
      logo: "/ecosystem/agis/vertx/logo.png",
      icon: "/ecosystem/agis/vertx/icon.png",
      cover: "/ecosystem/agis/vertx/cover.png",
    },
  },
  {
    slug: "jurix",
    title: "Jurix",
    role: "Cumplimiento y privacidad",
    summary:
      "Aporta estructura legal y orden en contratos, términos y políticas.",
    impact: "Da soporte a decisiones más seguras y comerciales.",
    cluster: "core",
    partnerApps: ["Hocker Wallet", "NEXPA App", "Chido Casino"],
    accent: "violet",
    asset: {
      logo: "/ecosystem/agis/jurix/logo.png",
      icon: "/ecosystem/agis/jurix/icon.png",
      cover: "/ecosystem/agis/jurix/cover.png",
    },
  },
  {
    slug: "curvewind",
    title: "Curvewind",
    role: "Predicción y escenarios",
    summary:
      "Ayuda a leer rutas, oportunidades y riesgos con visión más estratégica.",
    impact: "Convierte incertidumbre en criterio.",
    cluster: "core",
    partnerApps: ["Chido Casino", "Hocker Ads", "Hocker Wallet"],
    accent: "amber",
    asset: {
      logo: "/ecosystem/agis/curvewind/logo.png",
      icon: "/ecosystem/agis/curvewind/icon.png",
      cover: "/ecosystem/agis/curvewind/cover.png",
    },
  },
  {
    slug: "numia",
    title: "Numia",
    role: "Finanzas, ROI y margen",
    summary:
      "Ordena costos, ingresos y rentabilidad para que el negocio avance con números claros.",
    impact: "Ayuda a vender mejor y gastar con criterio.",
    cluster: "core",
    partnerApps: ["Hocker Wallet", "Hocker Hub", "Hocker Supply"],
    accent: "emerald",
    asset: {
      logo: "/ecosystem/agis/numia/logo.png",
      icon: "/ecosystem/agis/numia/icon.png",
      cover: "/ecosystem/agis/numia/cover.png",
    },
  },
  {
    slug: "nova-ads",
    title: "Nova Ads",
    role: "Publicidad y crecimiento",
    summary:
      "Gestiona campañas, audiencias y resultados con enfoque comercial.",
    impact: "Lleva más tráfico útil a cada oferta.",
    cluster: "creative",
    partnerApps: ["Hocker Ads", "Hocker Hub"],
    accent: "rose",
    asset: {
      logo: "/ecosystem/agis/nova-ads/logo.png",
      icon: "/ecosystem/agis/nova-ads/icon.png",
      cover: "/ecosystem/agis/nova-ads/cover.png",
    },
  },
  {
    slug: "candy-ads",
    title: "Candy Ads",
    role: "Creatividad y marca",
    summary:
      "Crea piezas visuales más llamativas, más claras y mejor alineadas con la marca.",
    impact: "Hace que el producto se vea premium.",
    cluster: "creative",
    partnerApps: ["Hocker Ads", "Hocker Up"],
    accent: "rose",
    asset: {
      logo: "/ecosystem/agis/candy-ads/logo.png",
      icon: "/ecosystem/agis/candy-ads/icon.png",
      cover: "/ecosystem/agis/candy-ads/cover.png",
    },
  },
  {
    slug: "pro-ia",
    title: "PRO IA",
    role: "Video, motion y storytelling",
    summary:
      "Convierte ideas en piezas audiovisuales con ritmo, claridad y presencia.",
    impact: "Eleva la percepción de marca y contenido.",
    cluster: "creative",
    partnerApps: ["Hocker Ads", "Hocker Up", "Chido Casino"],
    accent: "cyan",
    asset: {
      logo: "/ecosystem/agis/pro-ia/logo.png",
      icon: "/ecosystem/agis/pro-ia/icon.png",
      cover: "/ecosystem/agis/pro-ia/cover.png",
    },
  },
  {
    slug: "hostia",
    title: "Hostia",
    role: "Infraestructura, dominios y APIs",
    summary:
      "Conecta servicios, despliegues y capas técnicas para sostener la operación.",
    impact: "Mantiene el sistema vivo y conectado.",
    cluster: "operations",
    partnerApps: ["Hocker ONE", "Hocker Drive Cloud", "Hocker Supply"],
    accent: "sky",
    asset: {
      logo: "/ecosystem/agis/hostia/logo.png",
      icon: "/ecosystem/agis/hostia/icon.png",
      cover: "/ecosystem/agis/hostia/cover.png",
    },
  },
  {
    slug: "trackhok",
    title: "Trackhok",
    role: "Monitoreo y alertas",
    summary:
      "Detecta estados, eventos y rutas para que la operación tenga visibilidad real.",
    impact: "Aporta control sobre lo que ocurre en campo.",
    cluster: "operations",
    partnerApps: ["Trackhok", "Hocker ONE"],
    accent: "sky",
    asset: {
      logo: "/ecosystem/agis/trackhok/logo.png",
      icon: "/ecosystem/agis/trackhok/icon.png",
      cover: "/ecosystem/agis/trackhok/cover.png",
    },
  },
  {
    slug: "nexpa",
    title: "NEXPA",
    role: "Seguridad y bienestar digital",
    summary:
      "Apoya el control y la supervisión responsable de entornos digitales.",
    impact: "Suma protección y confianza al ecosistema.",
    cluster: "operations",
    partnerApps: ["NEXPA App", "Jurix"],
    accent: "violet",
    asset: {
      logo: "/ecosystem/agis/nexpa/logo.png",
      icon: "/ecosystem/agis/nexpa/icon.png",
      cover: "/ecosystem/agis/nexpa/cover.png",
    },
  },
  {
    slug: "chido-wins",
    title: "Chido Wins",
    role: "Soporte estratégico para Chido Casino",
    summary:
      "Trabaja sobre patrones, señales y lectura operativa para el ecosistema de entretenimiento.",
    impact: "Hace más clara la operación de Chido Casino.",
    cluster: "support",
    partnerApps: ["Chido Casino", "Curvewind", "Numia"],
    accent: "rose",
    asset: {
      logo: "/ecosystem/agis/chido-wins/logo.png",
      icon: "/ecosystem/agis/chido-wins/icon.png",
      cover: "/ecosystem/agis/chido-wins/cover.png",
    },
  },
  {
    slug: "chido-gerente",
    title: "Chido Gerente",
    role: "Operación y control",
    summary:
      "Apoya la administración diaria, seguimiento y orden operativo.",
    impact: "Reduce fricción en la gestión.",
    cluster: "support",
    partnerApps: ["Chido Casino", "Hocker ONE"],
    accent: "amber",
    asset: {
      logo: "/ecosystem/agis/chido-gerente/logo.png",
      icon: "/ecosystem/agis/chido-gerente/icon.png",
      cover: "/ecosystem/agis/chido-gerente/cover.png",
    },
  },
  {
    slug: "shadows",
    title: "Shadows",
    role: "Tareas temporales y automatización",
    summary:
      "Módulos efímeros para procesos breves, pruebas y apoyo operativo puntual.",
    impact: "Acelera tareas sin ensuciar el sistema principal.",
    cluster: "support",
    partnerApps: ["Hocker ONE", "NOVA"],
    accent: "cyan",
    asset: {
      logo: "/ecosystem/agis/shadows/logo.png",
      icon: "/ecosystem/agis/shadows/icon.png",
      cover: "/ecosystem/agis/shadows/cover.png",
    },
  },
  {
    slug: "revia",
    title: "REVIA",
    role: "Motor comercial y cierre asistido",
    summary:
      "Acompaña cotizaciones, prioridades y seguimiento para convertir mejor las oportunidades.",
    impact: "Impulsa ventas con un tono más humano y claro.",
    cluster: "support",
    partnerApps: ["Hocker Hub", "Hocker Ads", "Hocker ONE"],
    accent: "emerald",
    asset: {
      logo: "/ecosystem/agis/revia/logo.png",
      icon: "/ecosystem/agis/revia/icon.png",
      cover: "/ecosystem/agis/revia/cover.png",
    },
  },
];

export function getPublicApp(slug: string) {
  return PUBLIC_APPS.find((item) => item.slug === slug);
}

export function getPublicAgi(slug: string) {
  return PUBLIC_AGIS.find((item) => item.slug === slug);
}
