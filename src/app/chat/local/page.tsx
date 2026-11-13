import type { Metadata } from "next";
import NovaLocalPreflight from "@/components/NovaLocalPreflight";
import { requireProjectRole } from "@/app/api/_lib";
import { redirect } from "next/navigation";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const metadata: Metadata = {
  title: "NOVA Local — WebGPU",
  description: "Diagnóstico privado de inferencia local opcional.",
  robots: { index: false, follow: false, noarchive: true },
};
export default async function NovaLocalPreflightPage() {
  try {
    await requireProjectRole("hocker-one", ["owner", "admin", "operator", "viewer"]);
  } catch {
    redirect("/login");
  }
  return <NovaLocalPreflight />;
}
