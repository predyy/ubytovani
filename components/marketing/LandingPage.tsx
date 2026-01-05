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

type LandingPageProps = {
  lang: string;
};

export default function LandingPage({ lang }: LandingPageProps) {
  const rootDomain = process.env.PLATFORM_ROOT_DOMAIN ?? "localhost.local:3000";
  const adminSubdomain = process.env.ADMIN_SUBDOMAIN ?? "app";
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
  const appUrl = `${protocol}://${adminSubdomain}.${rootDomain}/${lang}/login`;
  const demoUrl = `${protocol}://tenant1.${rootDomain}/${lang}`;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#dbeafe,_transparent_55%),radial-gradient(circle_at_bottom,_#e0f2fe,_transparent_50%)]">
      <header className="sticky top-0 z-50 border-b border-white/60 bg-white/80 backdrop-blur">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2 text-slate-900">
            <div className="rounded-2xl bg-blue-600 p-2 text-white shadow-sm">
              <House className="h-6 w-6" />
            </div>
            <span className="text-xl font-semibold tracking-tight">StayHost</span>
          </div>
          <nav className="hidden items-center gap-8 text-sm font-medium md:flex">
            <a href="#features" className="text-slate-600 hover:text-slate-900">
              Features
            </a>
            <a href="#how-it-works" className="text-slate-600 hover:text-slate-900">
              How it works
            </a>
            <a href="#templates" className="text-slate-600 hover:text-slate-900">
              Templates
            </a>
            <a href="#pricing" className="text-slate-600 hover:text-slate-900">
              Pricing
            </a>
            <Button asChild variant="outline" size="default">
              <a href={appUrl}>Login</a>
            </Button>
            <Button asChild size="default">
              <a href={appUrl}>Start free</a>
            </Button>
          </nav>
          <div className="flex items-center gap-3 md:hidden">
            <Button asChild size="default">
              <a href={appUrl}>Start free</a>
            </Button>
          </div>
        </div>
      </header>

      <section className="container mx-auto grid gap-12 px-4 pb-24 pt-20 md:grid-cols-[1.1fr_0.9fr] md:pt-28">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-3 py-1 text-xs font-medium text-blue-700 shadow-sm">
            <Sparkles className="h-4 w-4" />
            Launch your booking site this afternoon
          </div>
          <h1 className="mt-6 text-4xl font-semibold leading-tight text-slate-900 md:text-6xl">
            A multi-tenant booking platform built for accommodation hosts
          </h1>
          <p className="mt-6 text-lg text-slate-600 md:text-xl">
            Create a single-page property site, manage availability, and accept
            booking requests. Every host gets a subdomain, multi-language
            routing, and a private admin workspace.
          </p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <Button asChild size="lg">
              <a href={appUrl}>
                Build your site
                <ChevronRight className="ml-2 h-5 w-5" />
              </a>
            </Button>
            <Button asChild variant="outline" size="lg">
              <a href={demoUrl}>View live demo</a>
            </Button>
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-6 text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-emerald-500" />
              No credit card required
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-emerald-500" />
              Free tenant subdomain
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-emerald-500" />
              Single-page site by default
            </div>
          </div>
        </div>
        <div className="relative">
          <div className="absolute -left-6 top-10 h-20 w-20 rounded-full bg-blue-200/40 blur-2xl" />
          <div className="absolute -bottom-6 right-0 h-28 w-28 rounded-full bg-sky-200/50 blur-3xl" />
          <div className="overflow-hidden rounded-3xl border border-white/70 bg-white shadow-2xl">
            <img
              src="https://images.unsplash.com/photo-1733516587408-2530ab53ceda?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHNhYXMlMjBkYXNoYm9hcmR8ZW58MXx8fHwxNzY2NzM5NTUyfDA&ixlib=rb-4.1.0&q=80&w=1200&utm_source=figma&utm_medium=referral"
              alt="Admin dashboard preview"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="absolute -bottom-8 left-8 rounded-2xl border border-slate-100 bg-white p-4 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                <Calendar className="h-6 w-6" />
              </div>
              <div>
                <div className="text-sm text-slate-500">Bookings this week</div>
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
              Everything you need to run your accommodation business
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Build a guest-facing site, accept bookings, and keep your admin
              work separated from your public tenant experience.
            </p>
          </div>
          <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <BenefitCard
              icon={<LayoutTemplate className="h-6 w-6" />}
              title="WYSIWYG site builder"
              description="Edit your single-page site with drag-and-drop sections. Publish instantly on your subdomain."
            />
            <BenefitCard
              icon={<Calendar className="h-6 w-6" />}
              title="Availability calendar"
              description="Block dates, sync reservations, and keep your inventory accurate across channels."
            />
            <BenefitCard
              icon={<Shield className="h-6 w-6" />}
              title="Private admin space"
              description="Hosts manage bookings, settings, and emails in a secure admin dashboard."
            />
            <BenefitCard
              icon={<Globe className="h-6 w-6" />}
              title="Multi-language routing"
              description="Every tenant uses /{lang} routes with locale enforcement and future paid upgrades."
            />
            <BenefitCard
              icon={<Sparkles className="h-6 w-6" />}
              title="Custom templates"
              description="Choose from curated layouts designed for modern accommodation brands."
            />
            <BenefitCard
              icon={<Mail className="h-6 w-6" />}
              title="Configurable emails"
              description="Customize all guest and host emails per locale with your branding."
            />
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-semibold text-slate-900 md:text-4xl">
              Launch your site in four steps
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              From signup to bookings without touching a line of code.
            </p>
          </div>
          <div className="mt-12 grid gap-8 md:grid-cols-4">
            <StepCard number="1" title="Register" description="Create your host account." />
            <StepCard number="2" title="Pick a template" description="Choose a layout built for stays." />
            <StepCard number="3" title="Customize" description="Add photos, amenities, and availability." />
            <StepCard number="4" title="Publish" description="Go live on your subdomain." />
          </div>
        </div>
      </section>

      <section id="templates" className="bg-gradient-to-b from-blue-50 to-white py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-semibold text-slate-900 md:text-4xl">
              Templates that feel like boutique brands
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Curated designs that keep the focus on your property and story.
            </p>
          </div>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            <TemplateCard
              name="Modern Minimal"
              image="https://images.unsplash.com/photo-1642132652859-3ef5a1048fd1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3ZWJzaXRlJTIwdGVtcGxhdGV8ZW58MXx8fHwxNzY2NzEzNzM4fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
            />
            <TemplateCard
              name="Luxury Resort"
              image="https://images.unsplash.com/photo-1578683010236-d716f9a3f461?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBob3RlbCUyMHJvb218ZW58MXx8fHwxNzY2NzM5Mzc0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
            />
            <TemplateCard
              name="Cozy Boutique"
              image="https://images.unsplash.com/photo-1652481462565-3cfb977049a0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhY2NvbW1vZGF0aW9uJTIwcHJvcGVydHl8ZW58MXx8fHwxNzY2NzM5Mzc1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
            />
          </div>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-semibold text-slate-900 md:text-4xl">
              Trusted by accommodation owners
            </h2>
          </div>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            <TestimonialCard
              quote="We launched our site in a weekend and immediately started taking direct bookings."
              author="Sarah Johnson"
              role="B&B Owner, Vermont"
            />
            <TestimonialCard
              quote="The availability calendar keeps us in sync with Airbnb without the headaches."
              author="Michael Chen"
              role="Vacation Rental Owner, California"
            />
            <TestimonialCard
              quote="The templates look premium and the admin experience feels private and secure."
              author="Emma Williams"
              role="Boutique Hotel Manager, Oregon"
            />
          </div>
        </div>
      </section>

      <section id="pricing" className="bg-gradient-to-b from-slate-50 to-white py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-semibold text-slate-900 md:text-4xl">
              Simple pricing that grows with you
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Start free, upgrade when you need multi-language and custom
              domains.
            </p>
          </div>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
          <PricingCard
            name="Starter"
            price="Free"
            appUrl={appUrl}
            features={[
              "Tenant subdomain",
              "Single-language site",
              "Booking requests",
              "Availability calendar",
            ]}
          />
          <PricingCard
            name="Professional"
            price="$19/mo"
            appUrl={appUrl}
            featured
            features={[
              "Custom domain",
              "Multi-language support",
              "Premium templates",
              "Airbnb sync",
              "Priority support",
            ]}
          />
          <PricingCard
            name="Enterprise"
            price="$49/mo"
            appUrl={appUrl}
            features={[
              "Everything in Pro",
              "White-label experience",
              "API access",
              "Dedicated onboarding",
              ]}
            />
          </div>
        </div>
      </section>

      <section className="bg-blue-600 py-20 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-semibold md:text-4xl">
            Ready to publish your property site?
          </h2>
          <p className="mt-4 text-lg text-blue-100">
            Join hosts building their booking business on StayHost.
          </p>
          <div className="mt-8 flex justify-center">
            <Button asChild size="lg" variant="secondary">
              <a href={appUrl}>
                Create your website
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
              <span className="text-lg font-semibold">StayHost</span>
            </div>
            <p className="mt-4 text-sm text-slate-400">
              The multi-tenant platform for accommodation websites, bookings,
              and guest communication.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Product</h3>
            <ul className="mt-4 space-y-2 text-sm text-slate-400">
              <li>
                <a href="#features" className="hover:text-white">
                  Features
                </a>
              </li>
              <li>
                <a href="#templates" className="hover:text-white">
                  Templates
                </a>
              </li>
              <li>
                <a href="#pricing" className="hover:text-white">
                  Pricing
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Company</h3>
            <ul className="mt-4 space-y-2 text-sm text-slate-400">
              <li>
                <Link href={`/${lang}/pricing`} className="hover:text-white">
                  Roadmap
                </Link>
              </li>
              <li>
                <a href="#" className="hover:text-white">
                  Careers
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white">
                  Press
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Support</h3>
            <ul className="mt-4 space-y-2 text-sm text-slate-400">
              <li>
                <a href={appUrl} className="hover:text-white">
                  Login
                </a>
              </li>
              <li>
                <a href={appUrl} className="hover:text-white">
                  Register
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white">
                  Help center
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="container mx-auto mt-10 border-t border-slate-800 px-4 pt-6 text-center text-xs text-slate-500">
          &copy; 2024 StayHost. All rights reserved.
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
        <div className="mt-4 text-sm font-semibold text-slate-900">{author}</div>
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
}: {
  name: string;
  price: string;
  features: string[];
  featured?: boolean;
  appUrl: string;
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
          <a href={appUrl}>Get started</a>
        </Button>
      </CardContent>
    </Card>
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
    <svg className={className} viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}
