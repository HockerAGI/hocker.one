export type LegacyCommandRisk = "R0" | "R1" | "R2" | "R3" | "R4";

export type LegacyCommandPolicy = {
  risk_level: LegacyCommandRisk;
  requires_approval: boolean;
  mode: "read" | "reversible-write" | "high-impact";
};

const READ_ONLY_COMMANDS = new Set([
  "ping",
  "status",
  "read_dir",
  "read_file_head",
  "github.get_repo",
  "github.list_tree",
  "github.read_file",
]);

const REVERSIBLE_WRITE_COMMANDS = new Set([
  "system.echo",
  "node.sync",
  "fs.write",
  "github.create_branch",
  "github.upsert_file",
  "github.create_pr",
]);

const HIGH_IMPACT_COMMANDS = new Set([
  "stripe.charge",
  "meta.send_msg",
  "supply.create_order",
]);

const DESTRUCTIVE_OR_PRIVILEGED_COMMANDS = new Set([
  "shell.exec",
  "run_sql",
  "node.activate",
  "node.deactivate",
  "restart_db",
  "restart_nova",
  "restart_telemetry",
]);

/**
 * Compatibility policy for the legacy `commands` queue.
 *
 * Client input is never an authority source for approval requirements. Unknown
 * commands fail closed as R4 even though the request schema should reject them
 * before this function is called.
 */
export function getLegacyCommandPolicy(command: string, _role: string): LegacyCommandPolicy {
  if (READ_ONLY_COMMANDS.has(command)) {
    return { risk_level: "R0", requires_approval: false, mode: "read" };
  }

  if (REVERSIBLE_WRITE_COMMANDS.has(command)) {
    return { risk_level: "R2", requires_approval: true, mode: "reversible-write" };
  }

  if (HIGH_IMPACT_COMMANDS.has(command)) {
    return { risk_level: "R3", requires_approval: true, mode: "high-impact" };
  }

  if (DESTRUCTIVE_OR_PRIVILEGED_COMMANDS.has(command)) {
    return { risk_level: "R4", requires_approval: true, mode: "high-impact" };
  }

  return { risk_level: "R4", requires_approval: true, mode: "high-impact" };
}
