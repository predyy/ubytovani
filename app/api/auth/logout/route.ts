import { NextResponse } from "next/server";
import { headers, cookies } from "next/headers";

import { parseHost } from "@/lib/tenancy/parse-host";
import { REFRESH_TOKEN_COOKIE } from "@/lib/auth/constants";
import { clearActiveTenantCookie, clearAuthCookies } from "@/lib/auth/cookies";
import { revokeRefreshToken } from "@/lib/auth/refresh";

async function ensureAdminHost() {
  const headerList = await headers();
  const host = headerList.get("host") ?? "";
  const { mode } = parseHost(host);
  return mode === "admin";
}

export async function POST(request: Request) {
  if (!(await ensureAdminHost())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;
  if (refreshToken) {
    await revokeRefreshToken(refreshToken);
  }

  const url = new URL(request.url);
  const nextPath = url.searchParams.get("next") || "/en/login";
  const response = NextResponse.redirect(new URL(nextPath, url.origin));
  await clearAuthCookies(response.cookies);
  await clearActiveTenantCookie(response.cookies);
  return response;
}
