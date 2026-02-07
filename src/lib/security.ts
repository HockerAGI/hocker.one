import crypto from "node:crypto";
import { stableStringify } from "@/lib/stable-json";

export function signCommand(
  secret: string,
  input: { id: string; project_id: string; node_id: string; command: string; payload: any }
) {
  const base = [
    String(input.id),
    String(input.project_id),
    String(input.node_id),
    String(input.command),
    stableStringify(input.payload ?? {})
  ].join(".");
  return crypto.createHmac("sha256", secret).update(base).digest("hex");
}