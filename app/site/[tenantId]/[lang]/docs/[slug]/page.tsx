import { notFound } from "next/navigation";
import sanitizeHtml from "sanitize-html";
import { marked } from "marked";

import { prisma } from "@/lib/prisma";
import {
  staticDocSlugs,
  type StaticDocSlug,
} from "@/lib/uploads/constants";
import { getPublicUrlForKey } from "@/lib/uploads/s3";

type TenantDocPageProps = {
  params: Promise<{
    tenantId: string;
    lang: string;
    slug: string;
  }>;
};

export default async function TenantDocPage({ params }: TenantDocPageProps) {
  const { tenantId, lang, slug } = await params;

  if (!staticDocSlugs.includes(slug as StaticDocSlug)) {
    notFound();
  }

  const doc = await prisma.staticDoc.findUnique({
    where: {
      tenantId_locale_slug: {
        tenantId,
        locale: lang,
        slug,
      },
    },
  });

  if (!doc) {
    return (
      <main className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-16">
          <div className="rounded-3xl border border-slate-200/80 bg-slate-50 p-10 text-center">
            <h1 className="text-3xl font-semibold text-slate-900">
              Document not available
            </h1>
            <p className="mt-4 text-slate-600">
              This document has not been uploaded yet.
            </p>
          </div>
        </div>
      </main>
    );
  }

  const publicUrl = getPublicUrlForKey(doc.s3Key);

  if (doc.mimeType === "application/pdf") {
    return (
      <main className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-10">
          <div className="flex flex-col gap-2">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
              Document
            </p>
            <h1 className="text-3xl font-semibold text-slate-900">
              {doc.title}
            </h1>
          </div>
          <div className="mt-8 overflow-hidden rounded-3xl border border-slate-200/80 bg-slate-50">
            <iframe
              src={publicUrl}
              className="h-[80vh] w-full"
              title={doc.title}
            />
          </div>
        </div>
      </main>
    );
  }

  const response = await fetch(publicUrl, { cache: "no-store" });
  if (!response.ok) {
    return (
      <main className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-16">
          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-10 text-center">
            <h1 className="text-3xl font-semibold text-amber-900">
              Document unavailable
            </h1>
            <p className="mt-4 text-amber-700">
              We could not load the document content.
            </p>
          </div>
        </div>
      </main>
    );
  }

  const markdown = await response.text();
  const rawHtml = marked.parse(markdown);
  const safeHtml = sanitizeHtml(rawHtml, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat([
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "img",
      "pre",
      "code",
      "blockquote",
    ]),
    allowedAttributes: {
      a: ["href", "name", "target", "rel"],
      img: ["src", "alt"],
      code: ["class"],
    },
    allowedSchemes: ["http", "https", "mailto"],
  });

  return (
    <main className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-16">
        <div className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
            Document
          </p>
          <h1 className="text-3xl font-semibold text-slate-900">
            {doc.title}
          </h1>
          <p className="text-sm text-slate-500">
            Updated {new Date(doc.updatedAt).toLocaleDateString()}
          </p>
        </div>
        <article
          className="doc-content mt-10"
          dangerouslySetInnerHTML={{ __html: safeHtml }}
        />
      </div>
    </main>
  );
}
