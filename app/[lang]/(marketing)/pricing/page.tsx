import Link from "next/link";
import { Check, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supportedLocales } from "@/lib/i18n/locales";
import { getMessages } from "@/lib/i18n/messages";

type PricingPageProps = {
  params: Promise<{
    lang: string;
  }>;
};

export default async function PricingPage({ params }: PricingPageProps) {
  const { lang } = await params;
  const rootDomain = process.env.PLATFORM_ROOT_DOMAIN ?? "localhost.local:3000";
  const adminSubdomain = process.env.ADMIN_SUBDOMAIN ?? "app";
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
  const appUrl = `${protocol}://${adminSubdomain}.${rootDomain}/${lang}/login`;
  const messages = getMessages(lang);
  const copy = messages.marketing.pricingPage;
  const { brand, languageLabel } = messages.common;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#dbeafe,_transparent_55%)]">
      <header className="border-b border-white/60 bg-white/80 backdrop-blur">
        <div className="container mx-auto flex items-center justify-between px-4 py-5">
          <Link
            href={`/${lang}`}
            className="text-sm font-semibold text-slate-900"
          >
            {brand}
          </Link>
          <div className="flex items-center gap-3">
            <LanguageSwitcher
              label={languageLabel}
              currentLang={lang}
              hrefForLocale={(locale) => `/${locale}/pricing`}
            />
            <Button asChild variant="outline">
              <a href={appUrl}>{copy.login}</a>
            </Button>
            <Button asChild>
              <a href={appUrl}>
                {copy.startFree}
                <ChevronRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-semibold text-slate-900 md:text-5xl">
            {copy.title}
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            {copy.description}
          </p>
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {copy.tiers.map((tier) => (
            <PricingCard
              key={tier.name}
              name={tier.name}
              price={tier.price}
              featured={tier.featured}
              features={tier.features}
              featuredLabel={copy.featuredLabel}
            />
          ))}
        </div>
      </main>
    </div>
  );
}

function LanguageSwitcher({
  label,
  currentLang,
  hrefForLocale,
}: {
  label: string;
  currentLang: string;
  hrefForLocale: (locale: string) => string;
}) {
  return (
    <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-white/70 px-1.5 py-1 text-xs font-semibold text-slate-600">
      <span className="sr-only">{label}</span>
      {supportedLocales.map((locale) => {
        const isActive = locale === currentLang;
        return (
          <a
            key={locale}
            href={hrefForLocale(locale)}
            className={
              isActive
                ? "rounded-full bg-blue-600 px-2 py-1 text-white"
                : "rounded-full px-2 py-1 text-slate-600 hover:text-slate-900"
            }
            aria-current={isActive ? "page" : undefined}
          >
            {locale.toUpperCase()}
          </a>
        );
      })}
    </div>
  );
}

function PricingCard({
  name,
  price,
  features,
  featured,
  featuredLabel,
}: {
  name: string;
  price: string;
  features: string[];
  featured?: boolean;
  featuredLabel: string;
}) {
  return (
    <Card
      className={
        featured
          ? "border-blue-600/60 bg-white shadow-xl ring-1 ring-blue-200"
          : ""
      }
    >
      <CardContent>
        {featured ? (
          <span className="inline-flex rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white">
            {featuredLabel}
          </span>
        ) : null}
        <h2 className="mt-4 text-2xl font-semibold text-slate-900">{name}</h2>
        <div className="mt-2 text-4xl font-semibold text-slate-900">{price}</div>
        <ul className="mt-6 space-y-3 text-sm text-slate-600">
          {features.map((feature) => (
            <li key={feature} className="flex items-start gap-3">
              <Check className="mt-0.5 h-5 w-5 text-emerald-500" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
