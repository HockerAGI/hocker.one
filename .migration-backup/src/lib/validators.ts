import { z } from "zod";

const COMMAND_NAMES = [
  "ping",
  "status",
  "read_dir",
  "read_file_head",
  "shell.exec",
  "fs.write",
  "run_sql",
  "stripe.charge",
  "meta.send_msg",
  "node.sync",
  "system.echo",
  "supply.create_order",
  "node.activate",
  "node.deactivate",
  "restart_db",
  "restart_nova",
  "restart_telemetry",
  "github.get_repo",
  "github.list_tree",
  "github.read_file",
  "github.create_branch",
  "github.upsert_file",
  "github.create_pr",
] as const;

export const commandSchema = z.object({
  command: z.enum(COMMAND_NAMES),
  node_id: z.string().min(3).max(50),
  payload: z.record(z.unknown()).default({}),
});

export const eventSchema = z.object({
  type: z.string().min(2).max(100),
  message: z.string().min(1).max(500),
  level: z.enum(["info", "warn", "error"]).default("info"),
  data: z.record(z.unknown()).optional(),
});

export const orderItemSchema = z.object({
  product_id: z.string().uuid().optional(),
  qty: z.number().int().positive().max(1000),
  unit_price_cents: z.number().int().nonnegative().max(100000000).optional(),
});

export const createOrderSchema = z.object({
  customer_name: z.string().min(1).max(120).optional(),
  customer_phone: z.string().regex(/^[0-9+\-\s()]{7,20}$/).optional(),
  items: z.array(orderItemSchema).min(1).max(100),
});