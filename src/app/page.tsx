import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Bot, Command, LayoutDashboard, Sparkles } from "lucide-react";
import HockerLiveStatus from "@/components/HockerLiveStatus";

export const metadata: Metadata = {
  title: "Hocker ONE · Centro de control",
  description:
    "Centro operativo de Hocker ONE para NOVA, web, PWA, Android, APIs y servicios conectados.",
};

const access = [
  {
    href: "/chat",
    title: "NOVA",
    detail: "AGI central",
    icon: Sparkles,
  },
  {
    href: "/dashboard",
    title: "Panel",
    detail: "Estado general",
    icon: LayoutDashboard,
  },
  {
    href: "/commands",
    title: "Tareas",
    detail: "Acciones y cola",
    icon: Command,
  },
];

export default function HomePage() {
  return (
    <main className="hko-home">
      <section className="hko-hero" aria-label="Hocker ONE">
        <div className="hko-hero-bg" aria-hidden="true" />
        <div className="hko-hero-orb hko-hero-orb-a" aria-hidden="true" />
        <div className="hko-hero-orb hko-hero-orb-b" aria-hidden="true" />

        <div className="hko-logo-stage">
          <div className="hko-logo-depth" aria-hidden="true" />
          <Image
            src="/brand/hocker-one-logo.png"
            alt="Hocker ONE"
            width={500}
            height={500}
            priority
            sizes="(max-width: 640px) 92vw, 560px"
            className="hko-hero-logo"
          />
          <div className="hko-logo-light" aria-hidden="true" />
        </div>

        <div className="hko-hero-content">
          <div className="hko-live-pill">
            <span />
            Ecosistema online
          </div>

          <h1>Control real. Sin ruido.</h1>

          <p>
            NOVA concentra señales, acciones, nodos y operación en una vista clara.
          </p>

          <div className="hko-actions">
            <Link href="/dashboard" className="hko-primary-action">
              Abrir panel
              <ArrowRight size={20} />
            </Link>

            <Link href="/chat" className="hko-secondary-action">
              Hablar con NOVA
              <Bot size={19} />
            </Link>
          </div>
        </div>
      </section>

      <HockerLiveStatus />

      <section className="hko-access-section">
        <div className="hko-section-title">
          <p>Módulos</p>
          <h2>Accesos</h2>
        </div>

        <div className="hko-access-grid">
          {access.map((item) => {
            const Icon = item.icon;

            return (
              <Link href={item.href} className="hko-access-card" key={item.href}>
                <Icon size={25} />
                <div>
                  <p>{item.title}</p>
                  <span>{item.detail}</span>
                </div>
                <strong>Entrar</strong>
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}
