import type { Metadata } from "next";
import NovaWorkspace from "@/components/nova/NovaWorkspace";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "NOVA · Hocker ONE",
  description: "Workspace privado de NOVA con aprobación, evidencia y ejecución controlada.",
  robots: { index: false, follow: false, noarchive: true },
};

export default function ChatPage() {
  return <NovaWorkspace />;
}
