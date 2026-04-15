import DashboardClient from "@/components/dashboard/DashboardClient";
import { buildDashboardSummary } from "@/lib/hocker-dashboard-server";

export const metadata = { title: "Dashboard | Hocker ONE" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const summary = await buildDashboardSummary();
  return <DashboardClient summary={summary} />;
}
