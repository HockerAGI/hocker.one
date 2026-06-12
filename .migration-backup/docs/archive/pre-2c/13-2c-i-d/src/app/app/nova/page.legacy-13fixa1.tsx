import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "NOVA · Hocker ONE",
  description: "Chat privado con NOVA.",
  robots: { index: false, follow: false },
};

export { default } from "../../chat/page";
