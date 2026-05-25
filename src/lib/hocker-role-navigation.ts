export type HockerShellMode = "owner" | "client" | "user";

export type HockerNavItem = {
  label: string;
  href: string;
  description: string;
  ownerOnly?: boolean;
  protected?: boolean;
};

export const HOCKER_NAV_ITEMS_2C: Record<HockerShellMode, HockerNavItem[]> = {
  owner: [
    { label: "Inicio", href: "/owner/command-center", description: "Resumen ejecutivo y próxima acción." },
    { label: "NOVA", href: "/owner/nova", description: "Chat operativo central." },
    { label: "Pendientes", href: "/owner/actions", description: "Aprobaciones y acciones listas." },
    { label: "Evidencia", href: "/owner/evidence", description: "Pruebas, cambios y resultados." },
    { label: "Ecosistema", href: "/owner/ecosystem", description: "Mapa visual de HOCKER." },
    { label: "AGIs", href: "/owner/agis", description: "Las 16 AGIs oficiales.", ownerOnly: true },
    { label: "Apps", href: "/owner/apps", description: "Apps y módulos del ecosistema." },
    { label: "Finanzas", href: "/owner/finance", description: "Numia, ROI, gastos y facturación.", protected: true },
    { label: "Memoria", href: "/owner/memory", description: "Syntia, aprendizaje y revisión.", ownerOnly: true },
    { label: "Código", href: "/owner/code", description: "Cambios de código con aprobación.", protected: true },
    { label: "Seguridad", href: "/owner/security", description: "Vertx, permisos y auditoría.", protected: true },
    { label: "Integraciones", href: "/owner/integrations", description: "Conexiones reales y estado." },
    { label: "Marketplace", href: "/owner/marketplace", description: "Módulos, plantillas, agentes y conectores." },
  ],
  client: [
    { label: "Inicio", href: "/client/home", description: "Resumen del servicio contratado." },
    { label: "NOVA", href: "/client/nova", description: "Chat limitado al proyecto del cliente." },
    { label: "Servicios", href: "/client/services", description: "Servicios activos y avances." },
    { label: "Reportes", href: "/client/reports", description: "Resultados claros y recomendaciones." },
    { label: "Aprobaciones", href: "/client/approvals", description: "Piezas y cambios listos para revisar." },
    { label: "Facturación", href: "/client/billing", description: "Plan, pagos y facturas.", protected: true },
    { label: "Soporte", href: "/client/support", description: "Ayuda y seguimiento." },
  ],
  user: [
    { label: "Inicio", href: "/app/home", description: "Resumen simple." },
    { label: "Actividad", href: "/app/activity", description: "Lo que acaba de pasar." },
    { label: "NOVA", href: "/app/nova", description: "Hablar con NOVA." },
    { label: "Cuenta", href: "/app/account", description: "Configuración personal." },
  ],
};

export const HOCKER_MOBILE_OWNER_NAV_2C = [
  { label: "Inicio", href: "/app" },
  { label: "NOVA", href: "/app/nova" },
  { label: "Pendientes", href: "/app/pendientes" },
  { label: "Actividad", href: "/app/actividad" },
  { label: "Más", href: "/app/ecosistema" },
] as const;

