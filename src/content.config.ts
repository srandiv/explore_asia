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

const packages = defineCollection({
  loader: glob({ base: "./src/content/packages", pattern: "**/*.md" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    image: z.string().url(),
    imageAlt: z.string(),
    order: z.number().int().nonnegative(),
  }),
});

const testimonials = defineCollection({
  loader: glob({ base: "./src/content/testimonials", pattern: "**/*.md" }),
  schema: z.object({
    name: z.string(),
    location: z.string(),
    quote: z.string(),
    order: z.number().int().nonnegative(),
  }),
});

const faqs = defineCollection({
  loader: glob({ base: "./src/content/faqs", pattern: "**/*.md" }),
  schema: z.object({
    question: z.string(),
    answer: z.string(),
    order: z.number().int().nonnegative(),
  }),
});

export const collections = {
  services,
  packages,
  testimonials,
  faqs,
};
