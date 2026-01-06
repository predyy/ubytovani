import { parseHost } from "@/lib/tenancy/parse-host";
import { findTenantBySlug } from "@/lib/tenancy/tenant";

export async function resolvePublicTenant(request: Request) {
  const tenantId = request.headers.get("x-tenant-id");
  if (tenantId) {
    return { tenantId };
  }

  const host = request.headers.get("host") ?? "";
  const { mode, tenantSlug } = parseHost(host);
  if (mode !== "tenant" || !tenantSlug) {
    return null;
  }

  const tenant = await findTenantBySlug(tenantSlug);
  if (!tenant) {
    return null;
  }

  return { tenantId: tenant.id };
}
