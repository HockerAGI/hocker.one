import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Ecosistema privado · Hocker ONE",
  description: "Mapa privado del ecosistema operativo HOCKER.",
  robots: { index: false, follow: false },
};

export { default } from "../../map/page";
