import type { Metadata } from "next";
import NovaLocalPreflight from "@/components/NovaLocalPreflight";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const metadata: Metadata = {
  title: "NOVA Local — WebGPU",
  description: "Diagnóstico privado de inferencia local opcional.",
  robots: { index: false, follow: false, noarchive: true },
};
export default function NovaLocalPreflightPage() {
  return <NovaLocalPreflight />;
}
