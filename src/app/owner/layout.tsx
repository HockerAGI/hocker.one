import type { Metadata } from "next";
import type { ReactNode } from "react";
import { requirePrivateSession } from "@/lib/require-private-session";

export const metadata: Metadata = {
  title: {
    default: "Owner | Hocker ONE",
    template: "%s | Owner | Hocker ONE",
  },
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    nosnippet: true,
    noimageindex: true,
  },
};

export const dynamic = "force-dynamic";

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  await requirePrivateSession();
  return children;
}
