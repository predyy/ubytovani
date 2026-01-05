import { cookies } from "next/headers";

import {
  ACCESS_TOKEN_COOKIE,
  ACCESS_TOKEN_TTL_SECONDS,
  REFRESH_TOKEN_COOKIE,
  REFRESH_TOKEN_TTL_SECONDS,
  ACTIVE_TENANT_COOKIE,
} from "@/lib/auth/constants";

const isProd = process.env.NODE_ENV === "production";

type CookieSetter = {
  set: (
    name: string,
    value: string,
    options: {
      httpOnly: boolean;
      sameSite: "lax" | "strict" | "none";
      secure: boolean;
      path: string;
      maxAge: number;
    },
  ) => void;
};

export async function setAuthCookies(
  accessToken: string,
  refreshToken: string,
  cookieStore?: CookieSetter,
) {
  const resolvedStore = cookieStore ?? (await cookies());

  resolvedStore.set(ACCESS_TOKEN_COOKIE, accessToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
    path: "/",
    maxAge: ACCESS_TOKEN_TTL_SECONDS,
  });

  resolvedStore.set(REFRESH_TOKEN_COOKIE, refreshToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
    path: "/",
    maxAge: REFRESH_TOKEN_TTL_SECONDS,
  });
}

export async function clearAuthCookies(cookieStore?: CookieSetter) {
  const resolvedStore = cookieStore ?? (await cookies());

  resolvedStore.set(ACCESS_TOKEN_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
    path: "/",
    maxAge: 0,
  });

  resolvedStore.set(REFRESH_TOKEN_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
    path: "/",
    maxAge: 0,
  });
}

export async function setActiveTenantCookie(
  tenantId: string,
  cookieStore?: CookieSetter,
) {
  const resolvedStore = cookieStore ?? (await cookies());

  resolvedStore.set(ACTIVE_TENANT_COOKIE, tenantId, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
    path: "/",
    maxAge: REFRESH_TOKEN_TTL_SECONDS,
  });
}

export async function clearActiveTenantCookie(cookieStore?: CookieSetter) {
  const resolvedStore = cookieStore ?? (await cookies());

  resolvedStore.set(ACTIVE_TENANT_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
    path: "/",
    maxAge: 0,
  });
}
