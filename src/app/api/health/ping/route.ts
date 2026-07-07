import { NextResponse } from "next/server";

export const runtime = "edge";
export const dynamic = "force-dynamic";

/**
 * Public health ping — no authentication required.
 * Returns minimal status for external monitors (UptimeRobot, Vercel cron, load balancers).
 * Detailed health checks remain at /api/health (requires Owner Gate).
 */
export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      status: "online",
      timestamp: new Date().toISOString(),
      service: "hocker-one",
    },
    { status: 200 },
  );
}
