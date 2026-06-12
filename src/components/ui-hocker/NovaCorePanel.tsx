import Link from "next/link";
import { APP_REGISTRY, AGI_REGISTRY } from "@/lib/hocker-dashboard";
import ModuleLogoFrame from "@/components/ui-hocker/ModuleLogoFrame";
import StatusBadge from "@/components/ui-hocker/StatusBadge";

export default function NovaCorePanel({ variant = "owner" }: { variant?: "owner" | "nova" }) {
  const hockerOne = APP_REGISTRY.find((app) => app.key === "hocker-one") ?? APP_REGISTRY[0];
  const nova = AGI_REGISTRY.find((agi) => agi.key === "nova") ?? AGI_REGISTRY[0];
  const isNova = variant === "nova";
  const protectedItems = [...APP_REGISTRY, ...AGI_REGISTRY].filter((item) => item.status === "protected").length;
  const workInProgress = [...APP_REGISTRY, ...AGI_REGISTRY].filter((item) => item.status === "integration" || item.status === "development" || item.status === "pending").length;

  const title = isNova ? "NOVA" : "Hocker ONE";
  const text = isNova
    ? "IA madre del ecosistema. Coordina criterio, memoria, seguridad, operación y decisiones desde un núcleo central."
    : "Tu centro de control privado. Aquí revisas apps, AGIs, seguridad, tareas y estado general sin ruido técnico.";
  const visualSrc = isNova ? (nova.iconSrc ?? nova.logoSrc) : (hockerOne.iconSrc ?? hockerOne.logoSrc);
  const accent = isNova ? nova.accent : hockerOne.accent;

  return (
    <section className="hko-nova-panel hko-fade-up">
      <div className="relative z-10 grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <ModuleLogoFrame title={title} src={visualSrc} kind={isNova ? "nova" : "app"} accent={accent} size="lg" />
          <div>
            <div className="mb-3 flex flex-wrap gap-2">
              <StatusBadge status="live" />
              <StatusBadge status="protected" />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">{title}</h1>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">{text}</p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
          <div className="hko-mini-stat"><span>Sistema</span><strong>Activo</strong></div>
          <div className="hko-mini-stat"><span>{isNova ? "AGIs registradas" : "Apps registradas"}</span><strong>{isNova ? AGI_REGISTRY.length : APP_REGISTRY.length}</strong></div>
          <div className="hko-mini-stat"><span>{isNova ? "En proceso" : "Protecciones"}</span><strong>{isNova ? workInProgress : protectedItems}</strong></div>
        </div>
      </div>

      <div className="relative z-10 mt-6 flex flex-wrap gap-3">
        {isNova ? (
          <>
            <Link href="/chat" className="hko-action-primary">Hablar con NOVA</Link>
            <Link href="/agis" className="hko-action-secondary">Ver AGIs</Link>
            <Link href="/status" className="hko-action-secondary">Estado general</Link>
          </>
        ) : (
          <>
            <Link href="/apps" className="hko-action-primary">Ver apps</Link>
            <Link href="/agis" className="hko-action-secondary">Ver AGIs</Link>
            <Link href="/status" className="hko-action-secondary">Estado general</Link>
          </>
        )}
      </div>
    </section>
  );
}
