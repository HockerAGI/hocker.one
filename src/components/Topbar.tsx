"use client";

import Link from "next/link";
import { Bot, ShieldCheck } from "lucide-react";
import { usePathname } from "next/navigation";

const titles: Record<string, string> = {
  "/": "Inicio",
  "/dashboard": "Panel",
  "/chat": "NOVA",
  "/commands": "Comandos",
  "/nodes": "Nodos",
  "/governance": "Guardia",
  "/supply": "Supply",
  "/agis": "AGIs",
};

function getTitle(pathname: string) {
  return titles[pathname] || "Hocker ONE";
}

export default function Topbar() {
  const pathname = usePathname() || "/";
  const title = getTitle(pathname);

  return (
    <header className="hkr3-topbar">
      <Link href="/" className="hkr3-topbrand" aria-label="Ir al inicio">
        <img src="/brand/hocker-one-logo.png" alt="Hocker ONE" />
      </Link>

      <div className="hkr3-current">
        <span />
        <strong>{title}</strong>
      </div>

      <nav className="hkr3-toplinks" aria-label="Acciones rápidas">
        <Link href="/chat">
          <Bot size={17} />
          NOVA
        </Link>
        <Link href="/governance">
          <ShieldCheck size={17} />
          Guardia
        </Link>
      </nav>
    </header>
  );
}
