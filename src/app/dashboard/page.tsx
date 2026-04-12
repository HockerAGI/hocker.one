import type { Metadata } from "next";
import DashboardClient from "@/components/dashboard/DashboardClient";
import { buildDashboardSummary } from "@/lib/hocker-dashboard";

export const metadata: Metadata = {
  title: "Hocker ONE",
  description: "Dashboard maestro del ecosistema Hocker",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardPage() {
  const summary = await buildDashboardSummary();
  return <DashboardClient summary={summary} />;
}