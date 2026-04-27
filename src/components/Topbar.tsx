"use client";

import Link from "next/link";
import { Bell, Bot, Menu, ShieldCheck, Sparkles } from "lucide-react";
import { usePathname } from "next/navigation";

const titles: Record<string, string> = {
  "/": "Inicio",
  "/dashboard": "Panel",
  "/chat": "NOVA",
  "/commands": "Comandos",
  "/nodes": "Nodos",
  "/governance": "Guardia",
  "/supply": "Supply",
  "/agis": "AGIs"
};

function getTitle(pathname: string) {
  return titles[pathname] || "Hocker ONE";
}

export default function Topbar() {
  const pathname = usePathname();
  const title = getTitle(pathname);

  return (
    <header className="hkr-v2-topbar">
      <Link href="/" className="hkr-v2-brand" aria-label="Ir al inicio">
        <span>
          <img src="/brand/hocker-one-logo.png" alt="" />
        </span>
        <strong>{title}</strong>
      </Link>

      <nav className="hkr-v2-topnav" aria-label="Navegación principal">
        <Link href="/chat">
          <Bot size={17} />
          NOVA
        </Link>
        <Link href="/governance">
          <ShieldCheck size={17} />
          Guardia
        </Link>
      </nav>

      <div className="hkr-v2-top-actions">
        <button type="button" aria-label="Notificaciones">
          <Bell size={18} />
        </button>

        <Link href="/dashboard" aria-label="Panel activo">
          <Sparkles size={18} />
        </Link>

        <button type="button" aria-label="Menú">
          <Menu size={18} />
        </button>
      </div>
    </header>
  );
}
