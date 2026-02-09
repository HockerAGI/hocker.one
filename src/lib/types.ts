export type Role = "owner" | "admin" | "operator" | "viewer";

export type CommandStatus =
  | "needs_approval"
  | "queued"
  | "running"
  | "done"
  | "failed"
  | "cancelled";

export type EventLevel = "info" | "warn" | "error";