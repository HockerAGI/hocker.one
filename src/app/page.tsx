export const dynamic = "force-dynamic";

import Link from "next/link";
import AuthBox from "@/components/AuthBox";
import BrandMark from "@/components/BrandMark";

function has(value: unknown) {
  return Boolean(String(value ?? "").trim());
}

const readiness = [
  {
    label: "Acceso privado",
    ok: has(process.env.NEXT_PUBLIC_SUPABASE_URL) && has(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    readyText: "Listo para entrar",
    pendingText: "Aún por enlazar el acceso seguro",
  },
  {
    label: "Centro de mando",
    ok: has(process.env.NOVA_AGI_URL) && has(process.env.NOVA_ORCHESTRATOR_KEY),
    readyText: "Listo para dirigir",
    pendingText: "Aún por activar el asistente central",
  },
  {
    label: "Control y seguridad",
    ok: has(process.env.COMMAND_HMAC_SECRET),
    readyText: "Protección activa",
    pendingText: "Aún por activar la capa de control",
  },
  {
    label: "Seguimiento",
    ok: has(process.env.LANGFUSE_PUBLIC_KEY) && has(process.env.LANGFUSE_SECRET_KEY),
    readyText: "Seguimiento activo",
    pendingText: "Aún por activar el seguimiento de desempeño",
  },
];

const pillars = [
  {
    title: "Dirección",
    desc: "Una sola vista para tomar decisiones con claridad y velocidad.",
  },
  {
    title: "Ventas",
    desc: "Un espacio pensado para convertir oportunidades en resultados.",
  },
  {
    title: "Atención",
    desc: "Respuestas más rápidas, ordenadas y consistentes para cada conversación.",
  },
  {
    title: "Operación",
    desc: "Todo lo importante en un mismo lugar, sin dispersión ni ruido.",
  },
  {
    title: "Automatización",
    desc: "Menos fricción, más tiempo y una operación que avanza sola.",
  },
  {
    title: "Marca",
    desc: "Una experiencia visual premium, seria y memorable desde el primer clic.",
  },
];

const pendingItems = [
  "Asistente central en vivo",
  "Mensajes automáticos para equipos y clientes",
  "Canales externos conectados",
  "Seguimiento unificado de resultados",
];

const liveHighlights = [
  {
    title: "Inicio privado",
    desc: "Acceso directo a tu entorno personal de control.",
  },
  {
    title: "Imagen de marca",
    desc: "Una presencia visual más sólida, limpia y premium.",
  },
  {
    title: "Puerta a NOVA",
    desc: "Tu asistente central queda a un clic de distancia.",
  },
  {
    title: "Visión general",
    desc: "Todo lo importante en una sola experiencia.",
  },
];

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020617] text-slate-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-140px] top-[-120px] h-[360px] w-[360px] rounded-full bg-sky-500/15 blur-3xl" />
        <div className="absolute right-[-120px] top-[80px] h-[320px] w-[320px] rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute bottom-[-120px] left-[22%] h-[380px] w-[380px] rounded-full bg-cyan-500/10 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(148,163,184,.18) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,.18) 1px, transparent 1px)",
            backgroundSize: "72px 72px",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <BrandMark />

          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-200 backdrop-blur">
            Versión privada · Control total del ecosistema
          </div>
        </header>

        <section className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[1.35fr_.95fr]">
          <div className="rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/30 backdrop-blur-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1 text-xs font-black uppercase tracking-[0.24em] text-sky-200">
              Lanzamiento oficial
            </div>

            <h1 className="mt-5 max-w-3xl text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
              Tu centro privado para dirigir todo{" "}
              <span className="bg-gradient-to-r from-sky-400 to-blue-500 bg-clip-text text-transparent">
                HOCKER
              </span>{" "}
              desde un solo lugar.
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-8 text-slate-300">
              Hocker ONE es la base de mando para organizar tu operación, tu crecimiento y tu
              comunicación. Esta versión está hecha para ti, para tener el control completo y
              una visión clara de todo lo que importa.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/dashboard"
                className="rounded-2xl bg-white px-5 py-3 text-sm font-extrabold text-slate-950 shadow-lg shadow-black/20 transition hover:bg-slate-200"
              >
                Entrar al panel
              </Link>
              <Link
                href="/chat"
                className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10"
              >
                Abrir asistente
              </Link>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
              {liveHighlights.map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-white/10 bg-slate-950/55 p-4"
                >
                  <div className="text-sm font-extrabold text-white">{item.title}</div>
                  <div className="mt-1 text-xs leading-5 text-slate-400">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/30 backdrop-blur-xl">
            <div className="mb-5">
              <div className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">
                Acceso
              </div>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-white">
                Entrar de forma privada
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Recibe tu enlace de acceso y entra directo a tu entorno.
              </p>
            </div>

            <AuthBox />

            <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-sm text-slate-300">
              Esta versión está preparada para tu uso interno. Más adelante habrá versiones
              específicas para clientes y usuarios según cada servicio.
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/30 backdrop-blur-xl">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">
                Estado general
              </div>
              <h3 className="mt-2 text-2xl font-black tracking-tight text-white">
                Lo que ya está listo y lo que aún falta
              </h3>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {readiness.map((item) => (
              <div
                key={item.label}
                className={`rounded-3xl border p-5 ${
                  item.ok
                    ? "border-emerald-400/20 bg-emerald-400/10"
                    : "border-amber-400/20 bg-amber-400/10"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="font-extrabold text-white">{item.label}</div>
                  <div
                    className={`rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.24em] ${
                      item.ok
                        ? "bg-emerald-400/20 text-emerald-200"
                        : "bg-amber-400/20 text-amber-100"
                    }`}
                  >
                    {item.ok ? "Listo" : "Pendiente"}
                  </div>
                </div>
                <div className="mt-2 text-sm leading-6 text-slate-300">
                  {item.ok ? item.readyText : item.pendingText}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-6 rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/30 backdrop-blur-xl">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">
                Mapa del ecosistema
              </div>
              <h3 className="mt-2 text-2xl font-black tracking-tight text-white">
                Todo lo que Hocker ONE ordena y centraliza
              </h3>
            </div>
            <div className="text-sm text-slate-400">
              Una experiencia pensada para ver, decidir y actuar mejor.
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pillars.map((item) => (
              <div
                key={item.title}
                className="rounded-3xl border border-white/10 bg-slate-950/55 p-5"
              >
                <div className="text-base font-extrabold text-white">{item.title}</div>
                <div className="mt-2 text-sm leading-6 text-slate-400">{item.desc}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[.95fr_1.05fr]">
          <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/30 backdrop-blur-xl">
            <div className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">
              Lo que ya te da esta versión
            </div>
            <h3 className="mt-2 text-2xl font-black tracking-tight text-white">
              Presencia, claridad y control
            </h3>

            <div className="mt-5 grid gap-3">
              {[
                "Una marca más sólida y más memorable.",
                "Una primera impresión más premium y más confiable.",
                "Una experiencia pensada para mover negocio, no solo para verse bien.",
                "Una base visual preparada para crecer por servicios y por versiones.",
              ].map((text) => (
                <div
                  key={text}
                  className="rounded-2xl border border-white/10 bg-slate-950/55 px-4 py-3 text-sm leading-6 text-slate-300"
                >
                  {text}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/30 backdrop-blur-xl">
            <div className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">
              Aún por activar
            </div>
            <h3 className="mt-2 text-2xl font-black tracking-tight text-white">
              Lo que falta por encender para que quede completo
            </h3>

            <div className="mt-5 grid gap-3">
              {pendingItems.map((text) => (
                <div
                  key={text}
                  className="flex items-center gap-3 rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm leading-6 text-amber-50"
                >
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-amber-300" />
                  <span>{text}</span>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-sm leading-7 text-slate-300">
              Esta área está pensada para crecer contigo. Primero control total interno; después,
              las versiones de clientes y usuarios por cada servicio.
            </div>
          </div>
        </section>
      </div>

      <Link
        href="/chat"
        className="fixed bottom-5 right-5 z-50 inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-400/15 px-4 py-3 text-sm font-extrabold text-sky-100 shadow-2xl shadow-sky-500/20 backdrop-blur-xl transition hover:translate-y-[-1px] hover:bg-sky-400/20"
      >
        <span className="h-2.5 w-2.5 rounded-full bg-sky-300" />
        Abrir asistente
      </Link>
    </main>
  );
}