import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Estado de NOVA | Hocker ONE",
  description: "Canal privado de NOVA con health check y conexión verificable.",
  robots: { index: false, follow: false, noarchive: true },
};

export { default } from "../../chat/page";
