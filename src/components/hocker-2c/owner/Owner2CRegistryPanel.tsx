import Link from "next/link";
import {
  HOCKER_AGI_REGISTRY_2C,
  HOCKER_AGI_REGISTRY_2C_VERSION,
} from "@/lib/hocker-agi-registry-2c";
import {
  HOCKER_SYSTEM_REGISTRY_2C,
  HOCKER_SYSTEM_REGISTRY_2C_VERSION,
} from "@/lib/hocker-system-registry-2c";
import {
  HOCKER_OWNER_ROUTE_HARDENING_2C,
  HOCKER_OWNER_ROUTES_2C,
} from "@/lib/hocker-owner-routes-2c";
import { HOCKER_PERMISSIONS_2C } from "@/lib/hocker-permissions";
import { HOCKER_PRODUCT_BLUEPRINT_2C } from "@/lib/hocker-product-blueprint-2c";
import { HOCKER_DEFAULT_SERVICE_CONFIGS_2C } from "@/lib/hocker-service-config";

const statusLabel: Record<string, string> = {
  live: "Activo",
  ready: "Listo",
  protected: "Protegido",
  building: "En desarrollo",
  blocked: "Bloqueado",
};

function formatStatus(status: string) {
  return statusLabel[status] ?? status;
}

export function Owner2CRegistryPanel() {
  const liveAgis = HOCKER_AGI_REGISTRY_2C.filter((agi) => agi.status === "live").length;
  const sensitiveAgis = HOCKER_AGI_REGISTRY_2C.filter((agi) => agi.sensitive).length;
  const protectedSystems = HOCKER_SYSTEM_REGISTRY_2C.filter((system) => system.protected).length;
  const permissionCount = Object.keys(HOCKER_PERMISSIONS_2C).length;
  const serviceCount = Object.keys(HOCKER_DEFAULT_SERVICE_CONFIGS_2C).length;

  const agiPreview = HOCKER_AGI_REGISTRY_2C.slice(0, 6);
  const systemPreview = HOCKER_SYSTEM_REGISTRY_2C.slice(0, 6);
  const permissionPreview = Object.entries(HOCKER_PERMISSIONS_2C).slice(0, 6);

  return (
    <section className="hocker-card p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-[var(--hocker-cyan)]">
            Registros 2C conectados
          </p>
          <h2 className="mt-2 text-xl font-semibold text-white">
            La base oficial de Hocker ONE ya alimenta el Owner Center
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--hocker-text-soft)]">
            Esta vista usa imports reales de los registries 2C. No es mock, no ejecuta acciones y no modifica datos.
          </p>
        </div>

        <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 text-sm text-cyan-50">
          AGI {HOCKER_AGI_REGISTRY_2C_VERSION} · Sistema {HOCKER_SYSTEM_REGISTRY_2C_VERSION}
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-3xl border border-white/10 bg-white/[0.045] p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--hocker-text-muted)]">AGIs</p>
          <strong className="mt-2 block text-3xl text-white">{HOCKER_AGI_REGISTRY_2C.length}</strong>
          <p className="mt-2 text-sm text-[var(--hocker-text-soft)]">{liveAgis} activa · {sensitiveAgis} sensibles</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.045] p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--hocker-text-muted)]">Sistemas</p>
          <strong className="mt-2 block text-3xl text-white">{HOCKER_SYSTEM_REGISTRY_2C.length}</strong>
          <p className="mt-2 text-sm text-[var(--hocker-text-soft)]">{protectedSystems} protegidos</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.045] p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--hocker-text-muted)]">Rutas owner</p>
          <strong className="mt-2 block text-3xl text-white">{HOCKER_OWNER_ROUTES_2C.length}</strong>
          <p className="mt-2 text-sm text-[var(--hocker-text-soft)]">Privadas por defecto</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.045] p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--hocker-text-muted)]">Permisos</p>
          <strong className="mt-2 block text-3xl text-white">{permissionCount}</strong>
          <p className="mt-2 text-sm text-[var(--hocker-text-soft)]">Owner/admin/client</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.045] p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--hocker-text-muted)]">Servicios</p>
          <strong className="mt-2 block text-3xl text-white">{serviceCount}</strong>
          <p className="mt-2 text-sm text-[var(--hocker-text-soft)]">Client Shell listo</p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-3">
        <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
          <h3 className="text-sm font-semibold text-white">AGIs principales</h3>
          <div className="mt-3 space-y-2">
            {agiPreview.map((agi) => (
              <div key={agi.id} className="rounded-2xl bg-white/[0.045] px-3 py-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-white">{agi.name}</span>
                  <span className="text-xs text-[var(--hocker-text-muted)]">{formatStatus(agi.status)}</span>
                </div>
                <p className="mt-1 text-xs leading-5 text-[var(--hocker-text-soft)]">{agi.clientLabel}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
          <h3 className="text-sm font-semibold text-white">Sistemas y apps</h3>
          <div className="mt-3 space-y-2">
            {systemPreview.map((system) => (
              <div key={system.id} className="rounded-2xl bg-white/[0.045] px-3 py-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-white">{system.name}</span>
                  <span className="text-xs text-[var(--hocker-text-muted)]">{formatStatus(system.status)}</span>
                </div>
                <p className="mt-1 text-xs leading-5 text-[var(--hocker-text-soft)]">{system.visibleName}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
          <h3 className="text-sm font-semibold text-white">Rutas owner</h3>
          <div className="mt-3 space-y-2">
            {HOCKER_OWNER_ROUTES_2C.slice(0, 6).map((route) => (
              <Link
                key={route.href}
                href={route.href}
                className="block rounded-2xl bg-white/[0.045] px-3 py-3 text-sm text-white transition hover:bg-white/[0.08]"
              >
                <span className="font-medium">{route.label}</span>
                <span className="mt-1 block text-xs leading-5 text-[var(--hocker-text-muted)]">
                  {route.technicalMode ? "Modo técnico owner" : "Vista owner simple"}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-3xl border border-[var(--hocker-gold)]/20 bg-[var(--hocker-gold)]/10 p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-amber-100/70">Producto 2C</p>
        <h3 className="mt-2 text-lg font-semibold text-white">
          {HOCKER_PRODUCT_BLUEPRINT_2C.productName} · {HOCKER_PRODUCT_BLUEPRINT_2C.category}
        </h3>
        <p className="mt-2 text-sm leading-6 text-amber-50/80">
          {HOCKER_PRODUCT_BLUEPRINT_2C.publicPromise}
        </p>
        <p className="mt-2 text-sm leading-6 text-amber-50/70">
          {HOCKER_PRODUCT_BLUEPRINT_2C.principle}
        </p>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-black/15 p-3">
            <p className="text-xs uppercase tracking-[0.18em] text-amber-100/60">Robots privado</p>
            <p className="mt-2 text-xs leading-5 text-white">{HOCKER_OWNER_ROUTE_HARDENING_2C.robots}</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/15 p-3">
            <p className="text-xs uppercase tracking-[0.18em] text-amber-100/60">Permisos clave</p>
            <p className="mt-2 text-xs leading-5 text-white">
              {permissionPreview.map(([key]) => key).join(" · ")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
