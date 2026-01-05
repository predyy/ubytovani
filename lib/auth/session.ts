import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
} from "@/lib/auth/constants";
import { verifyAccessToken } from "@/lib/auth/tokens";

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
  if (!accessToken) {
    return null;
  }

  const payload = await verifyAccessToken(accessToken);
  if (!payload?.sub) {
    return null;
  }

  return prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, email: true, createdAt: true },
  });
}

export async function getRefreshTokenFromCookies() {
  const cookieStore = await cookies();
  return cookieStore.get(REFRESH_TOKEN_COOKIE)?.value ?? null;
}

export async function requireUser(options: { lang: string; nextPath?: string }) {
  const user = await getCurrentUser();
  if (user) {
    return user;
  }

  const refreshToken = await getRefreshTokenFromCookies();
  if (refreshToken && options.nextPath) {
    redirect(`/api/auth/refresh?next=${encodeURIComponent(options.nextPath)}`);
  }

  redirect(`/${options.lang}/login`);
}
