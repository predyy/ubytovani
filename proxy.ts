import { NextRequest, NextResponse } from "next/server";

import { fallbackLocale, isSupportedLocale } from "@/lib/i18n/locales";
import { parseHost } from "@/lib/tenancy/parse-host";
import { findTenantBySlug } from "@/lib/tenancy/tenant";

const IGNORE_PATHS = new Set(["/favicon.ico", "/robots.txt", "/sitemap.xml"]);

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    IGNORE_PATHS.has(pathname)
  ) {
    return NextResponse.next();
  }

  const segments = pathname.split("/").filter(Boolean);
  const requestedLocale = segments[0];
  const hasValidLocale = requestedLocale && isSupportedLocale(requestedLocale);

  if (!hasValidLocale) {
    const redirectUrl = req.nextUrl.clone();
    const restPath = segments.join("/");
    redirectUrl.pathname = `/${fallbackLocale}${
      restPath ? `/${restPath}` : ""
    }`;
    return NextResponse.redirect(redirectUrl);
  }

  const lang = requestedLocale;
  const restPath = segments.slice(1).join("/");
  const hostHeader = req.headers.get("host") ?? "";
  const { mode, tenantSlug, rawHost } = parseHost(hostHeader);

  if (mode === "tenant") {
    if (!tenantSlug) {
      return new NextResponse("Tenant not found", { status: 404 });
    }

    const tenant = await findTenantBySlug(tenantSlug);

    if (!tenant) {
      return new NextResponse("Tenant not found", { status: 404 });
    }

    if (tenant.defaultLocale !== lang) {
      const redirectUrl = req.nextUrl.clone();
      redirectUrl.pathname = `/${tenant.defaultLocale}${
        restPath ? `/${restPath}` : ""
      }`;
      return NextResponse.redirect(redirectUrl);
    }

    const rewriteUrl = req.nextUrl.clone();
    rewriteUrl.pathname = `/site/${tenant.id}/${lang}${
      restPath ? `/${restPath}` : ""
    }`;

    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-tenant-id", tenant.id);
    requestHeaders.set("x-tenant-mode", "tenant");
    requestHeaders.set("x-tenant-host", rawHost);

    const response = NextResponse.rewrite(rewriteUrl, {
      request: { headers: requestHeaders },
    });
    response.headers.set("x-tenant-id", tenant.id);
    response.headers.set("x-tenant-mode", "tenant");
    response.headers.set("x-tenant-host", rawHost);

    return response;
  }

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-tenant-mode", mode);
  requestHeaders.set("x-tenant-host", rawHost);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("x-tenant-mode", mode);
  response.headers.set("x-tenant-host", rawHost);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
