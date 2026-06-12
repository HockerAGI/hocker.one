import type { Metadata } from "next";
import DashboardClient from "@/components/dashboard/DashboardClient";
import { buildDashboardSummary } from "@/lib/hocker-dashboard-server";

export const metadata: Metadata = {
  title: "Dashboard | Hocker ONE",
  description: "Resumen ejecutivo del ecosistema HOCKER.",
};

export default async function DashboardPage() {
  const summary = await buildDashboardSummary();
  return <DashboardClient summary={summary} />;
}
