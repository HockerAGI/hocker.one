import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import PageShell from "@/components/PageShell";
import { GlassCard } from "@/components/system";
import { PUBLIC_APPS } from "@/lib/public-catalog";

export const metadata: Metadata = {
  title: "Apps | Hocker AGI Technologies",
  description:
    "Productos del ecosistema HOCKER diseñados para vender, operar y escalar.",
};

export default function AppsPage() {
  const hero =
    PUBLIC_APPS.find((app) => app.featured) ??
    PUBLIC_APPS[0];

  if (!hero) {
    return null;
  }

  return (
    <PageShell
      eyebrow="Apps"
      title="Productos para acelerar tu negocio"
      description="Cada aplicación del ecosistema HOCKER resuelve un proceso real mediante automatización e inteligencia artificial."
      actions={
        <>
          <Link
            href="/contacto"
            className="rounded-xl bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-300"
          >
            Solicitar implementación
          </Link>

          <Link
            href="/agis"
            className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-200 hover:border-cyan-400/40 hover:text-cyan-300"
          >
            Ver AGIs
          </Link>
        </>
      }
    >
      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <GlassCard
          eyebrow="Destacado"
          title={hero.title}
          description={hero.summary}
          interactive
          actions={
            <Link
              href={`/apps/${hero.slug}`}
              className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-200 hover:border-cyan-400/40 hover:text-cyan-300"
            >
              Ver producto
            </Link>
          }
        >
          <div className="grid gap-4 md:grid-cols-[160px_minmax(0,1fr)]">
            <div className="overflow-hidden rounded-3xl border border-white/10 bg-black/20">
              <Image
                src={hero.asset.cover}
                alt={hero.title}
                width={1200}
                height={630}
                priority
                className="h-full w-full object-cover"
              />
            </div>

            <div className="space-y-4">
              <p className="text-sm uppercase tracking-[0.28em] text-cyan-200/70">
                {hero.tagline}
              </p>

              <p className="text-sm leading-7 text-slate-300">
                {hero.audience}
              </p>

              <p className="text-sm leading-7 text-slate-300">
                {hero.integration}
              </p>

              <div className="flex flex-wrap gap-2">
                {hero.benefits.map((benefit) => (
                  <span
                    key={benefit}
                    className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs text-slate-200"
                  >
                    {benefit}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </GlassCard>

        <div className="grid gap-4">
          {PUBLIC_APPS.slice(1, 4).map((app) => (
            <GlassCard
              key={app.slug}
              eyebrow={app.title}
              title={app.tagline}
              description={app.summary}
              interactive
            />
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {PUBLIC_APPS.map((app) => (
          <GlassCard
            key={app.slug}
            eyebrow={app.integration}
            title={app.title}
            description={app.summary}
            interactive
            actions={
              <Link
                href={`/apps/${app.slug}`}
                className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-200 hover:border-cyan-400/40 hover:text-cyan-300"
              >
                Abrir
              </Link>
            }
          >
            <div className="flex flex-wrap gap-2">
              {app.benefits.map((benefit) => (
                <span
                  key={benefit}
                  className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-slate-300"
                >
                  {benefit}
                </span>
              ))}
            </div>
          </GlassCard>
        ))}
      </div>
    </PageShell>
  );
}
