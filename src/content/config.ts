import { defineCollection, z } from "astro:content";

const blog = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    heroImage: z.string().optional(),
    client: z.string().optional(),
    industry: z.string().optional(),
    services: z.array(z.string()).optional(),
    technologies: z.array(z.string()).optional(),
    duration: z.string().optional(),
    featured: z.boolean().default(false),
  }),
});

export const collections = { blog };

