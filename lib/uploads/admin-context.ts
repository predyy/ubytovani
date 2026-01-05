import { cookies, headers } from "next/headers";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { ACTIVE_TENANT_COOKIE } from "@/lib/auth/constants";
import { parseHost } from "@/lib/tenancy/parse-host";
import { requireTenantRole } from "@/lib/tenancy/rbac";

type AdminTenantContext =
  | {
      error: string;
      status: number;
    }
  | {
      user: {
        id: string;
        email: string;
      };
      tenant: {
        id: string;
        slug: string;
        defaultLocale: string;
      };
      membership: {
        role: string;
      };
    };

export async function requireAdminTenant(
  minRole: "STAFF" | "ADMIN" | "OWNER" = "STAFF",
): Promise<AdminTenantContext> {
  const headerList = await headers();
  const host = headerList.get("host") ?? "";
  const { mode } = parseHost(host);

  if (mode !== "admin") {
    return { error: "Forbidden", status: 403 };
  }

  const user = await getCurrentUser();
  if (!user) {
    return { error: "Unauthorized", status: 401 };
  }

  const cookieStore = await cookies();
  const tenantId = cookieStore.get(ACTIVE_TENANT_COOKIE)?.value ?? null;

  if (!tenantId) {
    return { error: "No active tenant selected.", status: 400 };
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { id: true, slug: true, defaultLocale: true },
  });

  if (!tenant) {
    return { error: "Tenant not found.", status: 404 };
  }

  const membership = await requireTenantRole(user.id, tenantId, minRole);
  if (!membership) {
    return { error: "Forbidden", status: 403 };
  }

  return {
    user: { id: user.id, email: user.email },
    tenant,
    membership: { role: membership.role },
  };
}
