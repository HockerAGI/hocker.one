import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requirePrivateSession } from "@/lib/require-private-session";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Ecosistema | Hocker ONE", robots: { index: false, follow: false, noarchive: true } };

export default async function OwnerAliasPage() {
  await requirePrivateSession();
  redirect("/map");
}
