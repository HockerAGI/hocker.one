import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Next 16 server routes avoid deprecated Edge runtime where Node is sufficient", async () => {
  const [healthPing, supplyOrders, supplyOrderDetail] = await Promise.all([
    read("src/app/api/health/ping/route.ts"),
    read("src/app/api/supply/orders/route.ts"),
    read("src/app/api/supply/orders/[id]/route.ts"),
  ]);

  for (const source of [healthPing, supplyOrders, supplyOrderDetail]) {
    assert.doesNotMatch(source, /export const runtime\s*=\s*["']edge["']/);
    assert.match(source, /export const runtime\s*=\s*["']nodejs["']/);
  }

  assert.match(healthPing, /export const dynamic\s*=\s*["']force-dynamic["']/);
  assert.match(supplyOrders, /requireProjectRole/);
  assert.match(supplyOrders, /allow_write/);
  assert.match(supplyOrders, /kill_switch/);
});
