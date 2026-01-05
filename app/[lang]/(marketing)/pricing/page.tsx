import Link from "next/link";
import { Check, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

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

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#dbeafe,_transparent_55%)]">
      <header className="border-b border-white/60 bg-white/80 backdrop-blur">
        <div className="container mx-auto flex items-center justify-between px-4 py-5">
          <Link
            href={`/${lang}`}
            className="text-sm font-semibold text-slate-900"
          >
            StayHost
          </Link>
          <div className="flex items-center gap-3">
            <Button asChild variant="outline">
              <a href={appUrl}>Login</a>
            </Button>
            <Button asChild>
              <a href={appUrl}>
                Start free
                <ChevronRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-semibold text-slate-900 md:text-5xl">
            Pricing built for hosts
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            Start with the essentials, unlock advanced features when you are
            ready.
          </p>
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-3">
          <PricingCard
            name="Starter"
            price="Free"
            features={[
              "Tenant subdomain",
              "Single language",
              "Booking requests",
              "Availability calendar",
            ]}
          />
          <PricingCard
            name="Professional"
            price="$19/mo"
            featured
            features={[
              "Custom domain",
              "Multi-language",
              "Premium templates",
              "Airbnb sync",
              "Priority support",
            ]}
          />
          <PricingCard
            name="Enterprise"
            price="$49/mo"
            features={[
              "White-label",
              "API access",
              "Dedicated onboarding",
              "Custom integrations",
            ]}
          />
        </div>
      </main>
    </div>
  );
}

function PricingCard({
  name,
  price,
  features,
  featured,
}: {
  name: string;
  price: string;
  features: string[];
  featured?: boolean;
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
            Most popular
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
