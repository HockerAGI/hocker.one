import Link from "next/link";
import { APP_REGISTRY, AGI_REGISTRY } from "@/lib/hocker-dashboard";
import ModuleLogoFrame from "@/components/ui-hocker/ModuleLogoFrame";
import StatusBadge from "@/components/ui-hocker/StatusBadge";

export default function NovaCorePanel() {
  const nova = AGI_REGISTRY.find((agi) => agi.key === "nova") ?? AGI_REGISTRY[0];
  const activeApps = APP_REGISTRY.filter((app) => app.status === "live").length;
  const protectedItems = [...APP_REGISTRY, ...AGI_REGISTRY].filter((item) => item.status === "protected").length;

  return (
    <section className="hko-nova-panel hko-fade-up">
      <div className="relative z-10 grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <ModuleLogoFrame title="NOVA" src={nova.logoSrc} kind="nova" accent="cyan" size="lg" />
          <div>
            <div className="mb-3 flex flex-wrap gap-2">
              <StatusBadge status="live" />
              <StatusBadge status="protected" />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">
              Hocker ONE
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
              Tu centro de control privado. Aquí revisas apps, AGIs, seguridad, tareas y estado general sin ruido técnico.
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
          <div className="hko-mini-stat">
            <span>Sistema</span>
            <strong>Activo</strong>
          </div>
          <div className="hko-mini-stat">
            <span>Apps activas</span>
            <strong>{activeApps}</strong>
          </div>
          <div className="hko-mini-stat">
            <span>Protecciones</span>
            <strong>{protectedItems}</strong>
          </div>
        </div>
      </div>

      <div className="relative z-10 mt-6 flex flex-wrap gap-3">
        <Link href="/apps" className="hko-action-primary">Ver apps</Link>
        <Link href="/agis" className="hko-action-secondary">Ver AGIs</Link>
        <Link href="/status" className="hko-action-secondary">Estado general</Link>
      </div>
    </section>
  );
}
