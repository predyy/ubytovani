"use client";

import type { BookingCTAProps } from "@/lib/puck/types";

export default function BookingCTABlock({
  heading,
  text,
  buttonLabel,
}: BookingCTAProps) {
  return (
    <section className="bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600">
      <div className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-3xl text-center text-white">
          <h2 className="text-3xl font-semibold md:text-4xl">{heading}</h2>
          <p className="mt-4 text-lg text-blue-100">{text}</p>
          <a
            href="#booking"
            className="mt-8 inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
          >
            {buttonLabel}
          </a>
        </div>
      </div>
    </section>
  );
}
