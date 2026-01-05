import { NextResponse } from "next/server";
import { headers, cookies } from "next/headers";

import { parseHost } from "@/lib/tenancy/parse-host";
import { rotateRefreshToken } from "@/lib/auth/refresh";
import { setAuthCookies, clearAuthCookies } from "@/lib/auth/cookies";
import { REFRESH_TOKEN_COOKIE } from "@/lib/auth/constants";

async function ensureAdminHost() {
  const headerList = await headers();
  const host = headerList.get("host") ?? "";
  const { mode } = parseHost(host);
  return mode === "admin";
}

export async function GET(request: Request) {
  if (!(await ensureAdminHost())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;
  const url = new URL(request.url);
  const nextPath = url.searchParams.get("next") || "/";

  if (!refreshToken) {
    const response = NextResponse.redirect(new URL(nextPath, url.origin));
    await clearAuthCookies(response.cookies);
    return response;
  }

  const rotated = await rotateRefreshToken(refreshToken);
  if (!rotated) {
    const response = NextResponse.redirect(new URL(nextPath, url.origin));
    await clearAuthCookies(response.cookies);
    return response;
  }

  const response = NextResponse.redirect(new URL(nextPath, url.origin));
  await setAuthCookies(rotated.accessToken, rotated.refreshToken, response.cookies);
  return response;
}

export async function POST() {
  if (!(await ensureAdminHost())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;
  if (!refreshToken) {
    const response = NextResponse.json(
      { error: "Missing refresh token" },
      { status: 401 },
    );
    await clearAuthCookies(response.cookies);
    return response;
  }

  const rotated = await rotateRefreshToken(refreshToken);
  if (!rotated) {
    const response = NextResponse.json(
      { error: "Invalid refresh token" },
      { status: 401 },
    );
    await clearAuthCookies(response.cookies);
    return response;
  }

  const response = NextResponse.json({ ok: true });
  await setAuthCookies(rotated.accessToken, rotated.refreshToken, response.cookies);
  return response;
}
