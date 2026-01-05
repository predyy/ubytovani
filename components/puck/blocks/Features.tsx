"use client";

import type { FeaturesProps } from "@/lib/puck/types";

export default function FeaturesBlock({ items }: FeaturesProps) {
  return (
    <section className="bg-slate-50">
      <div className="container mx-auto px-4 py-16">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item, index) => (
            <div
              key={`${item.title}-${index}`}
              className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
                <FeatureIcon index={index} />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-slate-900">
                {item.title}
              </h3>
              <p className="mt-2 text-sm text-slate-600">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureIcon({ index }: { index: number }) {
  const colors = [
    "text-blue-600",
    "text-emerald-600",
    "text-indigo-600",
    "text-rose-600",
    "text-amber-600",
    "text-sky-600",
  ];
  const color = colors[index % colors.length];

  return (
    <svg
      className={`h-6 w-6 ${color}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M4 12l4 4 12-12" />
    </svg>
  );
}
