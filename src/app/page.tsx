import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Bot,
  BrainCircuit,
  Command,
  Gauge,
  Network,
  Radar,
  ShieldCheck,
  Sparkles,
  Store,
  Zap
} from "lucide-react";

const kpis = [
  { label: "Sistema", value: "Activo", tone: "cyan" },
  { label: "Android", value: "APK OK", tone: "violet" },
  { label: "Control", value: "Seguro", tone: "green" }
];

const modules = [
  {
    title: "NOVA",
    text: "Chat, criterio y ejecución.",
    href: "/chat",
    icon: BrainCircuit,
    tag: "CORE"
  },
  {
    title: "Comandos",
    text: "Acciones, cola y aprobaciones.",
    href: "/commands",
    icon: Command,
    tag: "OPS"
  },
  {
    title: "Nodos",
    text: "Infraestructura y señal viva.",
    href: "/nodes",
    icon: Network,
    tag: "SYNC"
  },
  {
    title: "Guardia",
    text: "Killswitch y control sensible.",
    href: "/governance",
    icon: ShieldCheck,
    tag: "SAFE"
  },
  {
    title: "Supply",
    text: "Productos, órdenes y operación.",
    href: "/supply",
    icon: Store,
    tag: "FLOW"
  }
];

const timeline = [
  { label: "Web", value: "online", width: "94%" },
  { label: "PWA", value: "lista", width: "88%" },
  { label: "APK", value: "debug", width: "82%" },
  { label: "API", value: "protegida", width: "76%" }
];

function SignalMap() {
  return (
    <div className="hkr-v2-map" aria-label="Mapa visual del ecosistema Hocker ONE">
      <div className="hkr-v2-orbit hkr-v2-orbit-1" />
      <div className="hkr-v2-orbit hkr-v2-orbit-2" />
      <div className="hkr-v2-orbit hkr-v2-orbit-3" />

      <div className="hkr-v2-core">
        <Sparkles size={30} />
        <span>NOVA</span>
      </div>

      <span className="hkr-v2-node hkr-v2-node-a">Web</span>
      <span className="hkr-v2-node hkr-v2-node-b">PWA</span>
      <span className="hkr-v2-node hkr-v2-node-c">APK</span>
      <span className="hkr-v2-node hkr-v2-node-d">API</span>
    </div>
  );
}

function MiniMetric({ item }: { item: (typeof kpis)[number] }) {
  return (
    <div className={`hkr-v2-kpi hkr-v2-kpi-${item.tone}`}>
      <span>{item.label}</span>
      <strong>{item.value}</strong>
      <i />
    </div>
  );
}

function ModuleCard({ item }: { item: (typeof modules)[number] }) {
  const Icon = item.icon;

  return (
    <Link href={item.href} className="hkr-v2-module">
      <div className="hkr-v2-module-icon">
        <Icon size={25} />
      </div>

      <div className="hkr-v2-module-copy">
        <span>{item.tag}</span>
        <h3>{item.title}</h3>
        <p>{item.text}</p>
      </div>

      <ArrowRight className="hkr-v2-module-arrow" size={22} />
    </Link>
  );
}

export default function HomePage() {
  return (
    <main className="hkr-v2-page">
      <section className="hkr-v2-hero">
        <div className="hkr-v2-hero-grid">
          <div className="hkr-v2-hero-copy">
            <div className="hkr-v2-pill">
              <Zap size={16} />
              HOCKER ONE
            </div>

            <h1>
              Control real.
              <span>Sin ruido.</span>
            </h1>

            <p>
              Una vista clara para operar NOVA, nodos, comandos, seguridad y módulos del ecosistema.
            </p>

            <div className="hkr-v2-actions">
              <Link href="/dashboard" className="hkr-v2-primary">
                Abrir panel
                <ArrowRight size={18} />
              </Link>

              <Link href="/chat" className="hkr-v2-secondary">
                Hablar con NOVA
                <Bot size={18} />
              </Link>
            </div>

            <div className="hkr-v2-kpis">
              {kpis.map((item) => (
                <MiniMetric item={item} key={item.label} />
              ))}
            </div>
          </div>

          <div className="hkr-v2-hero-visual">
            <div className="hkr-v2-logo-card">
              <img src="/brand/hocker-one-logo.png" alt="Hocker ONE" />
            </div>

            <SignalMap />
          </div>
        </div>
      </section>

      <section className="hkr-v2-section">
        <div className="hkr-v2-section-head">
          <div>
            <span>Centro operativo</span>
            <h2>Lectura rápida</h2>
          </div>
          <Link href="/dashboard">
            Ver dashboard
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="hkr-v2-dashboard-grid">
          <div className="hkr-v2-panel hkr-v2-panel-large">
            <div className="hkr-v2-panel-head">
              <div>
                <span>Señal general</span>
                <h3>Sistema estable</h3>
              </div>
              <Gauge size={28} />
            </div>

            <div className="hkr-v2-bars">
              {timeline.map((item) => (
                <div className="hkr-v2-bar-row" key={item.label}>
                  <div>
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                  </div>
                  <i>
                    <b style={{ width: item.width }} />
                  </i>
                </div>
              ))}
            </div>
          </div>

          <div className="hkr-v2-panel">
            <div className="hkr-v2-ring">
              <Radar size={34} />
              <strong>Live</strong>
            </div>
            <p>Mapa activo del ecosistema. Primero señal, luego detalle.</p>
          </div>

          <div className="hkr-v2-panel">
            <div className="hkr-v2-ring hkr-v2-ring-green">
              <Activity size={34} />
              <strong>OK</strong>
            </div>
            <p>Diseñado para verse limpio en navegador, móvil, PWA y APK.</p>
          </div>
        </div>
      </section>

      <section className="hkr-v2-section hkr-v2-section-last">
        <div className="hkr-v2-section-head">
          <div>
            <span>Módulos</span>
            <h2>Acceso directo</h2>
          </div>
        </div>

        <div className="hkr-v2-modules">
          {modules.map((item) => (
            <ModuleCard item={item} key={item.title} />
          ))}
        </div>
      </section>
    </main>
  );
}
