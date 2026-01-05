type HostMode = "marketing" | "admin" | "tenant";

export function parseHost(rawHost: string) {
  const normalizedHost = rawHost.toLowerCase();
  const adminSubdomain = (process.env.ADMIN_SUBDOMAIN ?? "app").toLowerCase();

  if (!normalizedHost) {
    return { mode: "marketing" as HostMode, rawHost: normalizedHost };
  }

  if (normalizedHost.startsWith(`${adminSubdomain}.`)) {
    return { mode: "admin" as HostMode, rawHost: normalizedHost };
  }

  const rootDomain = (process.env.PLATFORM_ROOT_DOMAIN ?? "").toLowerCase();
  if (!rootDomain) {
    return { mode: "marketing" as HostMode, rawHost: normalizedHost };
  }

  if (normalizedHost === rootDomain) {
    return { mode: "marketing" as HostMode, rawHost: normalizedHost };
  }

  if (normalizedHost.endsWith(`.${rootDomain}`)) {
    const slugWithMaybeSubdomains = normalizedHost.slice(
      0,
      -(rootDomain.length + 1),
    );
    const tenantSlug = slugWithMaybeSubdomains.split(".")[0];
    return {
      mode: "tenant" as HostMode,
      tenantSlug,
      rawHost: normalizedHost,
    };
  }

  return { mode: "marketing" as HostMode, rawHost: normalizedHost };
}
