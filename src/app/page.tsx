import type { ComponentType } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Bot,
  Command,
  Gauge,
  Network,
  ShieldCheck,
  Store,
  Zap,
} from "lucide-react";

type Module = {
  title: string;
  label: string;
  status: string;
  href: string;
  icon: ComponentType<{ className?: string; size?: number }>;
};

const modules: Module[] = [
  {
    title: "NOVA",
    label: "IA central",
    status: "Activa",
    href: "/chat",
    icon: Bot,
  },
  {
    title: "Panel",
    label: "Estado general",
    status: "Online",
    href: "/dashboard",
    icon: Gauge,
  },
  {
    title: "Comandos",
    label: "Acciones",
    status: "Listo",
    href: "/commands",
    icon: Command,
  },
  {
    title: "Nodos",
    label: "Infraestructura",
    status: "Sync",
    href: "/nodes",
    icon: Network,
  },
  {
    title: "Guardia",
    label: "Seguridad",
    status: "Seguro",
    href: "/governance",
    icon: ShieldCheck,
  },
  {
    title: "Supply",
    label: "Operación",
    status: "Visible",
    href: "/supply",
    icon: Store,
  },
];

const signals = [
  { name: "NOVA", value: "Activa" },
  { name: "Web", value: "Live" },
  { name: "PWA", value: "Lista" },
  { name: "APK", value: "OK" },
];

function ModuleCard({ item }: { item: Module }) {
  const Icon = item.icon;

  return (
    <Link href={item.href} className="hkr3-module-card">
      <div className="hkr3-module-icon">
        <Icon size={22} />
      </div>

      <div>
        <p>{item.label}</p>
        <h3>{item.title}</h3>
      </div>

      <span>{item.status}</span>
    </Link>
  );
}

function SignalMap() {
  return (
    <div className="hkr3-map" aria-label="Mapa visual de Hocker ONE">
      <div className="hkr3-map-line hkr3-map-line-a" />
      <div className="hkr3-map-line hkr3-map-line-b" />
      <div className="hkr3-map-line hkr3-map-line-c" />

      <div className="hkr3-map-core">
        <img src="/brand/hocker-one-logo.png" alt="Hocker ONE" />
      </div>

      <div className="hkr3-map-node hkr3-map-node-a">NOVA</div>
      <div className="hkr3-map-node hkr3-map-node-b">PWA</div>
      <div className="hkr3-map-node hkr3-map-node-c">APK</div>
      <div className="hkr3-map-node hkr3-map-node-d">API</div>
    </div>
  );
}

export default function HomePage() {
  return (
    <main className="hkr3-page">
      <section className="hkr3-hero">
        <div className="hkr3-logo-stage">

        <span className="hkr3-hero-ambient" aria-hidden="true" />
        <span className="hkr3-hero-grid" aria-hidden="true" />
        <span className="hkr3-hero-scan" aria-hidden="true" />
        <span className="hkr3-hero-ring hkr3-hero-ring-a" aria-hidden="true" />
        <span className="hkr3-hero-ring hkr3-hero-ring-b" aria-hidden="true" />
        <span className="hkr3-hero-ring hkr3-hero-ring-c" aria-hidden="true" />
        <span className="hkr3-hero-particles" aria-hidden="true">
          {Array.from({ length: 14 }).map((_, i) => (
            <span key={i} className="hkr3-particle" />
          ))}
        </span>

          <div className="hkr3-logo-aura" />
          <img src="/brand/hocker-one-logo.png" alt="Hocker ONE" />
        </div>

        <div className="hkr3-hero-copy">
          <div className="hkr3-status-pill">
            <span />
            Ecosistema online
          </div>

          <p className="hkr3-hero-kicker">
            Control del ecosistema en tiempo real.
          </p>

          <div className="hkr3-actions">
            <Link href="/dashboard" className="hkr3-primary">
              Abrir panel
              <ArrowRight size={18} />
            </Link>

            <Link href="/chat" className="hkr3-secondary">
              Hablar con NOVA
              <Bot size={18} />
            </Link>
          </div>
        </div>
      </section>

      <section className="hkr3-signal-strip" aria-label="Estado rápido">
        {signals.map((item) => (
          <div key={item.name}>
            <p>{item.name}</p>
            <strong>{item.value}</strong>
          </div>
        ))}
      </section>

      <section className="hkr3-layout">
        <div className="hkr3-panel hkr3-panel-map">
          <div className="hkr3-section-head">
            <div>
              <p>Mapa vivo</p>
              <h2>Conexiones</h2>
            </div>
            <Zap size={20} />
          </div>

          <SignalMap />
        </div>

        <div className="hkr3-panel">
          <div className="hkr3-section-head">
            <div>
              <p>Módulos</p>
              <h2>Accesos</h2>
            </div>
          </div>

          <div className="hkr3-modules">
            {modules.map((item) => (
              <ModuleCard key={item.title} item={item} />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
