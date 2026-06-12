import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Inicio · Hocker ONE",
  description: "Inicio privado de Hocker ONE.",
  robots: { index: false, follow: false },
};

export { default } from "../dashboard/page";
