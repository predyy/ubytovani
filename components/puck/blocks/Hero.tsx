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
  imageUrl,
  imageAlt,
}: HeroProps) {
  const hasImage = Boolean(imageUrl);

  return (
    <section className={backgroundStyles[backgroundStyle] ?? "bg-white"}>
      <div className="container mx-auto px-4 py-20">
        <div
          className={
            hasImage
              ? "grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]"
              : "max-w-3xl"
          }
        >
          <div>
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
          {hasImage ? (
            <div className="relative">
              <div className="aspect-[4/5] overflow-hidden rounded-3xl border border-white/70 bg-white shadow-xl">
                <img
                  src={imageUrl}
                  alt={imageAlt || title}
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
