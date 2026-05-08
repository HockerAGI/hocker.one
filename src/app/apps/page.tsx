import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import { Brain, Cloud, CreditCard, Gamepad2, GraduationCap, Megaphone, ShieldCheck, Store, Users } from "lucide-react";

export const metadata: Metadata = {
  title: "Apps · Hocker ONE",
  description: "Aplicaciones principales del ecosistema Hocker.",
};

const apps = [
  { name: "Hocker ONE", text: "Panel maestro privado.", href: "/owner", icon: Brain, status: "Activo" },
  { name: "Hocker Ads", text: "Publicidad, branding y automatización.", href: "/servicios", icon: Megaphone, status: "Base lista" },
  { name: "Chido Casino", text: "Casino IA con operación controlada.", href: "/chido", icon: Gamepad2, status: "Solo revisión" },
  { name: "NEXPA IA", text: "Control parental y seguridad familiar.", href: "/security", icon: ShieldCheck, status: "Planeado" },
  { name: "Trackhok IA", text: "Rastreo y monitoreo autorizado.", href: "/integrations", icon: ShieldCheck, status: "Planeado" },
  { name: "Hocker Hub", text: "CRM y gestión de clientes.", href: "/access", icon: Users, status: "Planeado" },
  { name: "Hocker Drive", text: "Nube privada del ecosistema.", href: "/integrations", icon: Cloud, status: "Planeado" },
  { name: "Hocker Up", text: "Comunidad y aprendizaje.", href: "/servicios", icon: GraduationCap, status: "Planeado" },
  { name: "Hocker Supply", text: "Tienda, pedidos y productos.", href: "/supply", icon: Store, status: "Base lista" },
  { name: "Hocker Wallet", text: "Pagos, saldos y control financiero.", href: "/dashboard", icon: CreditCard, status: "Planeado" },
];

function badgeClass(status: string): string {
  if (status === "Activo") return "border-emerald-400/20 bg-emerald-500/10 text-emerald-300";
  if (status === "Solo revisión") return "border-amber-400/20 bg-amber-500/10 text-amber-300";
  return "border-cyan-400/20 bg-cyan-500/10 text-cyan-300";
}

export default function AppsPage() {
  return (
    <PageShell
      eyebrow="Ecosistema"
      title="Apps"
      subtitle="Aplicaciones separadas por función. Cada app tiene su propio espacio para operar sin saturar el panel."
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {apps.map((app) => {
          const Icon = app.icon;
          return (
            <Link key={app.name} href={app.href} className="hocker-panel-pro block p-5 transition hover:border-cyan-400/30 hover:bg-white/[0.03]">
              <div className="flex items-start justify-between gap-3">
                <Icon className="h-7 w-7 text-cyan-300" />
                <span className={`rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-widest ${badgeClass(app.status)}`}>{app.status}</span>
              </div>
              <h2 className="mt-5 text-xl font-black text-white">{app.name}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">{app.text}</p>
              <p className="mt-5 text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300">Ver</p>
            </Link>
          );
        })}
      </div>
    </PageShell>
  );
}
