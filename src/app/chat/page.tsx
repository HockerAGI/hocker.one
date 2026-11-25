import type { Metadata } from "next";
import NovaRealtimeChatLazy from "@/components/NovaRealtimeChatLazy";
import { novaProtectedAvailability } from "@/lib/nova-environment";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "NOVA",
  description: "Conversación privada con NOVA bajo control del Owner.",
  robots: { index: false, follow: false, noarchive: true },
};

export default function ChatPage() {
  const availability = novaProtectedAvailability();
  return <NovaRealtimeChatLazy protectedAvailable={availability.available} preview={availability.reason === "preview"} />;
}
