type TenantDocPageProps = {
  params: Promise<{
    tenantId: string;
    lang: string;
    slug: string;
  }>;
};

export default async function TenantDocPage({ params }: TenantDocPageProps) {
  const { tenantId, lang, slug } = await params;

  return (
    <main className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-16">
        <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
          Tenant document
        </div>
        <h1 className="mt-6 text-4xl font-semibold text-slate-900">
          Document placeholder
        </h1>
        <p className="mt-4 text-lg text-slate-600">
          This is where tenant-uploaded docs like terms or privacy will render.
        </p>
        <div className="mt-8 rounded-2xl border border-slate-200/80 bg-slate-50 p-6 text-sm text-slate-600">
          <div>Tenant ID: {tenantId}</div>
          <div>Locale: {lang}</div>
          <div>Slug: {slug}</div>
        </div>
      </div>
    </main>
  );
}
