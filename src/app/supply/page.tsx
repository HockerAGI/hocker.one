import type { Metadata } from "next";
import Link from "next/link";
import { Database, Package, RefreshCw, ShoppingCart, Warehouse } from "lucide-react";

import HockerPageHeader from "@/components/ui-hocker/HockerPageHeader";
import { createAdminSupabase } from "@/lib/supabase-admin";
import { getHockerOperationalSnapshot } from "@/lib/hocker-operational-state";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Supply | Hocker ONE",
  description: "Registros operativos de productos, stock y pedidos de Hocker Supply.",
  robots: { index: false, follow: false, noarchive: true },
};

type SupplySummary = {
  ok: boolean;
  error: string | null;
  checkedAt: string;
  products: number;
  activeProducts: number;
  stockUnits: number;
  orders: number;
  pendingOrders: number;
  latestActivityAt: string | null;
};

async function loadSupplySummary(): Promise<SupplySummary> {
  const checkedAt = new Date().toISOString();
  try {
    const sb = createAdminSupabase();
    const [products, activeProducts, stockRows, orders, pendingOrders, latestProduct, latestOrder] = await Promise.all([
      sb.from("supply_products").select("*", { count: "exact", head: true }).eq("project_id", "hocker-one"),
      sb.from("supply_products").select("*", { count: "exact", head: true }).eq("project_id", "hocker-one").eq("active", true),
      sb.from("supply_products").select("stock").eq("project_id", "hocker-one"),
      sb.from("supply_orders").select("*", { count: "exact", head: true }).eq("project_id", "hocker-one"),
      sb.from("supply_orders").select("*", { count: "exact", head: true }).eq("project_id", "hocker-one").in("status", ["pending", "queued", "processing"]),
      sb.from("supply_products").select("updated_at").eq("project_id", "hocker-one").order("updated_at", { ascending: false }).limit(1).maybeSingle(),
      sb.from("supply_orders").select("updated_at").eq("project_id", "hocker-one").order("updated_at", { ascending: false }).limit(1).maybeSingle(),
    ]);
    const firstError = [
      products.error,
      activeProducts.error,
      stockRows.error,
      orders.error,
      pendingOrders.error,
      latestProduct.error,
      latestOrder.error,
    ].find(Boolean);
    const activityDates = [latestProduct.data?.updated_at, latestOrder.data?.updated_at]
      .filter((value): value is string => Boolean(value))
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    return {
      ok: !firstError,
      error: firstError?.message ?? null,
      checkedAt,
      products: products.count ?? 0,
      activeProducts: activeProducts.count ?? 0,
      stockUnits: (stockRows.data ?? []).reduce((total, row) => total + Number(row.stock ?? 0), 0),
      orders: orders.count ?? 0,
      pendingOrders: pendingOrders.count ?? 0,
      latestActivityAt: activityDates[0] ?? null,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "No se pudo consultar Hocker Supply.",
      checkedAt,
      products: 0,
      activeProducts: 0,
      stockUnits: 0,
      orders: 0,
      pendingOrders: 0,
      latestActivityAt: null,
    };
  }
}

function formatDate(value: string | null) {
  if (!value) return "Sin actividad registrada";
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Tijuana",
  }).format(new Date(value));
}

export default async function SupplyPage() {
  const [data, operational] = await Promise.all([
    loadSupplySummary(),
    getHockerOperationalSnapshot(),
  ]);
  const module = operational.apps.find((app) => app.key === "hocker-supply");

  return (
    <div className="hko-page-flow space-y-5">
      <HockerPageHeader
        eyebrow="Módulo interno parcial"
        title="Hocker Supply"
        text="Lectura directa de productos, stock y pedidos almacenados. No se presenta como aplicación independiente ni como operación en vivo sin evidencia."
      />

      <section className="hko-map-panel">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="hko-kicker">Estado del módulo</p>
            <p className="mt-2 text-sm leading-6 text-slate-300">{module?.evidence ?? "No hay evidencia del módulo."}</p>
            <p className="mt-1 text-xs text-slate-500">Consulta: {formatDate(data.checkedAt)} · Última actividad: {formatDate(data.latestActivityAt)}</p>
          </div>
          <Link href="/supply" className="hko-action-secondary inline-flex items-center gap-2"><RefreshCw className="h-4 w-4" /> Actualizar</Link>
        </div>
      </section>

      {!data.ok ? (
        <section className="rounded-2xl border border-rose-300/20 bg-rose-300/10 p-4 text-sm text-rose-100">
          No se pudo verificar Supply. Los valores se muestran en cero y no deben interpretarse como ausencia confirmada de datos. {data.error}
        </section>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <article className="hko-mini-stat"><span>Productos registrados</span><strong>{data.products}</strong></article>
        <article className="hko-mini-stat"><span>Productos habilitados</span><strong>{data.activeProducts}</strong></article>
        <article className="hko-mini-stat"><span>Unidades de stock</span><strong>{data.stockUnits}</strong></article>
        <article className="hko-mini-stat"><span>Pedidos registrados</span><strong>{data.orders}</strong></article>
        <article className="hko-mini-stat"><span>Pedidos pendientes</span><strong>{data.pendingOrders}</strong></article>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="hko-module-card hko-card-tight">
          <Package className="h-5 w-5 text-cyan-200" />
          <h2 className="mt-4 text-lg font-black text-white">Catálogo interno</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">Tabla `supply_products`. Hoy contiene {data.products} registro(s) para Hocker ONE.</p>
        </article>
        <article className="hko-module-card hko-card-tight">
          <Warehouse className="h-5 w-5 text-cyan-200" />
          <h2 className="mt-4 text-lg font-black text-white">Inventario</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">La suma almacenada de stock es {data.stockUnits}. No existe telemetría de almacén independiente conectada.</p>
        </article>
        <article className="hko-module-card hko-card-tight">
          <ShoppingCart className="h-5 w-5 text-cyan-200" />
          <h2 className="mt-4 text-lg font-black text-white">Pedidos</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">Tabla `supply_orders`. Hay {data.pendingOrders} pedido(s) en estados pendientes o de procesamiento.</p>
        </article>
      </section>

      <section className="hko-map-panel">
        <div className="flex items-start gap-3">
          <Database className="mt-1 h-5 w-5 text-cyan-200" />
          <div>
            <p className="hko-kicker">Alcance actual</p>
            <h2 className="mt-2 text-xl font-black text-white">Esquema y lectura; no aplicación autónoma</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
              Para considerar Hocker Supply operativo todavía se requieren flujo de altas, movimientos de inventario, estados de entrega, auditoría y un runtime propio o integración verificada.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
