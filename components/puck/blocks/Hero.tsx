"use client";

import type { HeroProps } from "@/lib/puck/types";

const backgroundStyles: Record<HeroProps["backgroundStyle"], string> = {
  solid: "bg-white",
  gradient: "bg-gradient-to-br from-blue-50 via-white to-sky-50",
};

export default function HeroBlock({
  title,
  subtitle,
  backgroundStyle,
  primaryButtonLabel,
  primaryButtonHref,
}: HeroProps) {
  return (
    <section className={backgroundStyles[backgroundStyle] ?? "bg-white"}>
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-3xl">
          <p className="text-xs uppercase tracking-[0.3em] text-blue-500">
            Hosted stays
          </p>
          <h1 className="mt-4 text-4xl font-semibold text-slate-900 md:text-5xl">
            {title}
          </h1>
          <p className="mt-4 text-lg text-slate-600">{subtitle}</p>
          {primaryButtonLabel ? (
            <div className="mt-8">
              <a
                href={primaryButtonHref || "#booking"}
                className="inline-flex items-center justify-center rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                {primaryButtonLabel}
              </a>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
