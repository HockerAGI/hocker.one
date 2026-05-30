import { createAdminSupabase } from "./supabase-admin";
export const PORTAL_AUTH_VERSION = "1J-PHASE13-STABLE";
export async function generatePortalKey(portalId: string, tenantId: string) {
  const sb = createAdminSupabase();
  const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
  return await sb.from("hocker_portal_grants").insert([{ 
    portal_id: portalId, 
    tenant_id: tenantId, 
    access_token: token, 
    status: "active" 
  }]);
}
