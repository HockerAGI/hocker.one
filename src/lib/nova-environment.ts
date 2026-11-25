import "server-only";

export function novaProtectedAvailability() {
  if (process.env.VERCEL_ENV === "preview") return { available: false, reason: "preview" as const };
  const url = (process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY ?? "").trim();
  return url && key ? { available: true, reason: "configured" as const } : { available: false, reason: "storage" as const };
}
export const NOVA_PROTECTED_UNAVAILABLE = "La conversación persistente no está disponible en este entorno.";
