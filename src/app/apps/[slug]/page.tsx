import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import PageShell from "@/components/PageShell";
import { GlassCard } from "@/components/system";
import { PUBLIC_APPS, getPublicApp } from "@/lib/public-catalog";

type Params = { slug: string };

export function generateStaticParams() {
  return PUBLIC_APPS.map((app) => ({ slug: app.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const app = getPublicApp(slug);

  if (!app) {
    return { title: "Producto no encontrado | Hocker AGI Technologies" };
  }

  return {
    title: `${app.title} | Hocker AGI Technologies`,
    description: app.summary,
  };
}

export default async function AppDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const app = getPublicApp(slug);

  if (!app) notFound();

  return (
    <PageShell
      eyebrow="Apps"
      title={app.title}
      description={app.tagline}
      actions={
        <>
          <Link
            href="/contacto"
            className="rounded-xl bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-300"
          >
            Solicitar esta solución
          </Link>

          <Link
            href="/apps"
            className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-200 hover:border-cyan-400/40 hover:text-cyan-300"
          >
            Volver a Apps
          </Link>
        </>
      }
    >
      <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <GlassCard
          eyebrow={app.integration}
          title={app.summary}
          description={app.audience}
          interactive
        >
          <div className="overflow-hidden rounded-[28px] border border-white/10 bg-black/20">
            <Image
              src={app.asset.cover}
              alt={app.title}
              width={1200}
              height={630}
              priority
              className="h-full w-full object-cover"
            />
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {app.benefits.map((benefit) => (
              <span
                key={benefit}
                className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs text-slate-200"
              >
                {benefit}
              </span>
            ))}
          </div>
        </GlassCard>

        <div className="space-y-4">
          <GlassCard
            eyebrow="Qué resuelve"
            title={app.title}
            description={app.summary}
          />

          <GlassCard
            eyebrow="A quién ayuda"
            title={app.audience}
            description="Pensado para equipos y marcas que buscan claridad, velocidad y una presencia más sólida."
          />

          <GlassCard
            eyebrow="Cómo encaja"
            title={app.integration}
            description="Se integra con la lógica del ecosistema para operar con menos fricción."
          />
        </div>
      </div>
    </PageShell>
  );
}
