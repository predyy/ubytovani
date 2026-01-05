"use client";

import type { RichTextProps } from "@/lib/puck/types";

export default function RichTextBlock({ text }: RichTextProps) {
  return (
    <section className="bg-white">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl text-base leading-relaxed text-slate-700 whitespace-pre-line">
          {text}
        </div>
      </div>
    </section>
  );
}
