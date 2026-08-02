import type { Metadata } from "next";
import OperationsDiscovery from "@/components/operations/OperationsDiscovery";
import { getHockerOperationalSnapshot } from "@/lib/hocker-operational-state";
import { buildVerifiedOperationsCatalog } from "@/lib/verified-operations-catalog";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Catálogo operativo | Hocker ONE",
  description: "Buscador interno enriquecido con estado verificable de apps, AGIs, servicios y herramientas.",
  robots: { index: false, follow: false, noarchive: true },
};

export default async function OperationsCatalogPage() {
  const snapshot = await getHockerOperationalSnapshot();
  const items = buildVerifiedOperationsCatalog(snapshot);

  return (
    <main className="pb-28">
      <OperationsDiscovery items={items} />
    </main>
  );
}
