import type { ReactNode } from "react";
import Link from "next/link";
import {
  Calendar,
  Check,
  ChevronRight,
  Globe,
  LayoutTemplate,
  Mail,
  Shield,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supportedLocales } from "@/lib/i18n/locales";
import { getMessages } from "@/lib/i18n/messages";

type LandingPageProps = {
  lang: string;
};

export default function LandingPage({ lang }: LandingPageProps) {
  const rootDomain = process.env.PLATFORM_ROOT_DOMAIN ?? "localhost.local:3000";
  const adminSubdomain = process.env.ADMIN_SUBDOMAIN ?? "app";
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
  const appUrl = `${protocol}://${adminSubdomain}.${rootDomain}/${lang}/login`;
  const demoUrl = `${protocol}://tenant1.${rootDomain}/${lang}`;
  const messages = getMessages(lang);
  const copy = messages.marketing.landing;
  const { brand, languageLabel } = messages.common;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#dbeafe,_transparent_55%),radial-gradient(circle_at_bottom,_#e0f2fe,_transparent_50%)]">
      <header className="sticky top-0 z-50 border-b border-white/60 bg-white/80 backdrop-blur">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2 text-slate-900">
            <div className="rounded-2xl bg-blue-600 p-2 text-white shadow-sm">
              <House className="h-6 w-6" />
            </div>
            <span className="text-xl font-semibold tracking-tight">
              {brand}
            </span>
          </div>
          <nav className="hidden items-center gap-8 text-sm font-medium md:flex">
            <a href="#features" className="text-slate-600 hover:text-slate-900">
              {copy.nav.features}
            </a>
            <a
              href="#how-it-works"
              className="text-slate-600 hover:text-slate-900"
            >
              {copy.nav.howItWorks}
            </a>
            <a
              href="#templates"
              className="text-slate-600 hover:text-slate-900"
            >
              {copy.nav.templates}
            </a>
            <a href="#pricing" className="text-slate-600 hover:text-slate-900">
              {copy.nav.pricing}
            </a>

            <Button asChild variant="outline" size="default">
              <a href={appUrl}>{copy.nav.login}</a>
            </Button>
            <Button asChild size="default">
              <a href={appUrl}>{copy.nav.startFree}</a>
            </Button>
            <LanguageSwitcher
              label={languageLabel}
              currentLang={lang}
              hrefForLocale={(locale) => `/${locale}`}
            />
          </nav>
          <div className="flex items-center gap-3 md:hidden">
            <LanguageSwitcher
              label={languageLabel}
              currentLang={lang}
              hrefForLocale={(locale) => `/${locale}`}
            />
            <Button asChild size="default">
              <a href={appUrl}>{copy.nav.startFree}</a>
            </Button>
          </div>
        </div>
      </header>

      <section className="container mx-auto grid gap-12 px-4 pb-24 pt-20 md:grid-cols-[1.1fr_0.9fr] md:pt-28">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-3 py-1 text-xs font-medium text-blue-700 shadow-sm">
            <Sparkles className="h-4 w-4" />
            {copy.hero.badge}
          </div>
          <h1 className="mt-6 text-4xl font-semibold leading-tight text-slate-900 md:text-6xl">
            {copy.hero.title}
          </h1>
          <p className="mt-6 text-lg text-slate-600 md:text-xl">
            {copy.hero.description}
          </p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <Button asChild size="lg">
              <a href={appUrl}>
                {copy.hero.primaryCta}
                <ChevronRight className="ml-2 h-5 w-5" />
              </a>
            </Button>
            <Button asChild variant="outline" size="lg">
              <a href={demoUrl}>{copy.hero.secondaryCta}</a>
            </Button>
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-6 text-sm text-slate-600">
            {copy.hero.checklist.map((item) => (
              <div key={item} className="flex items-center gap-2">
                <Check className="h-5 w-5 text-emerald-500" />
                {item}
              </div>
            ))}
          </div>
        </div>
        <div className="relative">
          <div className="absolute -left-6 top-10 h-20 w-20 rounded-full bg-blue-200/40 blur-2xl" />
          <div className="absolute -bottom-6 right-0 h-28 w-28 rounded-full bg-sky-200/50 blur-3xl" />
          <div className="overflow-hidden rounded-3xl border border-white/70 bg-white shadow-2xl">
            <img
              src="https://images.unsplash.com/photo-1733516587408-2530ab53ceda?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHNhYXMlMjBkYXNoYm9hcmR8ZW58MXx8fHwxNzY2NzM5NTUyfDA&ixlib=rb-4.1.0&q=80&w=1200&utm_source=figma&utm_medium=referral"
              alt={copy.hero.previewAlt}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="absolute -bottom-8 left-8 rounded-2xl border border-slate-100 bg-white p-4 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                <Calendar className="h-6 w-6" />
              </div>
              <div>
                <div className="text-sm text-slate-500">
                  {copy.hero.bookingsThisWeek}
                </div>
                <div className="text-2xl font-semibold text-slate-900">42</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="bg-white py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-semibold text-slate-900 md:text-4xl">
              {copy.features.title}
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              {copy.features.description}
            </p>
          </div>
          <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <BenefitCard
              icon={<LayoutTemplate className="h-6 w-6" />}
              title={copy.features.items[0].title}
              description={copy.features.items[0].description}
            />
            <BenefitCard
              icon={<Calendar className="h-6 w-6" />}
              title={copy.features.items[1].title}
              description={copy.features.items[1].description}
            />
            <BenefitCard
              icon={<Shield className="h-6 w-6" />}
              title={copy.features.items[2].title}
              description={copy.features.items[2].description}
            />
            <BenefitCard
              icon={<Globe className="h-6 w-6" />}
              title={copy.features.items[3].title}
              description={copy.features.items[3].description}
            />
            <BenefitCard
              icon={<Sparkles className="h-6 w-6" />}
              title={copy.features.items[4].title}
              description={copy.features.items[4].description}
            />
            <BenefitCard
              icon={<Mail className="h-6 w-6" />}
              title={copy.features.items[5].title}
              description={copy.features.items[5].description}
            />
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-semibold text-slate-900 md:text-4xl">
              {copy.steps.title}
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              {copy.steps.description}
            </p>
          </div>
          <div className="mt-12 grid gap-8 md:grid-cols-4">
            {copy.steps.items.map((item) => (
              <StepCard
                key={item.number}
                number={item.number}
                title={item.title}
                description={item.description}
              />
            ))}
          </div>
        </div>
      </section>

      <section
        id="templates"
        className="bg-gradient-to-b from-blue-50 to-white py-20"
      >
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-semibold text-slate-900 md:text-4xl">
              {copy.templates.title}
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              {copy.templates.description}
            </p>
          </div>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {copy.templates.items.map((item) => (
              <TemplateCard
                key={item.name}
                name={item.name}
                image={item.image}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-semibold text-slate-900 md:text-4xl">
              {copy.testimonials.title}
            </h2>
          </div>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {copy.testimonials.items.map((item) => (
              <TestimonialCard
                key={item.author}
                quote={item.quote}
                author={item.author}
                role={item.role}
              />
            ))}
          </div>
        </div>
      </section>

      <section
        id="pricing"
        className="bg-gradient-to-b from-slate-50 to-white py-20"
      >
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-semibold text-slate-900 md:text-4xl">
              {copy.pricing.title}
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              {copy.pricing.description}
            </p>
          </div>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {copy.pricing.tiers.map((tier) => (
              <PricingCard
                key={tier.name}
                name={tier.name}
                price={tier.price}
                appUrl={appUrl}
                featured={tier.featured}
                features={tier.features}
                featuredLabel={copy.pricing.featuredLabel}
                ctaLabel={copy.pricing.cta}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-blue-600 py-20 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-semibold md:text-4xl">
            {copy.cta.title}
          </h2>
          <p className="mt-4 text-lg text-blue-100">{copy.cta.description}</p>
          <div className="mt-8 flex justify-center">
            <Button asChild size="lg" variant="secondary">
              <a href={appUrl}>
                {copy.cta.button}
                <ChevronRight className="ml-2 h-5 w-5" />
              </a>
            </Button>
          </div>
        </div>
      </section>

      <footer className="bg-slate-950 py-12 text-slate-300">
        <div className="container mx-auto grid gap-8 px-4 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2 text-white">
              <div className="rounded-xl bg-blue-600 p-2">
                <House className="h-5 w-5" />
              </div>
              <span className="text-lg font-semibold">{brand}</span>
            </div>
            <p className="mt-4 text-sm text-slate-400">
              {copy.footer.description}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">
              {copy.footer.product}
            </h3>
            <ul className="mt-4 space-y-2 text-sm text-slate-400">
              <li>
                <a href="#features" className="hover:text-white">
                  {copy.footer.features}
                </a>
              </li>
              <li>
                <a href="#templates" className="hover:text-white">
                  {copy.footer.templates}
                </a>
              </li>
              <li>
                <a href="#pricing" className="hover:text-white">
                  {copy.footer.pricing}
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">
              {copy.footer.company}
            </h3>
            <ul className="mt-4 space-y-2 text-sm text-slate-400">
              <li>
                <Link href={`/${lang}/pricing`} className="hover:text-white">
                  {copy.footer.roadmap}
                </Link>
              </li>
              <li>
                <a href="#" className="hover:text-white">
                  {copy.footer.careers}
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white">
                  {copy.footer.press}
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">
              {copy.footer.support}
            </h3>
            <ul className="mt-4 space-y-2 text-sm text-slate-400">
              <li>
                <a href={appUrl} className="hover:text-white">
                  {copy.footer.login}
                </a>
              </li>
              <li>
                <a href={appUrl} className="hover:text-white">
                  {copy.footer.register}
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white">
                  {copy.footer.help}
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="container mx-auto mt-10 border-t border-slate-800 px-4 pt-6 text-center text-xs text-slate-500">
          {copy.footer.copyright}
        </div>
      </footer>
    </div>
  );
}

function BenefitCard({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Card>
      <CardContent>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
          {icon}
        </div>
        <h3 className="mt-5 text-xl font-semibold text-slate-900">{title}</h3>
        <p className="mt-3 text-sm text-slate-600">{description}</p>
      </CardContent>
    </Card>
  );
}

function StepCard({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 text-center shadow-sm">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-lg font-semibold text-white">
        {number}
      </div>
      <h3 className="mt-5 text-lg font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm text-slate-600">{description}</p>
    </div>
  );
}

function TemplateCard({ name, image }: { name: string; image: string }) {
  return (
    <Card className="overflow-hidden transition hover:-translate-y-1 hover:shadow-xl">
      <div className="aspect-[4/3] overflow-hidden">
        <img
          src={image}
          alt={name}
          className="h-full w-full object-cover transition duration-300 hover:scale-105"
        />
      </div>
      <CardContent>
        <h3 className="text-lg font-semibold text-slate-900">{name}</h3>
      </CardContent>
    </Card>
  );
}

function TestimonialCard({
  quote,
  author,
  role,
}: {
  quote: string;
  author: string;
  role: string;
}) {
  return (
    <Card>
      <CardContent>
        <div className="flex items-center gap-1 text-amber-400">
          {Array.from({ length: 5 }).map((_, index) => (
            <Star key={index} className="h-4 w-4 fill-current" />
          ))}
        </div>
        <p className="mt-4 text-sm text-slate-700">"{quote}"</p>
        <div className="mt-4 text-sm font-semibold text-slate-900">
          {author}
        </div>
        <div className="text-xs text-slate-500">{role}</div>
      </CardContent>
    </Card>
  );
}

function PricingCard({
  name,
  price,
  features,
  featured,
  appUrl,
  featuredLabel,
  ctaLabel,
}: {
  name: string;
  price: string;
  features: string[];
  featured?: boolean;
  appUrl: string;
  featuredLabel: string;
  ctaLabel: string;
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
        <h3 className="mt-4 text-2xl font-semibold text-slate-900">{name}</h3>
        <div className="mt-2 text-4xl font-semibold text-slate-900">
          {price}
        </div>
        <ul className="mt-6 space-y-3 text-sm text-slate-600">
          {features.map((feature) => (
            <li key={feature} className="flex items-start gap-3">
              <Check className="mt-0.5 h-5 w-5 text-emerald-500" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
        <Button
          asChild
          variant={featured ? "default" : "outline"}
          size="default"
          className="mt-8 w-full"
        >
          <a href={appUrl}>{ctaLabel}</a>
        </Button>
      </CardContent>
    </Card>
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

function House({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function Star({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}
