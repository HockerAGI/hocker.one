import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Pendientes · Hocker ONE",
  description: "Tareas y acciones pendientes bajo aprobación.",
  robots: { index: false, follow: false },
};

export { default } from "../../commands/page";
