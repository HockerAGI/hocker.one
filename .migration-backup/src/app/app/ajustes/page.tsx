import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import { Database, KeyRound, LockKeyhole, ShieldCheck, UserCog } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Ajustes · Hocker ONE",
  description: "Ajustes privados de Hocker ONE.",
  robots: { index: false, follow: false },
};

const settings = [
  { href: "/owner", title: "Owner", text: "Resumen ejecutivo y control de autorización.", icon: UserCog },
  { href: "/integrations", title: "Conexiones", text: "Estado de integraciones reales y límites actuales.", icon: Database },
  { href: "/security", title: "Seguridad", text: "Hardening, grants y reglas sensibles.", icon: ShieldCheck },
  { href: "/memory", title: "Aprendizaje", text: "Memoria, revisión y auditoría de publicación.", icon: LockKeyhole },
  { href: "/access", title: "Accesos", text: "Solicitudes, permisos y portal privado.", icon: KeyRound },
];

export default function AppSettingsPage() {
  return (
    <PageShell
      eyebrow="Hocker ONE"
      title="Ajustes"
      description="Configuración privada agrupada. La operación sensible sigue bajo sesión, noindex y aprobación owner."
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {settings.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="hocker-panel-pro block p-5 transition hover:-translate-y-0.5 hover:border-sky-300/30"
            >
              <Icon className="h-7 w-7 text-cyan-300" />
              <h2 className="mt-5 text-xl font-black text-white">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">{item.text}</p>
            </Link>
          );
        })}
      </div>
    </PageShell>
  );
}
