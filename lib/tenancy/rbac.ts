import { prisma } from "@/lib/prisma";

const roleRank = {
  STAFF: 1,
  ADMIN: 2,
  OWNER: 3,
} as const;

type TenantRole = keyof typeof roleRank;

export async function requireTenantRole(
  userId: string,
  tenantId: string,
  minRole: TenantRole = "STAFF",
) {
  const membership = await prisma.tenantMember.findFirst({
    where: { userId, tenantId },
    select: { role: true },
  });

  if (!membership) {
    return null;
  }

  if (roleRank[membership.role] < roleRank[minRole]) {
    return null;
  }

  return membership;
}
