"use client";

import React, { useEffect, useMemo, useState } from "react";
import AppNav from "@/components/AppNav";
import { defaultProjectId, normalizeProjectId } from "@/lib/project";

type Product = {
  id: string;
  sku: string | null;
  name: string;
  description: string | null;
  price_cents: number;
  cost_cents: number;
  currency: string;
  stock: number;
  active: boolean;
  created_at: string;
  updated_at: string;
};

type OrderItem = {
  id: string;
  order_id: string;
  product_id: string | null;
  product?: { id: string; sku: string | null; name: string } | null;
  qty: number;
  unit_price_cents: number;
  currency: string;
  line_total_cents: number;
  created_at: string;
};

type Order = {
  id: string;
  status: string;
  customer_name: string | null;
  customer_phone: string | null;
  total_cents: number;
  currency: string;
  meta: any;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
};

function money(cents: number, currency = "MXN") {
  const n = Number.isFinite(Number(cents)) ? Number(cents) : 0;
  const v = (n / 100).toFixed(2);
  return `${currency} $${v}`;
}

function clampInt(v: any, min: number, max: number, fallback: number) {
  const n = Math.trunc(Number(v));
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

export default function SupplyPage() {
  const [projectId, setProjectId] = useState(defaultProjectId());
  const pid = useMemo(() => normalizeProjectId(projectId), [projectId]);

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  const [newProduct, setNewProduct] = useState({
    sku: "",
    name: "",
    description: "",
    price_mxn: "0",
    cost_mxn: "0",
    stock: "0",
    active: true,
  });

  const [newOrder, setNewOrder] = useState({
    customer_name: "",
    customer_phone: "",
    status: "pending",
  });

  const [orderItems, setOrderItems] = useState<
    { product_id: string | null; qty: number; unit_price_cents: number | null }[]
  >([{ product_id: null, qty: 1, unit_price_cents: null }]);

  function productById(id: string | null) {
    if (!id) return null;
    return products.find((p) => p.id === id) ?? null;
  }

  function toCentsFromMXN(input: string) {
    const n = Number(String(input || "0").replace(/,/g, "."));
    if (!Number.isFinite(n)) return 0;
    return Math.max(0, Math.trunc(n * 100));
  }

  async function loadProducts() {
    const r = await fetch(`/api/supply/products?project_id=${encodeURIComponent(pid)}`);
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j?.ok) throw new Error(j?.error ?? "No pude cargar productos.");
    setProducts(j.items ?? []);
  }

  async function loadOrders() {
    const r = await fetch(`/api/supply/orders?project_id=${encodeURIComponent(pid)}&include_items=1`);
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j?.ok) throw new Error(j?.error ?? "No pude cargar órdenes.");
    setOrders(j.items ?? []);
  }

  async function reloadAll() {
    setMsg(null);
    setLoading(true);
    try {
      await Promise.all([loadProducts(), loadOrders()]);
    } catch (e: any) {
      setMsg(e?.message ?? "Error");
    } finally {
      setLoading(false);
    }
  }

  async function createProduct() {
    setMsg(null);
    try {
      const body = {
        project_id: pid,
        sku: newProduct.sku.trim() || null,
        name: newProduct.name.trim(),
        description: newProduct.description.trim() || null,
        currency: "MXN",
        price_cents: toCentsFromMXN(newProduct.price_mxn),
        cost_cents: toCentsFromMXN(newProduct.cost_mxn),
        stock: clampInt(newProduct.stock, 0, 1_000_000, 0),
        active: !!newProduct.active,
      };

      if (!body.name) return setMsg("Falta nombre del producto.");

      const r = await fetch("/api/supply/products", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j?.ok) throw new Error(j?.error ?? "No pude crear el producto.");

      setNewProduct({ sku: "", name: "", description: "", price_mxn: "0", cost_mxn: "0", stock: "0", active: true });
      await reloadAll();
    } catch (e: any) {
      setMsg(e?.message ?? "Error creando producto.");
    }
  }

  function addOrderItem() {
    setOrderItems((prev) => [...prev, { product_id: null, qty: 1, unit_price_cents: null }]);
  }

  function removeOrderItem(idx: number) {
    setOrderItems((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateItem(
    idx: number,
    patch: Partial<{ product_id: string | null; qty: number; unit_price_cents: number | null }>
  ) {
    setOrderItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  }

  async function createOrder() {
    setMsg(null);
    try {
      if (!orderItems.length) return setMsg("Agrega al menos 1 item.");

      const items = orderItems.map((it) => {
        const qty = clampInt(it.qty, 1, 10_000, 1);
        const p = productById(it.product_id);

        const unit_price_cents =
          it.unit_price_cents !== null ? clampInt(it.unit_price_cents, 0, 1_000_000_000, 0) : p?.price_cents ?? 0;

        return { product_id: it.product_id, qty, unit_price_cents };
      });

      const r = await fetch("/api/supply/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          project_id: pid,
          customer_name: newOrder.customer_name.trim() || null,
          customer_phone: newOrder.customer_phone.trim() || null,
          status: newOrder.status,
          currency: "MXN",
          items,
        }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j?.ok) throw new Error(j?.error ?? "No pude crear la orden.");

      setNewOrder({ customer_name: "", customer_phone: "", status: "pending" });
      setOrderItems([{ product_id: null, qty: 1, unit_price_cents: null }]);
      await reloadAll();
    } catch (e: any) {
      setMsg(e?.message ?? "Error creando orden.");
    }
  }

  useEffect(() => {
    reloadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pid]);

  return (
    <main className="mx-auto max-w-[1100px] p-4 md:py-7">
      <header className="space-y-3">
        <h1 className="text-2xl font-semibold text-slate-900">Supply</h1>
        <AppNav />

        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div className="w-full md:w-[360px]">
            <label className="text-xs font-semibold text-slate-600">Project</label>
            <input
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-400"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              placeholder="global"
            />
          </div>

          <button
            onClick={reloadAll}
            disabled={loading}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {loading ? "Cargando…" : "Recargar"}
          </button>
        </div>

        <div className="text-sm text-slate-500">
          Esto es inventario + órdenes reales. Todo lo que se guarda pasa por el servidor (no hay writes directos desde el navegador).
        </div>

        {msg && <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{msg}</div>}
      </header>

      <section className="mt-6 grid gap-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="text-lg font-semibold text-slate-900">Productos</div>
              <div className="text-sm text-slate-500">Crea y administra el catálogo interno.</div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-6">
            <input
              className="md:col-span-1 rounded-xl border border-slate-200 px-3 py-2 text-sm"
              placeholder="SKU (opcional)"
              value={newProduct.sku}
              onChange={(e) => setNewProduct((p) => ({ ...p, sku: e.target.value }))}
            />
            <input
              className="md:col-span-2 rounded-xl border border-slate-200 px-3 py-2 text-sm"
              placeholder="Nombre"
              value={newProduct.name}
              onChange={(e) => setNewProduct((p) => ({ ...p, name: e.target.value }))}
            />
            <input
              className="md:col-span-3 rounded-xl border border-slate-200 px-3 py-2 text-sm"
              placeholder="Descripción (opcional)"
              value={newProduct.description}
              onChange={(e) => setNewProduct((p) => ({ ...p, description: e.target.value }))}
            />

            <input
              className="md:col-span-1 rounded-xl border border-slate-200 px-3 py-2 text-sm"
              placeholder="Precio MXN"
              value={newProduct.price_mxn}
              onChange={(e) => setNewProduct((p) => ({ ...p, price_mxn: e.target.value }))}
            />
            <input
              className="md:col-span-1 rounded-xl border border-slate-200 px-3 py-2 text-sm"
              placeholder="Costo MXN"
              value={newProduct.cost_mxn}
              onChange={(e) => setNewProduct((p) => ({ ...p, cost_mxn: e.target.value }))}
            />
            <input
              className="md:col-span-1 rounded-xl border border-slate-200 px-3 py-2 text-sm"
              placeholder="Stock"
              value={newProduct.stock}
              onChange={(e) => setNewProduct((p) => ({ ...p, stock: e.target.value }))}
            />
            <label className="md:col-span-1 flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={newProduct.active}
                onChange={(e) => setNewProduct((p) => ({ ...p, active: e.target.checked }))}
              />
              Activo
            </label>

            <button
              onClick={createProduct}
              className="md:col-span-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
            >
              Crear producto
            </button>
          </div>

          <div className="mt-4 overflow-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="text-left text-slate-600">
                  <th className="border-b border-slate-200 py-2 pr-3">SKU</th>
                  <th className="border-b border-slate-200 py-2 pr-3">Nombre</th>
                  <th className="border-b border-slate-200 py-2 pr-3">Precio</th>
                  <th className="border-b border-slate-200 py-2 pr-3">Costo</th>
                  <th className="border-b border-slate-200 py-2 pr-3">Stock</th>
                  <th className="border-b border-slate-200 py-2 pr-3">Activo</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="text-slate-900">
                    <td className="border-b border-slate-100 py-2 pr-3 whitespace-nowrap">{p.sku ?? "—"}</td>
                    <td className="border-b border-slate-100 py-2 pr-3">{p.name}</td>
                    <td className="border-b border-slate-100 py-2 pr-3 whitespace-nowrap">{money(p.price_cents, p.currency)}</td>
                    <td className="border-b border-slate-100 py-2 pr-3 whitespace-nowrap">{money(p.cost_cents, p.currency)}</td>
                    <td className="border-b border-slate-100 py-2 pr-3">{p.stock}</td>
                    <td className="border-b border-slate-100 py-2 pr-3">{p.active ? "Sí" : "No"}</td>
                  </tr>
                ))}
                {!products.length && (
                  <tr>
                    <td className="py-3 text-slate-500" colSpan={6}>
                      Sin productos todavía.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div>
            <div className="text-lg font-semibold text-slate-900">Órdenes</div>
            <div className="text-sm text-slate-500">Crea una orden (con items) y monitorea estatus.</div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-6">
            <input
              className="md:col-span-2 rounded-xl border border-slate-200 px-3 py-2 text-sm"
              placeholder="Cliente (opcional)"
              value={newOrder.customer_name}
              onChange={(e) => setNewOrder((o) => ({ ...o, customer_name: e.target.value }))}
            />
            <input
              className="md:col-span-2 rounded-xl border border-slate-200 px-3 py-2 text-sm"
              placeholder="Teléfono (opcional)"
              value={newOrder.customer_phone}
              onChange={(e) => setNewOrder((o) => ({ ...o, customer_phone: e.target.value }))}
            />

            <select
              className="md:col-span-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
              value={newOrder.status}
              onChange={(e) => setNewOrder((o) => ({ ...o, status: e.target.value }))}
            >
              <option value="pending">pending</option>
              <option value="paid">paid</option>
              <option value="producing">producing</option>
              <option value="shipped">shipped</option>
              <option value="delivered">delivered</option>
              <option value="cancelled">cancelled</option>
            </select>
          </div>

          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-800">Items</div>
              <button
                onClick={addOrderItem}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-900 hover:bg-slate-50"
              >
                + Agregar
              </button>
            </div>

            {orderItems.map((it, idx) => {
              const p = productById(it.product_id);
              const unitPrice = it.unit_price_cents !== null ? it.unit_price_cents : (p?.price_cents ?? 0);

              return (
                <div key={idx} className="grid grid-cols-1 gap-2 md:grid-cols-12">
                  <select
                    className="md:col-span-6 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                    value={it.product_id ?? ""}
                    onChange={(e) => {
                      const val = e.target.value || null;
                      updateItem(idx, { product_id: val, unit_price_cents: null });
                    }}
                  >
                    <option value="">Selecciona producto…</option>
                    {products
                      .filter((x) => x.active)
                      .map((x) => (
                        <option key={x.id} value={x.id}>
                          {(x.sku ? `${x.sku} · ` : "") + x.name}
                        </option>
                      ))}
                  </select>

                  <input
                    className="md:col-span-2 rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    type="number"
                    min={1}
                    value={it.qty}
                    onChange={(e) => updateItem(idx, { qty: clampInt(e.target.value, 1, 10_000, 1) })}
                    placeholder="Qty"
                  />

                  <input
                    className="md:col-span-3 rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    value={((unitPrice ?? 0) / 100).toFixed(2)}
                    onChange={(e) => updateItem(idx, { unit_price_cents: toCentsFromMXN(e.target.value) })}
                    placeholder="Precio unitario"
                    inputMode="decimal"
                  />

                  <button
                    onClick={() => removeOrderItem(idx)}
                    className="md:col-span-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
                    disabled={orderItems.length <= 1}
                    title={orderItems.length <= 1 ? "Debe existir al menos 1 item" : "Eliminar"}
                  >
                    ✕
                  </button>

                  <div className="md:col-span-12 text-xs text-slate-500">{p ? `Usando: ${p.name}` : ""}</div>
                </div>
              );
            })}

            <button
              onClick={createOrder}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
            >
              Crear orden
            </button>
          </div>

          <div className="mt-6 space-y-3">
            <div className="text-sm font-semibold text-slate-800">Historial</div>

            {!orders.length && <div className="text-sm text-slate-500">Sin órdenes todavía.</div>}

            {orders.map((o) => (
              <div key={o.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900">{o.status}</span>
                      <span className="text-xs text-slate-500">{new Date(o.created_at).toLocaleString()}</span>
                    </div>
                    <div className="text-sm text-slate-700">
                      <span className="font-semibold">Cliente:</span> {o.customer_name ?? "—"} · {o.customer_phone ?? "—"}
                    </div>
                    <div className="text-sm text-slate-900">
                      <span className="font-semibold">Total:</span> {money(o.total_cents, o.currency)}
                    </div>
                  </div>
                </div>

                <div className="mt-3 overflow-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="text-left text-slate-600">
                        <th className="border-b border-slate-200 py-2 pr-3">Producto</th>
                        <th className="border-b border-slate-200 py-2 pr-3">Qty</th>
                        <th className="border-b border-slate-200 py-2 pr-3">Unit</th>
                        <th className="border-b border-slate-200 py-2 pr-3">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(o.items ?? []).map((it) => (
                        <tr key={it.id} className="text-slate-900">
                          <td className="border-b border-slate-100 py-2 pr-3">
                            {it.product ? `${it.product.sku ? it.product.sku + " · " : ""}${it.product.name}` : "(sin producto)"}
                          </td>
                          <td className="border-b border-slate-100 py-2 pr-3">{it.qty}</td>
                          <td className="border-b border-slate-100 py-2 pr-3 whitespace-nowrap">{money(it.unit_price_cents, it.currency)}</td>
                          <td className="border-b border-slate-100 py-2 pr-3 whitespace-nowrap">{money(it.line_total_cents, it.currency)}</td>
                        </tr>
                      ))}
                      {!(o.items ?? []).length && (
                        <tr>
                          <td className="py-3 text-slate-500" colSpan={4}>
                            Sin items.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
