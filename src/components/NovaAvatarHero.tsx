"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  Brain,
  ShieldCheck,
  Sparkles,
  Waves,
} from "lucide-react";

type AssetFrameProps = {
  src: string;
  alt: string;
  label: string;
  caption: string;
  className?: string;
  priority?: boolean;
};

function AssetFrame({
  src,
  alt,
  label,
  caption,
  className = "",
  priority = false,
}: AssetFrameProps) {
  const [broken, setBroken] = useState(false);

  return (
    <div
      className={[
        "relative overflow-hidden rounded-[28px] border border-white/5 bg-white/[0.03] shadow-[0_18px_70px_rgba(2,6,23,0.24)] backdrop-blur-2xl",
        className,
      ].join(" ")}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.12),transparent_36%)]" />

      <div className="relative aspect-[4/5] w-full overflow-hidden">
        {!broken ? (
          <Image
            src={src}
            alt={alt}
            fill
            priority={priority}
            sizes="(max-width: 768px) 100vw, 50vw"
            onError={() => setBroken(true)}
            className="object-cover object-center transition-transform duration-700 hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.18),transparent_45%),linear-gradient(180deg,rgba(15,23,42,0.8),rgba(2,6,23,0.95))] p-6">
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[24px] border border-white/10 bg-white/[0.05]">
                <Sparkles className="h-6 w-6 text-sky-300" />
              </div>
              <p className="mt-4 text-sm font-black uppercase tracking-[0.34em] text-white">
                NOVA
              </p>
              <p className="mt-2 text-xs text-slate-400">
                Asset no encontrado
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="relative border-t border-white/5 bg-slate-950/60 px-4 py-3">
        <p className="text-[10px] font-black uppercase tracking-[0.34em] text-sky-300">
          {label}
        </p>
        <p className="mt-1 text-sm text-slate-300">{caption}</p>
      </div>
    </div>
  );
}

function MiniMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[22px] border border-white/5 bg-white/[0.03] px-3 py-3 shadow-[0_14px_50px_rgba(2,6,23,0.18)]">
      <p className="text-[10px] font-black uppercase tracking-[0.32em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

type NovaAvatarHeroProps = {
  className?: string;
};

export default function NovaAvatarHero({ className = "" }: NovaAvatarHeroProps) {
  return (
    <section
      className={[
        "relative overflow-hidden rounded-[38px] border border-white/5 bg-white/[0.03] p-4 shadow-[0_30px_120px_rgba(2,6,23,0.28)] backdrop-blur-3xl sm:p-5",
        className,
      ].join(" ")}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.16),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.10),transparent_32%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-sky-400/70 to-transparent" />

      <div className="relative grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
        <div className="nova-avatar-shell relative overflow-hidden p-4 sm:p-5">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.20),transparent_52%)]" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[linear-gradient(180deg,rgba(56,189,248,0.12),transparent)] opacity-70" />

          <div className="relative flex items-center justify-between gap-4">
            <div>
              <p className="hocker-title-line">NOVA · Avatar oficial</p>
              <h2 className="mt-2 text-xl font-black tracking-tight text-white sm:text-2xl">
                Rostro fijo, presencia viva
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-400">
                La IA madre del ecosistema, con identidad única y outfits autorizados
                para web, PWA, APK y Play Store.
              </p>
            </div>

            <div className="hidden rounded-full border border-sky-400/15 bg-sky-400/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.32em] text-sky-200 md:flex">
              Motion ready
            </div>
          </div>

          <div className="relative mt-5 overflow-hidden rounded-[32px] border border-white/5 bg-slate-950/60 p-3 shadow-[0_20px_80px_rgba(2,6,23,0.36)]">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.16),transparent_45%)]" />
            <div className="relative aspect-[3/4] overflow-hidden rounded-[28px] border border-white/5 bg-[linear-gradient(180deg,rgba(15,23,42,0.72),rgba(2,6,23,0.96))]">
              <Image
                src="/nova/avatar/nova-avatar-face-official.jpeg"
                alt="NOVA avatar oficial"
                fill
                priority
                sizes="(max-width: 1280px) 100vw, 60vw"
                className="object-cover object-top"
              />

              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.08),rgba(2,6,23,0.46))]" />
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:34px_34px] opacity-15" />

              <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                <span className="rounded-full border border-white/10 bg-slate-950/70 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.34em] text-slate-200 backdrop-blur-xl">
                  Official
                </span>
                <span className="rounded-full border border-sky-400/15 bg-sky-400/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.34em] text-sky-200 backdrop-blur-xl">
                  NOVA 2025
                </span>
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5">
                <div className="rounded-[26px] border border-white/5 bg-slate-950/65 p-4 shadow-[0_18px_70px_rgba(2,6,23,0.34)] backdrop-blur-2xl">
                  <div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                    <Sparkles className="h-3.5 w-3.5 text-sky-300" />
                    <span>Rostro oficial</span>
                    <span>·</span>
                    <span>Sin modificaciones</span>
                    <span>·</span>
                    <span>Lealtad total</span>
                  </div>

                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    <MiniMetric label="Estado" value="Lista" />
                    <MiniMetric label="Modo" value="Operativo" />
                    <MiniMetric label="Voz" value="Preparada" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-[22px] border border-white/5 bg-white/[0.03] px-3 py-3">
              <p className="text-[10px] font-black uppercase tracking-[0.32em] text-slate-500">
                Núcleo
              </p>
              <p className="mt-1 text-sm font-semibold text-white">Orquestación</p>
            </div>

            <div className="rounded-[22px] border border-white/5 bg-white/[0.03] px-3 py-3">
              <p className="text-[10px] font-black uppercase tracking-[0.32em] text-slate-500">
                Base
              </p>
              <p className="mt-1 text-sm font-semibold text-white">Avatar único</p>
            </div>

            <div className="rounded-[22px] border border-white/5 bg-white/[0.03] px-3 py-3">
              <p className="text-[10px] font-black uppercase tracking-[0.32em] text-slate-500">
                Uso
              </p>
              <p className="mt-1 text-sm font-semibold text-white">Multi-plataforma</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <AssetFrame
            src="/nova/avatar/nova-avatar-outfit-corporate.jpeg"
            alt="NOVA outfit corporate"
            label="Corporate Outfit"
            caption="Línea ejecutiva para paneles, branding e ինտերfaces institucionales."
            priority
            className="h-full"
          />

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
            <AssetFrame
              src="/nova/avatar/nova-avatar-outfit-cyber.jpeg"
              alt="NOVA outfit cyber"
              label="Cyber Outfit"
              caption="Modo cinematográfico para entradas, promos y piezas hero."
              className="h-full"
            />

            <div className="rounded-[28px] border border-white/5 bg-white/[0.03] p-4 shadow-[0_18px_70px_rgba(2,6,23,0.22)] backdrop-blur-2xl">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-sky-400/15 bg-sky-400/10">
                  <Waves className="h-5 w-5 text-sky-300" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.34em] text-sky-300">
                    Motion / Brand
                  </p>
                  <p className="mt-1 text-sm text-slate-300">
                    Animación lista para pantallas, PWA y loading.
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-[24px] border border-white/5 bg-slate-950/55 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.34em] text-slate-500">
                      Ready
                    </p>
                    <p className="mt-1 text-sm font-semibold text-white">
                      Avatar vivo
                    </p>
                  </div>

                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03]">
                    <ShieldCheck className="h-5 w-5 text-sky-300" />
                  </div>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-slate-400">
                  NOVA queda lista para presentarse como entidad visual principal del ecosistema.
                </p>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full border border-white/5 bg-white/[0.03] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">
                  Web
                </span>
                <span className="rounded-full border border-white/5 bg-white/[0.03] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">
                  PWA
                </span>
                <span className="rounded-full border border-white/5 bg-white/[0.03] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">
                  APK
                </span>
                <span className="rounded-full border border-white/5 bg-white/[0.03] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">
                  Store
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-sky-400/60 to-transparent" />
    </section>
  );
}
