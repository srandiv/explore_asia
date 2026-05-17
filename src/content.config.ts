import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const services = defineCollection({
  loader: glob({ base: "./src/content/services", pattern: "**/*.md" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    image: z.string().url(),
    imageAlt: z.string(),
    order: z.number().int().nonnegative(),
  }),
});

export const collections = {
  services,
};
