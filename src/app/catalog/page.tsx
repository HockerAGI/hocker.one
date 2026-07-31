import type { Metadata } from "next";
import OperationsDiscovery from "@/components/operations/OperationsDiscovery";
import { OPERATIONS_CATALOG } from "@/lib/operations-catalog";

export const metadata: Metadata = {
  title: "Catálogo operativo | Hocker ONE",
  description: "Buscador interno de apps, AGIs, servicios, herramientas y áreas del ecosistema.",
};

export default function OperationsCatalogPage() {
  return (
    <main className="pb-28">
      <OperationsDiscovery items={OPERATIONS_CATALOG} />
    </main>
  );
}
