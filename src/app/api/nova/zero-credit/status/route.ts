import { json, requireProjectRole, toApiError } from "@/app/api/_lib";
import { getNovaZeroCreditSnapshot } from "@/lib/nova-zero-credit-snapshot";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET(): Promise<Response> {
  try {
    await requireProjectRole("hocker-one", ["owner", "admin", "operator", "viewer"]);
    return json(await getNovaZeroCreditSnapshot(), 200);
  } catch (error) {
    const apiError = toApiError(error);
    return json(apiError.payload, apiError.status);
  }
}
