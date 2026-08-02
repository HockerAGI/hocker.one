import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "NOVA Chat | Hocker ONE",
  description: "Canal privado con estado de conexión verificable.",
  robots: { index: false, follow: false, noarchive: true },
};

export { default } from "../../chat/page";
