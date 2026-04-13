export type ExternalServiceStatus = "live" | "pending" | "offline";

export type ExternalServiceItem = {
  key: string;
  title: string;
  subtitle: string;
  kind: "orchestrator" | "agent";
  endpoint: string;
  status: ExternalServiceStatus;
  note: string;
  lastCheckedAt: string;
};

function withTimeout(timeoutMs: number): { controller: AbortController; cleanup: () => void } {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  return {
    controller,
    cleanup: () => clearTimeout(timeoutId),
  };
}

async function checkHealth(endpoint: string): Promise<boolean> {
  const { controller, cleanup } = withTimeout(2500);

  try {
    const res = await fetch(new URL("/health", endpoint), {
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "Cache-Control": "no-cache",
      },
    });

    return res.ok;
  } catch {
    return false;
  } finally {
    cleanup();
  }
}

export async function resolveExternalServices(): Promise<ExternalServiceItem[]> {
  const now = new Date().toISOString();

  const novaAgiUrl = String(process.env.NOVA_AGI_URL ?? "").trim();
  const nodeAgentUrl = String(process.env.HOCKER_NODE_AGENT_URL ?? "").trim();

  const services: ExternalServiceItem[] = [
    {
      key: "nova.agi",
      title: "nova.agi",
      subtitle: "Orquestador IA por HTTP.",
      kind: "orchestrator",
      endpoint: novaAgiUrl || "no-configurado",
      status: "pending",
      note: "Recibe requests desde Hocker ONE, guarda memoria y decide rutas.",
      lastCheckedAt: now,
    },
    {
      key: "hocker-node-agent",
      title: "hocker-node-agent",
      subtitle: "Ejecutor físico por polling.",
      kind: "agent",
      endpoint: nodeAgentUrl || "no-configurado",
      status: "pending",
      note: "Ejecuta comandos firmados dentro de sandbox controlado.",
      lastCheckedAt: now,
    },
  ];

  const checked = await Promise.all(
    services.map(async (service) => {
      if (service.endpoint === "no-configurado") return service;

      const healthy = await checkHealth(service.endpoint);

      return {
        ...service,
        status: healthy ? "live" : "offline",
        lastCheckedAt: new Date().toISOString(),
      } satisfies ExternalServiceItem;
    }),
  );

  return checked;
}

export function externalStatusLabel(status: ExternalServiceStatus): string {
  switch (status) {
    case "live":
      return "Activo";
    case "offline":
      return "Sin señal";
    case "pending":
    default:
      return "Pendiente";
  }
}

export function externalStatusTone(status: ExternalServiceStatus): string {
  switch (status) {
    case "live":
      return "bg-emerald-500/15 text-emerald-300 border-emerald-400/20";
    case "offline":
      return "bg-rose-500/15 text-rose-300 border-rose-400/20";
    case "pending":
    default:
      return "bg-white/5 text-slate-300 border-white/10";
  }
}