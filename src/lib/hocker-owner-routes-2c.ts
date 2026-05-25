export type HockerOwnerRoutePolicy = {
  href: string;
  label: string;
  purpose: string;
  requiresOwner: true;
  noindex: true;
  technicalMode?: boolean;
};

export const HOCKER_OWNER_ROUTES_2C: HockerOwnerRoutePolicy[] = [
  {
    href: "/owner",
    label: "Inicio owner",
    purpose: "Home owner existente con command center, runtime preview, aprobación y accesos principales.",
    requiresOwner: true,
    noindex: true,
  },
  {
    href: "/owner/command-center",
    label: "Centro de mando",
    purpose: "Resumen vivo, pendientes, evidencia y siguiente acción.",
    requiresOwner: true,
    noindex: true,
  },
  {
    href: "/owner/nova",
    label: "NOVA",
    purpose: "Entrada owner para pedir, ordenar, analizar y preparar acciones.",
    requiresOwner: true,
    noindex: true,
  },
  {
    href: "/owner/actions",
    label: "Pendientes",
    purpose: "Acciones disponibles para revisión antes de ejecución.",
    requiresOwner: true,
    noindex: true,
  },
  {
    href: "/owner/evidence",
    label: "Evidencia",
    purpose: "Pruebas, cambios y resultados explicados en humano.",
    requiresOwner: true,
    noindex: true,
  },
  {
    href: "/owner/ecosystem",
    label: "Ecosistema",
    purpose: "Mapa simple de AGIs, apps, sistemas e integraciones.",
    requiresOwner: true,
    noindex: true,
  },
  {
    href: "/owner/agis",
    label: "AGIs",
    purpose: "Catálogo oficial owner de las 16 AGIs.",
    requiresOwner: true,
    noindex: true,
    technicalMode: true,
  },
  {
    href: "/owner/apps",
    label: "Apps y sistemas",
    purpose: "Aplicaciones, módulos protegidos, repos e integraciones.",
    requiresOwner: true,
    noindex: true,
  },
];

export const HOCKER_OWNER_ROUTE_HARDENING_2C = {
  version: "13-2C-G",
  ownerHome: "/owner",
  commandCenter: "/owner/command-center",
  privateByDefault: true,
  robots: "noindex,nofollow,noarchive,nosnippet,noimageindex",
  execution: "none",
  databaseWrites: "none",
  apiMutation: "none",
} as const;

export function isHockerOwnerRoute(pathname: string): boolean {
  return pathname === "/owner" || pathname.startsWith("/owner/");
}
