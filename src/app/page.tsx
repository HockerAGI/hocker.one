import Link from "next/link";
import AppNav from "@/components/AppNav";
import AuthBox from "@/components/AuthBox";
import BrandMark from "@/components/BrandMark";

const modules = [
  {
    title: "Dashboard",
    desc: "Telemetría, seguridad, nodos y eventos en una sola vista.",
  },
  {
    title: "Chat NOVA",
    desc: "Entrada operativa con la IA central del ecosistema.",
  },
  {
    title: "Commands",
    desc: "Cola de acciones, aprobaciones y ejecución controlada.",
  },
  {
    title: "Nodes",
    desc: "Visibilidad de nodos físicos y agentes cloud.",
  },
  {
    title: "AGIs",
    desc: "Jerarquía de inteligencias y perfiles operativos.",
  },
  {
    title: "Supply",
    desc: "Productos, órdenes y operación interna.",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,.10),transparent_30%),radial-gradient(circle_at_top_right,rgba(37,99,235,.10),transparent_26%),linear-gradient(180deg,#f8fafc_0%,#eef5ff_100%)] text-slate-900">
      <AppNav />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_.9fr]">
          <div className="rounded-3xl border border-slate-200 bg-white/80 p-8 shadow-xl shadow-slate-900/5 backdrop-blur">
            <BrandMark />

            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.24em] text-sky-700">
              HOCKER ONE · Control Plane
            </div>

            <h1 className="mt-5 max-w-3xl text-4xl font-black tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              Un panel que sí se ve{" "}
              <span className="bg-gradient-to-r from-sky-500 to-blue-600 bg-clip-text text-transparent">
                premium
              </span>
              .
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600">
              Entra al ecosistema HOCKER sin humo: auth real, Supabase real, nodos reales,
              comandos reales y NOVA como cerebro operativo.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/dashboard"
                className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-800"
              >
                Ir al dashboard
              </Link>
              <Link
                href="/chat"
                className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                Abrir NOVA
              </Link>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
              {[
                ["Supabase", "DB + Auth"],
                ["Vercel", "Deploy"],
                ["NOVA", "Orquestación"],
                ["HMAC", "Zero-trust"],
              ].map(([title, desc]) => (
                <div
                  key={title}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="text-sm font-extrabold text-slate-900">{title}</div>
                  <div className="mt-1 text-xs text-slate-500">{desc}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5">
            <div className="mb-5">
              <div className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">
                Acceso
              </div>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
                Login seguro
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Te mando un enlace mágico por correo y entras directo al control plane.
              </p>
            </div>

            <AuthBox />

            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              En Supabase configura <span className="font-semibold text-slate-900">Site URL</span>{" "}
              y agrega <span className="font-semibold text-slate-900">/auth/callback</span> como
              redirect URL.
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">
                Módulos activos
              </div>
              <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
                Todo el ecosistema en una sola capa
              </h3>
            </div>
            <Link href="/dashboard" className="text-sm font-bold text-sky-700 hover:underline">
              Ver panel completo →
            </Link>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {modules.map((m) => (
              <div
                key={m.title}
                className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
              >
                <div className="text-base font-extrabold text-slate-950">{m.title}</div>
                <div className="mt-2 text-sm leading-6 text-slate-600">{m.desc}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}