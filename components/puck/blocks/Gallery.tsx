"use client";

import type { GalleryProps } from "@/lib/puck/types";

export default function GalleryBlock({ images }: GalleryProps) {
  return (
    <section className="bg-white">
      <div className="container mx-auto px-4 py-16">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {images.map((image, index) => (
            <div
              key={`${image.url}-${index}`}
              className="aspect-[4/3] overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-100"
            >
              <img
                src={image.url}
                alt={`Gallery image ${index + 1}`}
                className="h-full w-full object-cover"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
