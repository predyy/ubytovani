import { randomUUID } from "node:crypto";
import { z } from "zod";

import type { PuckDataShape } from "@/lib/puck/types";

const idSchema = z.string().optional();

const heroSchema = z
  .object({
    type: z.literal("Hero"),
    props: z
      .object({
        id: idSchema,
        title: z.string(),
        subtitle: z.string(),
        backgroundStyle: z.enum(["solid", "gradient"]),
        primaryButtonLabel: z.string().optional(),
        primaryButtonHref: z.string().optional(),
      })
      .strip(),
  })
  .strip();

const richTextSchema = z
  .object({
    type: z.literal("RichText"),
    props: z
      .object({
        id: idSchema,
        text: z.string(),
      })
      .strip(),
  })
  .strip();

const featuresSchema = z
  .object({
    type: z.literal("Features"),
    props: z
      .object({
        id: idSchema,
        items: z
          .array(
            z
              .object({
                title: z.string(),
                description: z.string(),
              })
              .strip(),
          ),
      })
      .strip(),
  })
  .strip();

const gallerySchema = z
  .object({
    type: z.literal("Gallery"),
    props: z
      .object({
        id: idSchema,
        images: z
          .array(
            z
              .object({
                url: z.string(),
              })
              .strip(),
          ),
      })
      .strip(),
  })
  .strip();

const bookingSchema = z
  .object({
    type: z.literal("BookingCTA"),
    props: z
      .object({
        id: idSchema,
        heading: z.string(),
        text: z.string(),
        buttonLabel: z.string(),
      })
      .strip(),
  })
  .strip();

const footerSchema = z
  .object({
    type: z.literal("Footer"),
    props: z
      .object({
        id: idSchema,
        copyright: z.string(),
        links: z.array(
          z
            .object({
              label: z.string(),
              href: z.string(),
            })
            .strip(),
        ),
      })
      .strip(),
  })
  .strip();

const puckDataSchema = z
  .object({
    content: z.array(
      z.discriminatedUnion("type", [
        heroSchema,
        richTextSchema,
        featuresSchema,
        gallerySchema,
        bookingSchema,
        footerSchema,
      ]),
    ),
    root: z
      .object({
        props: z.record(z.unknown()).optional(),
      })
      .optional(),
  })
  .strip();

export function ensurePuckIds(data: PuckDataShape): PuckDataShape {
  const content = data.content.map((block) => {
    const props = { ...block.props } as Record<string, unknown>;
    const existingId = typeof props.id === "string" ? props.id.trim() : "";
    if (!existingId) {
      props.id = `${block.type}-${randomUUID()}`;
    }
    return {
      ...block,
      props,
    } as PuckDataShape["content"][number];
  });

  return {
    ...data,
    content,
  };
}

export function sanitizePuckData(data: unknown): PuckDataShape | null {
  const parsed = puckDataSchema.safeParse(data);
  if (!parsed.success) {
    return null;
  }
  return ensurePuckIds(parsed.data as PuckDataShape);
}
