import { prisma } from "@/lib/prisma";

export async function findTenantBySlug(slug: string) {
  return prisma.tenant.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      defaultLocale: true,
      enabledLocales: true,
    },
  });
}
