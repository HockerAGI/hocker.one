import type { Metadata } from "next";
import DashboardClient from "@/components/dashboard/DashboardClient";
import { getDashboardSummary } from "@/lib/hocker-dashboard-server";

export const metadata: Metadata = {
  title: "Dashboard | Hocker ONE",
  description: "Panel de control central de Hocker AGI Technologies",
};

// Forzamos el renderizado dinámico para asegurar que las métricas de Supabase 
// se actualicen en tiempo real en cada carga.
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  // La extracción de datos ocurre exclusivamente en el servidor (Node.js/Edge),
  // eliminando la carga de procesamiento y secretos del navegador.
  const summary = await getDashboardSummary();

  return (
    <main className="relative min-h-screen bg-transparent">
      <DashboardClient summary={summary} />
    </main>
  );
}