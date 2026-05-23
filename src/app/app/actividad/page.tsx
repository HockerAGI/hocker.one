import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Actividad · Hocker ONE",
  description: "Actividad operativa en vivo.",
  robots: { index: false, follow: false },
};

export { default } from "../../live/page";
