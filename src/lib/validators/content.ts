import { z } from 'zod';

// Pagination & Filtering Schema
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  category: z.string().optional(),
  featured: z.preprocess(
    (val) => (val === 'true' ? true : val === 'false' ? false : val),
    z.boolean().optional()
  ),
  status: z.enum(['DRAFT', 'PUBLISHED']).optional(),
  includeDrafts: z.preprocess(
    (val) => (val === 'true' ? true : val === 'false' ? false : val),
    z.boolean().optional()
  ),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

// 1. Project Schemas
export const createProjectSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters'),
  slug: z.string().optional(),
  shortDescription: z.string().min(5, 'Short description must be at least 5 characters').optional(),
  description: z.string().min(5).optional(), // backward-compatible alias
  fullDescription: z.string().optional().nullable(),
  content: z.string().optional().nullable(), // backward-compatible alias
  thumbnailUrl: z.string().url().optional().or(z.literal('')).nullable(),
  featuredImage: z.string().url().optional().or(z.literal('')).nullable(), // backward-compatible alias
  images: z.array(z.string()).optional().default([]),
  techStack: z.array(z.string()).optional().default([]),
  liveUrl: z.string().url().optional().or(z.literal('')).nullable(),
  liveDemoUrl: z.string().url().optional().or(z.literal('')).nullable(), // backward-compatible alias
  githubUrl: z.string().url().optional().or(z.literal('')).nullable(),
  categoryId: z.string().optional().nullable(),
  order: z.number().int().optional().default(0),
  isFeatured: z.boolean().optional().default(false),
  status: z.enum(['DRAFT', 'PUBLISHED']).optional().default('DRAFT'),
  publishedAt: z.union([z.date(), z.string()]).optional().nullable(),
});

export const updateProjectSchema = createProjectSchema.partial();
export type CreateProjectInput = z.input<typeof createProjectSchema>;
export type UpdateProjectInput = z.input<typeof updateProjectSchema>;

// 2. Skill Schemas
export const createSkillSchema = z.object({
  name: z.string().min(1, 'Skill name is required'),
  category: z.string().min(1, 'Category is required'),
  level: z.number().int().min(0).max(100).optional(),
  proficiency: z.number().int().min(0).max(100).optional(), // backward-compatible alias
  icon: z.string().optional().nullable(),
  order: z.number().int().optional().default(0),
  isVisible: z.boolean().optional().default(true),
  isFeatured: z.boolean().optional(), // backward-compatible alias
});

export const updateSkillSchema = createSkillSchema.partial();
export type CreateSkillInput = z.input<typeof createSkillSchema>;
export type UpdateSkillInput = z.input<typeof updateSkillSchema>;

// 3. Service Schemas
export const createServiceSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters'),
  description: z.string().min(5, 'Description is required'),
  icon: z.string().optional().nullable(),
  order: z.number().int().optional().default(0),
  isVisible: z.boolean().optional().default(true),
  slug: z.string().optional(), // backward-compatible
  features: z.array(z.string()).optional().default([]), // backward-compatible
  isFeatured: z.boolean().optional(), // backward-compatible
});

export const updateServiceSchema = createServiceSchema.partial();
export type CreateServiceInput = z.input<typeof createServiceSchema>;
export type UpdateServiceInput = z.input<typeof updateServiceSchema>;

// 4. Experience Schemas
export const createExperienceSchema = z.object({
  title: z.string().min(1).optional(),
  position: z.string().min(1).optional(), // backward-compatible alias
  company: z.string().min(1, 'Company is required'),
  location: z.string().optional().nullable(),
  startDate: z.union([z.date(), z.string()]),
  endDate: z.union([z.date(), z.string()]).optional().nullable(),
  isCurrent: z.boolean().optional().default(false),
  description: z.string().min(5, 'Description is required'),
  order: z.number().int().optional().default(0),
  employmentType: z.string().optional(), // backward-compatible
  technologies: z.array(z.string()).optional().default([]), // backward-compatible
});

export const updateExperienceSchema = createExperienceSchema.partial();
export type CreateExperienceInput = z.input<typeof createExperienceSchema>;
export type UpdateExperienceInput = z.input<typeof updateExperienceSchema>;

// 5. Education Schemas
export const createEducationSchema = z.object({
  degree: z.string().min(1, 'Degree is required'),
  institute: z.string().min(1).optional(),
  institution: z.string().min(1).optional(), // backward-compatible alias
  startDate: z.union([z.date(), z.string()]),
  endDate: z.union([z.date(), z.string()]).optional().nullable(),
  description: z.string().optional().nullable(),
  order: z.number().int().optional().default(0),
  fieldOfStudy: z.string().optional(), // backward-compatible
  grade: z.string().optional(), // backward-compatible
  isCurrent: z.boolean().optional(), // backward-compatible
});

export const updateEducationSchema = createEducationSchema.partial();
export type CreateEducationInput = z.input<typeof createEducationSchema>;
export type UpdateEducationInput = z.input<typeof updateEducationSchema>;

// 6. Testimonial Schemas
export const createTestimonialSchema = z.object({
  clientName: z.string().min(1, 'Client name is required'),
  clientRole: z.string().min(1, 'Client role is required'),
  company: z.string().optional().nullable(),
  message: z.string().min(5).optional(),
  content: z.string().min(5).optional(), // backward-compatible alias
  avatarUrl: z.string().url().optional().or(z.literal('')).nullable(),
  rating: z.number().int().min(1).max(5).optional().default(5),
  isApproved: z.boolean().optional().default(false),
  isFeatured: z.boolean().optional(), // backward-compatible
  order: z.number().int().optional().default(0),
});

export const updateTestimonialSchema = createTestimonialSchema.partial();
export type CreateTestimonialInput = z.input<typeof createTestimonialSchema>;
export type UpdateTestimonialInput = z.input<typeof updateTestimonialSchema>;

// 7. Category Schemas
export const createCategorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().optional(),
  description: z.string().optional(),
  type: z.string().optional(),
});

export const updateCategorySchema = createCategorySchema.partial();
export type CreateCategoryInput = z.input<typeof createCategorySchema>;
export type UpdateCategoryInput = z.input<typeof updateCategorySchema>;

// 8. SiteSetting Schemas
export const updateSiteSettingSchema = z.object({
  heroTitle: z.string().optional(),
  heroSubtitle: z.string().optional().nullable(),
  bio: z.string().optional().nullable(),
  email: z.string().email().optional(),
  phone: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  socialLinks: z.record(z.string(), z.any()).optional().nullable(),
  resumeUrl: z.string().optional().nullable(),
  defaultSeoTitle: z.string().optional(),
  defaultSeoDescription: z.string().optional(),
  defaultOgImage: z.string().optional().nullable(),
  // backward compatibility aliases
  siteName: z.string().optional(),
  siteTitle: z.string().optional(),
  siteDescription: z.string().optional(),
  ownerName: z.string().optional(),
  ownerTitle: z.string().optional(),
  contactEmail: z.string().optional(),
  githubUrl: z.string().optional(),
  linkedinUrl: z.string().optional(),
  twitterUrl: z.string().optional(),
  telegramUsername: z.string().optional(),
  isMaintenanceMode: z.boolean().optional(),
});
export type UpdateSiteSettingInput = z.input<typeof updateSiteSettingSchema>;
