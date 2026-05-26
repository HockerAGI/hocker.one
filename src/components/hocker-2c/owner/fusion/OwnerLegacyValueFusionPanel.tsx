import Link from "next/link";
import { Boxes, Cpu, ExternalLink, Network, ShieldCheck, Sparkles } from "lucide-react";
import { HOCKER_AGI_REGISTRY_2C } from "@/lib/hocker-agi-registry-2c";
import { HOCKER_SYSTEM_REGISTRY_2C } from "@/lib/hocker-system-registry-2c";
import { HOCKER_PRODUCT_BLUEPRINT_2C } from "@/lib/hocker-product-blueprint-2c";
import { HOCKER_HUMAN_COPY } from "@/lib/hocker-human-copy";
import * as LiveOperations from "@/lib/hocker-live-operations-registry";

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord {
  return value && typeof value === "object" ? (value as UnknownRecord) : {};
}

function labelOf(value: unknown): string {
  const item = asRecord(value);
  return String(item.label ?? item.name ?? item.title ?? item.id ?? item.key ?? "Nodo HOCKER");
}

function detailOf(value: unknown): string {
  const item = asRecord(value);
  return String(item.description ?? item.detail ?? item.purpose ?? item.summary ?? item.status ?? "Nodo operativo registrado.");
}

function statusOf(value: unknown): string {
  const item = asRecord(value);
  return String(item.status ?? item.state ?? item.kind ?? item.type ?? "registrado");
}

function collectOperationalItems(): unknown[] {
  const exportedValues = Object.values(LiveOperations as UnknownRecord);
  const arrays = exportedValues.filter(Array.isArray).flat() as unknown[];

  if (arrays.length > 0) return arrays.slice(0, 5);

  const objectValues = exportedValues.filter((value) => value && typeof value === "object" && !Array.isArray(value));
  if (objectValues.length > 0) return objectValues.slice(0, 5);

  return HOCKER_SYSTEM_REGISTRY_2C.slice(0, 5);
}

export function OwnerLegacyValueFusionPanel() {
  const operationalNodes = collectOperationalItems();
  const protectedSystems = HOCKER_SYSTEM_REGISTRY_2C.filter((system) => system.protected).slice(0, 4);
  const integrations = HOCKER_SYSTEM_REGISTRY_2C.filter((system) => system.kind === "integration").slice(0, 4);
  const sensitiveAgis = HOCKER_AGI_REGISTRY_2C.filter((agi) => agi.sensitive).length;

  return (
    <section className="hocker-card p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-[var(--hocker-cyan)]">Fusión legacy útil</p>
          <h2 className="mt-2 text-xl font-semibold text-white">
            Brief operativo premium sin arrastrar deuda técnica
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--hocker-text-soft)]">
            Se rescata valor de paneles legacy: estado vivo, nodos, integraciones, lenguaje ejecutivo y badges visuales.
            No se copia lógica vieja con Supabase directo ni se crean acciones nuevas.
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--hocker-gold)]/25 bg-[var(--hocker-gold)]/10 px-4 py-3 text-sm text-amber-50">
          {HOCKER_PRODUCT_BLUEPRINT_2C.category}
        </div>
      </div>

      <div className="mt-5 rounded-3xl border border-cyan-300/15 bg-cyan-300/[0.055] p-4">
        <div className="flex items-start gap-3">
          <Sparkles className="mt-1 h-5 w-5 text-cyan-100" />
          <div>
            <p className="text-sm font-semibold text-white">{HOCKER_HUMAN_COPY.private_tagline}</p>
            <p className="mt-2 text-sm leading-6 text-cyan-50/75">
              {HOCKER_PRODUCT_BLUEPRINT_2C.principle}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-3">
        <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
          <div className="flex items-center gap-2">
            <Network className="h-4 w-4 text-cyan-100" />
            <h3 className="text-sm font-semibold text-white">Nodos operativos</h3>
          </div>

          <div className="mt-3 space-y-2">
            {operationalNodes.map((node, index) => (
              <div key={`${labelOf(node)}-${index}`} className="rounded-2xl border border-white/10 bg-white/[0.045] p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-white">{labelOf(node)}</p>
                  <span className="rounded-full border border-cyan-300/15 bg-cyan-300/10 px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-cyan-50">
                    {statusOf(node)}
                  </span>
                </div>
                <p className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--hocker-text-soft)]">{detailOf(node)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
          <div className="flex items-center gap-2">
            <ExternalLink className="h-4 w-4 text-cyan-100" />
            <h3 className="text-sm font-semibold text-white">Integraciones</h3>
          </div>

          <div className="mt-3 space-y-2">
            {integrations.map((system) => (
              <Link
                key={system.id}
                href="/owner/apps"
                className="block rounded-2xl border border-white/10 bg-white/[0.045] p-3 transition hover:bg-white/[0.08]"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-white">{system.visibleName}</p>
                  <span className="text-xs text-[var(--hocker-text-muted)]">{system.status}</span>
                </div>
                <p className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--hocker-text-soft)]">{system.purpose}</p>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-amber-100" />
            <h3 className="text-sm font-semibold text-white">Protección</h3>
          </div>

          <div className="mt-3 grid gap-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-3">
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--hocker-text-muted)]">AGIs sensibles</p>
              <p className="mt-2 text-2xl font-semibold text-white">{sensitiveAgis}</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-3">
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--hocker-text-muted)]">Sistemas protegidos</p>
              <p className="mt-2 text-2xl font-semibold text-white">{protectedSystems.length}</p>
            </div>

            <div className="rounded-2xl border border-[var(--hocker-gold)]/20 bg-[var(--hocker-gold)]/10 p-3">
              <p className="text-xs leading-5 text-amber-50/80">
                Nada sensible se ejecuta sin aprobación owner. La fusión sólo muestra contexto operativo.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <Link href="/owner/ecosystem" className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.055] px-3 py-2 text-sm text-white transition hover:bg-white/[0.09]">
          <Boxes className="h-4 w-4" />
          Ver ecosistema
        </Link>
        <Link href="/owner/agis" className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.055] px-3 py-2 text-sm text-white transition hover:bg-white/[0.09]">
          <Cpu className="h-4 w-4" />
          Ver AGIs
        </Link>
      </div>
    </section>
  );
}
