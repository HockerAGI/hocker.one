export type HockerRole =
  | "owner"
  | "admin"
  | "operator"
  | "client_admin"
  | "client_user"
  | "end_user"
  | "viewer";

export const HOCKER_PERMISSIONS_2C = {
  approveAction: ["owner", "admin"],
  executeAction: ["owner"],
  viewTechnicalLogs: ["owner", "admin"],
  manageAgis: ["owner"],
  viewClientReports: ["owner", "admin", "client_admin", "client_user"],
  editBilling: ["owner", "admin", "client_admin"],
  accessProtectedChido: ["owner", "admin"],
  accessNexpaSensitive: ["owner"],
  accessTrackhokSensitive: ["owner", "admin"],
  manageMemory: ["owner"],
  publishMemory: ["owner"],
  rollback: ["owner"],
  manageIntegrations: ["owner", "admin"],
  viewEvidence: ["owner", "admin", "operator"],
  viewOwnTenantEvidence: ["client_admin"],
} as const satisfies Record<string, readonly HockerRole[]>;

export type HockerPermissionKey = keyof typeof HOCKER_PERMISSIONS_2C;

export function roleCan(permission: HockerPermissionKey, role: HockerRole): boolean {
  const allowedRoles = HOCKER_PERMISSIONS_2C[permission] as readonly HockerRole[];
  return allowedRoles.includes(role);
}

