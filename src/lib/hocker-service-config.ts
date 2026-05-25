export type HockerServiceKey =
  | "ads"
  | "hub"
  | "drive"
  | "wallet"
  | "chido"
  | "trackhok"
  | "nexpa"
  | "up"
  | "store"
  | "custom";

export type HockerNovaTone =
  | "executive"
  | "friendly"
  | "technical"
  | "sales";

export type HockerApprovalLevel =
  | "none"
  | "client"
  | "owner"
  | "dual";

export type HockerClientServiceConfig = {
  tenantId: string;
  service: HockerServiceKey;
  visibleModules: string[];
  allowedActions: string[];
  novaTone: HockerNovaTone;
  approvalLevel: HockerApprovalLevel;
  theme?: {
    primary: string;
    logoUrl?: string;
  };
};

export const HOCKER_DEFAULT_SERVICE_CONFIGS_2C: Record<HockerServiceKey, Omit<HockerClientServiceConfig, "tenantId">> = {
  ads: {
    service: "ads",
    visibleModules: ["campaigns", "creatives", "reports", "approvals", "billing"],
    allowedActions: ["approve_creative", "request_changes", "download_report"],
    novaTone: "executive",
    approvalLevel: "client",
    theme: { primary: "#0366ff" },
  },
  hub: {
    service: "hub",
    visibleModules: ["leads", "pipeline", "clients", "tasks", "automation", "reports"],
    allowedActions: ["review_lead", "request_followup", "download_report"],
    novaTone: "sales",
    approvalLevel: "client",
    theme: { primary: "#0366ff" },
  },
  drive: {
    service: "drive",
    visibleModules: ["files", "folders", "shared", "smart-search", "activity", "permissions"],
    allowedActions: ["upload_file", "request_summary", "share_file"],
    novaTone: "friendly",
    approvalLevel: "client",
    theme: { primary: "#16c8ff" },
  },
  wallet: {
    service: "wallet",
    visibleModules: ["overview", "invoices", "roi", "security"],
    allowedActions: ["view_invoice", "request_report"],
    novaTone: "executive",
    approvalLevel: "owner",
    theme: { primary: "#d6a84f" },
  },
  chido: {
    service: "chido",
    visibleModules: ["home", "responsible-play", "history", "support", "security"],
    allowedActions: ["view_history", "request_support"],
    novaTone: "friendly",
    approvalLevel: "owner",
    theme: { primary: "#0366ff" },
  },
  trackhok: {
    service: "trackhok",
    visibleModules: ["map", "assets", "alerts", "routes", "history", "reports"],
    allowedActions: ["view_report", "acknowledge_alert"],
    novaTone: "technical",
    approvalLevel: "owner",
    theme: { primary: "#16c8ff" },
  },
  nexpa: {
    service: "nexpa",
    visibleModules: ["home", "devices", "alerts", "family", "permissions", "reports"],
    allowedActions: ["acknowledge_alert", "request_report"],
    novaTone: "friendly",
    approvalLevel: "owner",
    theme: { primary: "#16c8ff" },
  },
  up: {
    service: "up",
    visibleModules: ["learn", "community", "mentor", "progress", "courses"],
    allowedActions: ["start_lesson", "request_help"],
    novaTone: "friendly",
    approvalLevel: "none",
    theme: { primary: "#5fe7ff" },
  },
  store: {
    service: "store",
    visibleModules: ["products", "orders", "customers", "reports", "support"],
    allowedActions: ["review_order", "download_report"],
    novaTone: "sales",
    approvalLevel: "client",
    theme: { primary: "#0366ff" },
  },
  custom: {
    service: "custom",
    visibleModules: ["home", "nova", "reports", "approvals", "support"],
    allowedActions: ["request_changes", "download_report"],
    novaTone: "executive",
    approvalLevel: "client",
    theme: { primary: "#0366ff" },
  },
};

