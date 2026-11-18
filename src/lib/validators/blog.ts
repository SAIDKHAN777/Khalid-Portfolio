import { z } from 'zod';

export const blogQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  tag: z.string().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED']).optional(),
  includeDrafts: z.preprocess(
    (val) => (val === 'true' ? true : val === 'false' ? false : val),
    z.boolean().optional()
  ),
});

export type BlogQuery = z.infer<typeof blogQuerySchema>;

export const createBlogPostSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  slug: z.string().optional(),
  excerpt: z.string().min(5, 'Excerpt must be at least 5 characters').optional(),
  summary: z.string().optional(), // backward-compatible alias
  content: z.string().min(10, 'Content must be at least 10 characters'),
  coverImageUrl: z.string().optional().or(z.literal('')).nullable(),
  featuredImage: z.string().optional().or(z.literal('')).nullable(), // backward-compatible alias
  status: z.enum(['DRAFT', 'PUBLISHED']).default('DRAFT'),
  publishedAt: z.union([z.date(), z.string()]).optional().nullable(),
  seoTitle: z.string().optional().nullable(),
  seoDescription: z.string().optional().nullable(),
  readingTime: z.number().int().min(1).optional(),
  tags: z.array(z.string()).default([]),
});

export const updateBlogPostSchema = createBlogPostSchema.partial();

export const createTagSchema = z.object({
  name: z.string().min(1, 'Tag name is required'),
  slug: z.string().optional(),
});

export const updateTagSchema = createTagSchema.partial();

export type CreateBlogPostInput = z.input<typeof createBlogPostSchema>;
export type UpdateBlogPostInput = z.input<typeof updateBlogPostSchema>;
export type CreateTagInput = z.input<typeof createTagSchema>;
export type UpdateTagInput = z.input<typeof updateTagSchema>;
