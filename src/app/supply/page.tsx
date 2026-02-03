"use client";

import React, { useEffect, useState } from "react";
import AppNav from "@/components/AppNav";
import { defaultProjectId } from "@/lib/project";

type Product = {
  id: string;
  sku: string | null;
  name: string;
  description: string | null;
  unit_cost: number;
  price: number;
  stock: number;
  created_at: string;
};

type Order = {
  id: string;
  status: string;
  customer_name: string | null;
  customer_phone: string | null;
  total: number;
  created_at: string;
};

type OrderItem = {
  id: string;
  order_id: string;
  product_id: string | null;
  qty: number;
  unit_price: number;
  created_at: string;
};

export default function SupplyPage() {
  const [projectId, setProjectId] = useState(defaultProjectId());
  const [msg, setMsg] = useState("");

  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [items, setItems] = useState<OrderItem[]>([]);

  const [p, setP] = useState({ sku: "", name: "", description: "", unit_cost: 0, price: 0, stock: 0 });

  const [o, setO] = useState({
    customer_name: "",
    customer_phone: "",
    status: "pending",
    itemsJson: `[{"product_id": null, "qty": 1, "unit_price": 0}]`
  });

  async function loadProducts() {
    const r = await fetch(`/api/supply/products?project_id=${encodeURIComponent(projectId)}`);
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j?.error ?? "Error");
    setProducts(j.data ?? []);
  }

  async function loadOrders() {
    const r = await fetch(`/api/supply/orders?project_id=${encodeURIComponent(projectId)}`);
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j?.error ?? "Error");
    setOrders(j.orders ?? []);
    setItems(j.items ?? []);
  }

  async function reloadAll() {
    setMsg("");
    try {
      await Promise.all([loadProducts(), loadOrders()]);
    } catch (e: any) {
      setMsg(e?.message ?? "Error");
    }
  }

  async function createProduct() {
    setMsg("");
    const r = await fetch("/api/supply/products", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ project_id: projectId, ...p, sku: p.sku || null, description: p.description || null })
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) return setMsg(j?.error ?? "Error");
    setP({ sku: "", name: "", description: "", unit_cost: 0, price: 0, stock: 0 });
    await reloadAll();
  }

  async function createOrder() {
    setMsg("");
    let itemsParsed: any[] = [];
    try {
      itemsParsed = JSON.parse(o.itemsJson);
      if (!Array.isArray(itemsParsed)) throw new Error("items debe ser array JSON");
    } catch (e: any) {
      return setMsg(e?.message ?? "items JSON inválido");
    }

    const r = await fetch("/api/supply/orders", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        project_id: projectId,
        customer_name: o.customer_name || null,
        customer_phone: o.customer_phone || null,
        status: o.status,
        items: itemsParsed
      })
    });

    const j = await r.json().catch(() => ({}));
    if (!r.ok) return setMsg(j?.error ?? "Error");

    setO({
      customer_name: "",
      customer_phone: "",
      status: "pending",
      itemsJson: `[{"product_id": null, "qty": 1, "unit_price": 0}]`
    });

    await reloadAll();
  }

  function itemsFor(orderId: string) {
    return items.filter((i) => i.order_id === orderId);
  }

  useEffect(() => {
    reloadAll();
  }, [projectId]);

  return (
    <main style={{ maxWidth: 1100, margin: "28px auto", padding: 16 }}>
      <header style={{ display: "grid", gap: 12 }}>
        <h1 style={{ margin: 0 }}>Supply</h1>
        <AppNav />

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: 12, opacity: 0.8 }}>Project</span>
            <input
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              style={{ padding: 10, borderRadius: 12, border: "1px solid #d6e3ff" }}
            />
          </label>
          <button
            onClick={reloadAll}
            style={{ padding: "12px 14px", cursor: "pointer", borderRadius: 12, border: "1px solid #d6e3ff", background: "#fff" }}
          >
            Recargar
          </button>
        </div>

        <div style={{ opacity: 0.75 }}>
          CRUD real (server-only writes): productos + órdenes + items. Nada de mutar DB desde el navegador.
        </div>
      </header>

      {msg ? <div style={{ marginTop: 12, fontSize: 13, opacity: 0.9 }}>{msg}</div> : null}

      <section style={{ marginTop: 16, display: "grid", gap: 16 }}>
        {/* Products */}
        <div style={{ border: "1px solid #e6eefc", borderRadius: 16, padding: 16, background: "#fff" }}>
          <h2 style={{ marginTop: 0 }}>Productos</h2>

          <div style={{ display: "grid", gap: 10, gridTemplateColumns: "1fr 1fr" }}>
            <input placeholder="SKU (opcional)" value={p.sku} onChange={(e) => setP({ ...p, sku: e.target.value })} style={{ padding: 12, borderRadius: 12, border: "1px solid #d6e3ff" }} />
            <input placeholder="Nombre" value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })} style={{ padding: 12, borderRadius: 12, border: "1px solid #d6e3ff" }} />
            <input placeholder="Descripción" value={p.description} onChange={(e) => setP({ ...p, description: e.target.value })} style={{ padding: 12, borderRadius: 12, border: "1px solid #d6e3ff" }} />
            <div />
            <input type="number" placeholder="Costo unitario" value={p.unit_cost} onChange={(e) => setP({ ...p, unit_cost: Number(e.target.value) })} style={{ padding: 12, borderRadius: 12, border: "1px solid #d6e3ff" }} />
            <input type="number" placeholder="Precio" value={p.price} onChange={(e) => setP({ ...p, price: Number(e.target.value) })} style={{ padding: 12, borderRadius: 12, border: "1px solid #d6e3ff" }} />
            <input type="number" placeholder="Stock" value={p.stock} onChange={(e) => setP({ ...p, stock: Number(e.target.value) })} style={{ padding: 12, borderRadius: 12, border: "1px solid #d6e3ff" }} />
            <button onClick={createProduct} style={{ padding: "12px 14px", cursor: "pointer", borderRadius: 12, border: "1px solid #1e5eff", background: "#1e5eff", color: "#fff" }}>
              Crear producto
            </button>
          </div>

          <div style={{ marginTop: 14, overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #eef3ff" }}>SKU</th>
                  <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #eef3ff" }}>Nombre</th>
                  <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #eef3ff" }}>Costo</th>
                  <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #eef3ff" }}>Precio</th>
                  <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #eef3ff" }}>Stock</th>
                </tr>
              </thead>
              <tbody>
                {products.map((x) => (
                  <tr key={x.id}>
                    <td style={{ padding: 8, borderBottom: "1px solid #f6f8ff" }}>{x.sku ?? "—"}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid #f6f8ff" }}>{x.name}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid #f6f8ff" }}>{Number(x.unit_cost).toFixed(2)}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid #f6f8ff" }}>{Number(x.price).toFixed(2)}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid #f6f8ff" }}>{x.stock}</td>
                  </tr>
                ))}
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: 10, opacity: 0.7 }}>
                      Sin productos.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>

        {/* Orders */}
        <div style={{ border: "1px solid #e6eefc", borderRadius: 16, padding: 16, background: "#fff" }}>
          <h2 style={{ marginTop: 0 }}>Órdenes</h2>

          <div style={{ display: "grid", gap: 10, gridTemplateColumns: "1fr 1fr" }}>
            <input placeholder="Cliente (opcional)" value={o.customer_name} onChange={(e) => setO({ ...o, customer_name: e.target.value })} style={{ padding: 12, borderRadius: 12, border: "1px solid #d6e3ff" }} />
            <input placeholder="Teléfono (opcional)" value={o.customer_phone} onChange={(e) => setO({ ...o, customer_phone: e.target.value })} style={{ padding: 12, borderRadius: 12, border: "1px solid #d6e3ff" }} />
            <select value={o.status} onChange={(e) => setO({ ...o, status: e.target.value })} style={{ padding: 12, borderRadius: 12, border: "1px solid #d6e3ff" }}>
              <option value="pending">pending</option>
              <option value="paid">paid</option>
              <option value="producing">producing</option>
              <option value="shipped">shipped</option>
              <option value="delivered">delivered</option>
              <option value="cancelled">cancelled</option>
            </select>
            <div />

            <textarea
              value={o.itemsJson}
              onChange={(e) => setO({ ...o, itemsJson: e.target.value })}
              rows={5}
              style={{ gridColumn: "1 / -1", padding: 12, borderRadius: 12, border: "1px solid #d6e3ff", fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" }}
              placeholder='items JSON: [{"product_id":"...","qty":1,"unit_price":100}]'
            />

            <button onClick={createOrder} style={{ padding: "12px 14px", cursor: "pointer", borderRadius: 12, border: "1px solid #1e5eff", background: "#1e5eff", color: "#fff" }}>
              Crear orden
            </button>
          </div>

          <div style={{ marginTop: 14, overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #eef3ff" }}>Fecha</th>
                  <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #eef3ff" }}>Status</th>
                  <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #eef3ff" }}>Cliente</th>
                  <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #eef3ff" }}>Total</th>
                  <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #eef3ff" }}>Items</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((x) => (
                  <tr key={x.id}>
                    <td style={{ padding: 8, borderBottom: "1px solid #f6f8ff", whiteSpace: "nowrap" }}>{new Date(x.created_at).toLocaleString()}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid #f6f8ff" }}>{x.status}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid #f6f8ff" }}>{x.customer_name ?? "—"}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid #f6f8ff" }}>{Number(x.total).toFixed(2)}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid #f6f8ff" }}>
                      {itemsFor(x.id).length}
                    </td>
                  </tr>
                ))}
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: 10, opacity: 0.7 }}>
                      Sin órdenes.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}