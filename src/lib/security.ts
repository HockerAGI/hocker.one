import crypto from "node:crypto";
import { stableStringify } from "./stable-json";

export function signCommand(
  secret: string,
  input: { id: string; node_id: string; command: string; payload: any }
) {
  const base = `${input.id}.${input.node_id}.${input.command}.${stableStringify(input.payload ?? {})}`;
  return crypto.createHmac("sha256", secret).update(base).digest("hex");
}