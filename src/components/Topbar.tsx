"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  CircleDot,
  HelpCircle,
  LayoutDashboard,
  ShieldCheck,
  TerminalSquare,
} from "lucide-react";
import { useWorkspace } from "@/components/WorkspaceContext";
import { cn } from "@/lib/cn";

function getTitle(pathname: string) {
  if (pathname.startsWith("/dashboard")) {
    return {
      title: "Inicio",
      subtitle: "Resumen ejecutivo del ecosistema",
    };
  }
  if (pathname.startsWith("/chat")) {
    return {
      title: "NOVA",
      subtitle: "Asistencia, memoria y contexto operativo",
    };
  }
  if (pathname.startsWith("/commands")) {
    return {
      title: "Operaciones",
      subtitle: "Cola, aprobaciones y ejecución",
    };
  }
  if (pathname.startsWith("/nodes")) {
    return {
      title: "Nodos",
      subtitle: "Estado de infraestructura y heartbeat",
    };
  }
  if (pathname.startsWith("/agis")) {
    return {
      title: "AGIs",
      subtitle: "Unidades y módulos inteligentes",
    };
  }
  if (pathname.startsWith("/supply")) {
    return {
      title: "Supply",
      subtitle: "Productos, pedidos y operación comercial",
    };
  }
  if (pathname.startsWith("/governance")) {
    return {
      title: "Control",
      subtitle: "Seguridad, reglas y señales críticas",
    };
  }

  return {
    title: "Hocker ONE",
    subtitle: "Centro de control",
  };
}

function ActionPill({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Link
      href={href}
      className="hidden items-center gap-2 rounded-2xl border border-white/5 bg-white/[0.04] px-3 py-2 text-[10px] font-black uppercase tracking-[0.28em] text-slate-200 transition-all hover:bg-white/[0.07] md:inline-flex"
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
}

export default function Topbar() {
  const pathname = usePathname() || "/";
  const { title, subtitle } = getTitle(pathname);
  const { projectId } = useWorkspace();

  return (
    <header className="fixed inset-x-0 top-0 z-30 border-b border-white/5 bg-[#08111f]/78 backdrop-blur-2xl lg:left-[304px]">
      <div className="mx-auto flex h-[74px] max-w-7xl items-center justify-between gap-3 px-3 sm:px-4 lg:px-6">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="shell-chip-brand">
              <CircleDot className="h-3.5 w-3.5" />
              {projectId}
            </span>
          </div>

          <div className="mt-2">
            <h1 className="truncate text-lg font-black text-white">{title}</h1>
            <p className="truncate text-xs text-slate-500">{subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ActionPill href="/dashboard" label="Inicio" icon={LayoutDashboard} />
          <ActionPill href="/commands" label="Operaciones" icon={TerminalSquare} />
          <ActionPill href="/governance" label="Control" icon={ShieldCheck} />

          <button
            type="button"
            className={cn(
              "inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/5 bg-white/[0.04] text-slate-300 transition-all hover:bg-white/[0.07]",
            )}
            aria-label="Ayuda"
          >
            <HelpCircle className="h-5 w-5" />
          </button>

          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/5 bg-white/[0.04] text-slate-300 transition-all hover:bg-white/[0.07]"
            aria-label="Alertas"
          >
            <Bell className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}