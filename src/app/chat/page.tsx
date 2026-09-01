import type { Metadata } from "next";
import NovaRealtimeChatLazy from "@/components/NovaRealtimeChatLazy";
import OperationalRealtimeBridge from "@/components/OperationalRealtimeBridge";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "NOVA",
  description: "Conversación privada con NOVA bajo control del Owner.",
  robots: { index: false, follow: false, noarchive: true },
};

export default function ChatPage() {
  const projectId = process.env.NEXT_PUBLIC_HOCKER_PROJECT_ID || "hocker-one";

  return (
    <>
      <OperationalRealtimeBridge projectId={projectId} />
      <NovaRealtimeChatLazy />
    </>
  );
}
