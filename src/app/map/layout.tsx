import type { ReactNode } from "react";
import { requirePrivateSession } from "@/lib/require-private-session";

export const dynamic = "force-dynamic";

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  await requirePrivateSession();
  return children;
}
