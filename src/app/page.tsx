import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Bot,
  Brain,
  Cpu,
  Lock,
  Megaphone,
  ShieldCheck,
  Sparkles,
  Workflow,
} from "lucide-react";
import CardHoverGlow from "@/components/public-marketing/CardHoverGlow";
import "@/styles/cinematic-landing.css";

export const metadata: Metadata = {
  title: "Hocker AGI Technologies — Inteligencia artificial que opera por ti",
  description:
    "Hocker AGI Technologies construye sistemas de inteligencia artificial que automatizan, analizan, venden y protegen tu operación. Un ecosistema de agentes IA trabajando 24/7 bajo tu control.",
  openGraph: {
    title: "Hocker AGI Technologies — Inteligencia artificial que opera por ti",
    description:
      "Sistemas de IA que automatizan, analizan, venden y protegen. Un ecosistema de agentes inteligentes trabajando bajo tu control.",
    type: "website",
  },
};

const capabilities = [
  {
    icon: Bot,
    title: "Agentes que trabajan solos",
    text: "NOVA y su equipo de AGIs ejecutan tareas reales: responden, analizan, escriben código y toman decisiones guidadas por tus reglas.",
  },
  {
    icon: ShieldCheck,
    title: "Control total, siempre",
    text: "Tú apruebas cada acción importante antes de que se ejecute. Nada pasa sin tu visto bueno. Evidencia de cada paso, siempre.",
  },
  {
    icon: Brain,
    title: "Memoria que aprende",
    text: "Syntia recuerda cada interacción y mejora con el tiempo. Tu sistema conoce tu negocio mejor cada día, sin empezar de cero.",
  },
  {
    icon: Megaphone,
    title: "Publicidad con IA",
    text: "Campañas, contenido y branding generados y optimizados automáticamente. Más alcance, menos esfuerzo, resultados medibles.",
  },
  {
    icon: Workflow,
    title: "Automatización sin límites",
    text: "Conecta tus herramientas, datos y procesos en flujos automáticos. Lo repetitivo desaparece. Tu equipo se enfoca en lo importante.",
  },
  {
    icon: Cpu,
    title: "Infraestructura segura",
    text: "Plataformas privadas, paneles de control y nubes dedicadas. Tu información protegida con auditoría completa y permisos por nivel.",
  },
];

const agis = [
  { glyph: "N", color: "linear-gradient(135deg, #38bdf8, #0ea5e9)", name: "NOVA", role: "Orquestador" },
  { glyph: "S", color: "linear-gradient(135deg, #a78bfa, #7c3aed)", name: "Syntia", role: "Memoria IA" },
  { glyph: "V", color: "linear-gradient(135deg, #34d399, #059669)", name: "Vertx", role: "Seguridad" },
  { glyph: "N", color: "linear-gradient(135deg, #fbbf24, #d97706)", name: "Numia", role: "Finanzas" },
  { glyph: "J", color: "linear-gradient(135deg, #f472b6, #db2777)", name: "Jurix", role: "Legal" },
  { glyph: "C", color: "linear-gradient(135deg, #60a5fa, #2563eb)", name: "Curvewind", role: "Estrategia" },
  { glyph: "H", color: "linear-gradient(135deg, #fb7185, #e11d48)", name: "Hostia", role: "Infraestructura" },
  { glyph: "N", color: "linear-gradient(135deg, #2dd4bf, #0d9488)", name: "NEXPA", role: "Ética" },
];

const stats = [
  { value: "8", label: "Agentes IA" },
  { value: "24/7", label: "Operación continua" },
  { value: "100%", label: "Bajo tu control" },
  { value: "∞", label: "Posibilidades" },
];

export default function PublicHomePage() {
  return (
    <main className="hko-hero-cinematic">
      <CardHoverGlow />

      {/* Animated mesh background */}
      <div className="hko-hero-mesh" aria-hidden="true" />
      <div className="hko-hero-grid-bg" aria-hidden="true" />

      {/* Navigation */}
      <nav className="hko-hero-nav">
        <Link href="/" className="hko-hero-nav-logo" aria-label="Hocker AGI Technologies">
          <Image
            src="/brand/hocker-one-logo.png"
            alt="Hocker AGI Technologies"
            width={180}
            height={56}
            priority
            className="h-auto w-[140px] object-contain sm:w-[170px]"
          />
        </Link>
        <div className="hko-hero-nav-links">
          <Link href="/empresa" className="hko-hero-nav-link">Empresa</Link>
          <Link href="/servicios" className="hko-hero-nav-link">Servicios</Link>
          <Link href="/ecosistema" className="hko-hero-nav-link">Ecosistema</Link>
          <Link href="/contacto" className="hko-hero-nav-link">Contacto</Link>
        </div>
        <Link href="/login" className="hko-hero-nav-cta">
          <Lock className="h-[14px] w-[14px]" />
          Acceso privado
        </Link>
      </nav>

      {/* Hero content */}
      <div className="hko-hero-content">
        <span className="hko-hero-badge">
          <Sparkles className="h-3.5 w-3.5" />
          Inteligencia artificial operativa
        </span>

        <h1 className="hko-hero-title">
          Tu empresa funciona
          <br />
          <span className="hko-hero-title-gradient">con inteligencia</span>
        </h1>

        <p className="hko-hero-subtitle">
          Hocker AGI Technologies crea sistemas de IA que automatizan tareas, analizan datos,
          generan contenido y protegen tu operación. Un equipo de agentes inteligentes
          trabajando para ti, bajo tu control, sin perder el mando.
        </p>

        <div className="hko-hero-actions">
          <Link href="/login" className="hko-hero-btn-primary">
            Entrar al panel
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/empresa" className="hko-hero-btn-secondary">
            Conocer la empresa
          </Link>
        </div>
      </div>

      {/* Stats bar */}
      <div className="hko-hero-stats">
        {stats.map((stat) => (
          <div key={stat.label} className="hko-hero-stat">
            <div className="hko-hero-stat-value">{stat.value}</div>
            <div className="hko-hero-stat-label">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Scroll indicator */}
      <div className="hko-scroll-indicator" aria-hidden="true">
        <span className="hko-scroll-indicator-text">Desliza</span>
        <div className="hko-scroll-indicator-line" />
      </div>

      {/* Capabilities section */}
      <section className="hko-caps-section">
        <div className="hko-caps-inner">
          <p className="hko-section-eyebrow">Qué puede hacer</p>
          <h2 className="hko-section-title">
            Todo lo que necesitas,
            <br />
            gestionado por IA.
          </h2>
          <p className="hko-section-desc">
            Desde responder clientes hasta analizar tu negocio, generar contenido y proteger
            tu información. Cada capacidad es real, conectada y lista para usar.
          </p>

          <div className="hko-caps-grid">
            {capabilities.map((cap) => {
              const Icon = cap.icon;
              return (
                <article key={cap.title} className="hko-cap-card">
                  <div className="hko-cap-icon">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="hko-cap-title">{cap.title}</h3>
                  <p className="hko-cap-text">{cap.text}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Ecosystem section */}
      <section className="hko-eco-section">
        <div className="hko-eco-inner">
          <p className="hko-section-eyebrow">El ecosistema</p>
          <h2 className="hko-section-title">Ocho mentes, un solo equipo.</h2>
          <p className="hko-section-desc">
            Cada agente IA tiene una especialidad. Trabajan juntos, coordinados por NOVA,
            para cubrir cada área de tu operación.
          </p>

          <div className="hko-eco-grid">
            {agis.map((agi) => (
              <div key={agi.name} className="hko-agi-chip">
                <div className="hko-agi-chip-glyph" style={{ background: agi.color }}>
                  {agi.glyph}
                </div>
                <div className="hko-agi-chip-name">{agi.name}</div>
                <div className="hko-agi-chip-role">{agi.role}</div>
                <div className="hko-agi-chip-dot" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA section */}
      <section className="hko-cta-section">
        <div className="hko-cta-inner">
          <div className="hko-cta-card">
            <h2 className="hko-cta-title">
              Empieza a operar con IA hoy.
            </h2>
            <p className="hko-cta-text">
              Entra al panel privado, habla con NOVA y delega tu primera tarea.
              El sistema hace el trabajo; tú mantienes el control.
            </p>
            <div className="hko-cta-actions">
              <Link href="/login" className="hko-hero-btn-primary">
                Entrar al panel
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/one" className="hko-hero-btn-secondary">
                Ver cómo funciona
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="hko-landing-footer">
        <div className="hko-landing-footer-inner">
          <span className="hko-landing-footer-text">
            © {new Date().getFullYear()} Hocker AGI Technologies
          </span>
          <div className="hko-landing-footer-links">
            <Link href="/empresa" className="hko-landing-footer-link">Empresa</Link>
            <Link href="/servicios" className="hko-landing-footer-link">Servicios</Link>
            <Link href="/ecosistema" className="hko-landing-footer-link">Ecosistema</Link>
            <Link href="/contacto" className="hko-landing-footer-link">Contacto</Link>
            <Link href="/login" className="hko-landing-footer-link">Acceso privado</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
