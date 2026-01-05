"use client";

import type { FooterProps } from "@/lib/puck/types";

export default function FooterBlock({ copyright, links }: FooterProps) {
  return (
    <footer className="bg-slate-950 text-slate-300">
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <p className="text-sm">{copyright}</p>
          <div className="flex flex-wrap gap-4 text-sm text-slate-400">
            {links.map((link, index) => (
              <a
                key={`${link.href}-${link.label}-${index}`}
                href={link.href}
                className="hover:text-white"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
