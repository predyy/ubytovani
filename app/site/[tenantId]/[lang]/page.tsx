import { headers } from "next/headers";
import { notFound } from "next/navigation";

import RenderBlocks from "@/components/puck/RenderBlocks";
import { prisma } from "@/lib/prisma";
import { sanitizePuckData } from "@/lib/puck/validation";

type TenantSitePageProps = {
  params: Promise<{
    tenantId: string;
    lang: string;
  }>;
};

export default async function TenantSitePage({ params }: TenantSitePageProps) {
  const { tenantId, lang } = await params;
  const headerList = await headers();
  const tenantHost = headerList.get("x-tenant-host") ?? "unknown";

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
  });

  if (!tenant) {
    notFound();
  }

  const published = await prisma.sitePageConfig.findUnique({
    where: {
      tenantId_locale_status: {
        tenantId,
        locale: lang,
        status: "PUBLISHED",
      },
    },
  });

  if (!published) {
    return (
      <main className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-16">
          <div className="rounded-3xl border border-slate-200/80 bg-slate-50 p-10 text-center">
            <h1 className="text-3xl font-semibold text-slate-900">
              Site not published yet
            </h1>
            <p className="mt-4 text-slate-600">
              Your host is still preparing the website. Please check back soon.
            </p>
          </div>
        </div>
      </main>
    );
  }

  const sanitized = sanitizePuckData(published.puckJson);

  if (!sanitized) {
    return (
      <main className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-16">
          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-10 text-center">
            <h1 className="text-3xl font-semibold text-amber-900">
              Site temporarily unavailable
            </h1>
            <p className="mt-4 text-amber-700">
              We ran into a configuration issue. Please try again later.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="border-b border-slate-100">
        <div className="container mx-auto flex items-center justify-between px-4 py-4 text-xs text-slate-400">
          <span>{tenant.name}</span>
          <span>{tenantHost}</span>
        </div>
      </div>
      <SafeRender data={sanitized} />
    </main>
  );
}

function SafeRender({ data }: { data: ReturnType<typeof sanitizePuckData> }) {
  try {
    if (!data) {
      return null;
    }
    return <RenderBlocks data={data} />;
  } catch (error) {
    console.error("Render failed", error);
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-10 text-center">
          <h1 className="text-3xl font-semibold text-amber-900">
            Site temporarily unavailable
          </h1>
          <p className="mt-4 text-amber-700">
            We ran into a rendering issue. Please try again later.
          </p>
        </div>
      </div>
    );
  }
}
