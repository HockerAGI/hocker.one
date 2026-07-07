/**
 * @supabase/server integration for Hocker ONE
 *
 * Provides a server-side Supabase context that validates JWTs using JWKS,
 * supports publishable/secret key authentication, and creates properly
 * scoped client instances for use in API routes and MCP connections.
 *
 * Environment variables used:
 *   SUPABASE_URL              — Project URL
 *   SUPABASE_PUBLISHABLE_KEY  — Single publishable key (stored as { default: "<value>" })
 *   SUPABASE_SECRET_KEY       — Single secret key (stored as { default: "<value>" })
 *   SUPABASE_JWKS_URL         — Remote JWKS endpoint for JWT verification
 */

import {
  createSupabaseContext,
  type SupabaseContext,
  type AuthModeWithKey,
  type AuthError,
} from "@supabase/server";

/** Auth modes accepted by Hocker ONE server-side endpoints. */
const HOCKER_SERVER_AUTH_MODES: AuthModeWithKey[] = [
  "user",
  "secret",
  "publishable",
];

/**
 * Create an authenticated Supabase context from an incoming Request.
 *
 * Validates the caller's credentials (JWT, secret key, or publishable key)
 * using the JWKS URL configured in the environment. Returns the full
 * SupabaseContext with scoped client + admin client on success.
 *
 * @param request - The incoming HTTP request (must carry Authorization or apikey header).
 * @returns SupabaseContext on success, or an AuthError on failure.
 */
export async function createHockerSupabaseServerContext(
  request: Request,
): Promise<{ data: SupabaseContext; error: null } | { data: null; error: AuthError }> {
  return createSupabaseContext(request, {
    auth: HOCKER_SERVER_AUTH_MODES,
  });
}

/**
 * Check whether @supabase/server is properly configured in the environment.
 * Used by diagnostics and health-check endpoints.
 */
export function isSupabaseServerConfigured(): {
  configured: boolean;
  missing: string[];
} {
  const required = [
    "SUPABASE_URL",
    "SUPABASE_PUBLISHABLE_KEY",
    "SUPABASE_SECRET_KEY",
    "SUPABASE_JWKS_URL",
  ];

  const missing = required.filter(
    (key) => !String(process.env[key] ?? "").trim(),
  );

  return {
    configured: missing.length === 0,
    missing,
  };
}
