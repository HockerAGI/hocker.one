export type HockerPageStatus =
  | "loading"
  | "empty"
  | "error"
  | "forbidden"
  | "partial"
  | "offline"
  | "ready";

export type PageStateProps = {
  status: HockerPageStatus;
  title?: string;
  description?: string;
  actionLabel?: string;
};

const defaultCopy: Record<Exclude<HockerPageStatus, "ready">, { title: string; description: string }> = {
  loading: {
    title: "Preparando la información",
    description: "NOVA está ordenando esta vista.",
  },
  empty: {
    title: "Nada pendiente",
    description: "Todo está en orden por ahora.",
  },
  error: {
    title: "No pude cargar esta vista",
    description: "Guardé el error para revisarlo sin riesgo.",
  },
  forbidden: {
    title: "Acceso protegido",
    description: "Esta sección requiere autorización.",
  },
  partial: {
    title: "Datos parciales",
    description: "Hay información disponible, pero falta completar una conexión.",
  },
  offline: {
    title: "Sin conexión suficiente",
    description: "Cuando vuelva la conexión, NOVA actualizará esta vista.",
  },
};

export function PageState({ status, title, description, actionLabel }: PageStateProps) {
  if (status === "ready") return null;

  const copy = defaultCopy[status];

  return (
    <section className="hocker-card p-6 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-100">
        <span aria-hidden="true">✦</span>
      </div>
      <h2 className="mt-4 text-xl font-semibold text-[var(--hocker-text-main)]">{title ?? copy.title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--hocker-text-soft)]">
        {description ?? copy.description}
      </p>

      {actionLabel ? (
        <button
          type="button"
          className="hocker-focus-ring mt-5 rounded-2xl bg-[var(--hocker-blue)] px-4 py-3 text-sm font-semibold text-white shadow-[0_0_28px_rgba(3,102,255,0.22)] transition hover:-translate-y-0.5"
        >
          {actionLabel}
        </button>
      ) : null}
    </section>
  );
}
