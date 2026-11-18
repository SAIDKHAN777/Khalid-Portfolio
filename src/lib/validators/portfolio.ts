import { z } from 'zod';

// 1. SiteSettings Schema
export const siteSettingsSchema = z.object({
  id: z.string().optional().default('default'),
  heroGreeting: z.string().min(1, 'Hero greeting is required').default('Hello'),
  heroIntro: z
    .string()
    .min(10, 'Hero intro must be at least 10 characters')
    .default(
      'My name is Khalid. I work as an AI Engineer, AI Automation Expert and Full Stack Developer, building software apps, backend systems, AI platforms and personal AI agents.'
    ),
  heroPhotoUrl: z.string().optional().or(z.literal('')).nullable(),
  ownerName: z.string().min(2, 'Owner name is required').default('Khalid'),
  aboutTitle: z.string().min(1, 'About title is required').default('About Khalid'),
  aboutBio: z.string().optional().default(''),
  aboutBioParagraph1: z.string().optional().default(''),
  aboutBioParagraph2: z.string().optional().default(''),
  aboutBioParagraph3: z.string().optional().default(''),
  socialProfiles: z.any().optional(),
  aboutYoutubeUrl: z.string().optional().default('https://youtube.com'),
  aboutFacebookUrl: z.string().optional().default('https://facebook.com'),
  aboutLinkedinUrl: z.string().optional().default('https://linkedin.com'),
  aboutGithubUrl: z.string().optional().default('https://github.com'),
  aboutXUrl: z.string().optional().default('https://x.com'),
  footerHeadline: z.string().min(2, 'Footer headline is required').default('Connect with us'),
  footerSubline: z
    .string()
    .min(5, 'Footer subline is required')
    .default("Have a project in mind? Let's make it happen."),
  contactButtonLabel: z
    .string()
    .min(2, 'Contact button label is required')
    .default('Contact Us ->'),
  contactUrl: z.string().min(1, 'Contact URL is required').default('mailto:contact@khalid.dev'),
  footerCopyright: z
    .string()
    .min(2, 'Footer copyright is required')
    .default('© 2026 Khalid. All rights reserved.'),
  seoTitle: z
    .string()
    .min(2, 'SEO title is required')
    .default('Khalid | AI Engineer & Full Stack Developer'),
  seoDescription: z
    .string()
    .min(10, 'SEO description must be at least 10 characters')
    .default(
      'Personal portfolio of Khalid - AI Engineer, AI Automation Expert and Full Stack Developer.'
    ),
  ogImageUrl: z.string().optional().or(z.literal('')).nullable(),
});

export const updateSiteSettingsSchema = siteSettingsSchema.partial();
export type SiteSettingsInput = z.input<typeof siteSettingsSchema>;
export type UpdateSiteSettingsInput = z.input<typeof updateSiteSettingsSchema>;

// 2. Section Schema (Giant heading band and works grouping)
export const sectionSchema = z.object({
  id: z.string().optional(),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  title: z.string().min(1, 'Section title is required'),
  order: z.number().int().optional().default(0),
  isVisible: z.boolean().optional().default(true),
});

export const updateSectionSchema = sectionSchema.partial();
export type SectionInput = z.input<typeof sectionSchema>;
export type UpdateSectionInput = z.input<typeof updateSectionSchema>;

// 3. Service Schema (Four numbered rows 01-04)
export const serviceSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, 'Service title is required'),
  order: z.number().int().optional().default(0),
  sectionId: z.string().optional().nullable(),
  isVisible: z.boolean().optional().default(true),
  description: z.string().optional().nullable(),
  icon: z.string().optional().nullable(),
});

export const updatePortfolioServiceSchema = serviceSchema.partial();
export type ServiceInput = z.input<typeof serviceSchema>;
export type UpdatePortfolioServiceInput = z.input<typeof updatePortfolioServiceSchema>;

// 4. Work Schema (Showcase panels with media or gradient fallbacks)
export const workMediaTypeSchema = z.enum(['IMAGE', 'VIDEO']);
export type WorkMediaType = z.infer<typeof workMediaTypeSchema>;

export const workSchema = z.object({
  id: z.string().optional(),
  sectionId: z.string().min(1, 'Section ID is required'),
  title: z.string().min(1, 'Work title is required'),
  subtitle: z.string().optional().nullable(),
  tags: z.array(z.string()).default([]),
  mediaType: workMediaTypeSchema.default('IMAGE'),
  mediaUrl: z.string().optional().or(z.literal('')).nullable(),
  posterUrl: z.string().optional().or(z.literal('')).nullable(),
  fallbackColorA: z
    .string()
    .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Invalid hex color')
    .default('#181824'),
  fallbackColorB: z
    .string()
    .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Invalid hex color')
    .default('#252538'),
  focalX: z.number().min(0).max(100).optional().default(50),
  focalY: z.number().min(0).max(100).optional().default(50),
  altText: z.string().optional().nullable(),
  linkLabel: z.string().default('View'),
  linkUrl: z.string().optional().or(z.literal('')).nullable(),
  order: z.number().int().optional().default(0),
  isPublished: z.boolean().optional().default(true),
  isPinned: z.boolean().optional().default(true),
});

export const updateWorkSchema = workSchema.partial();
export type WorkInput = z.input<typeof workSchema>;
export type UpdateWorkInput = z.input<typeof updateWorkSchema>;

// 5. AdminUser Schema
export const adminUserSchema = z.object({
  id: z.string().optional(),
  email: z.string().email('Valid email is required'),
  password: z.string().min(8, 'Password must be at least 8 characters').optional(),
  passwordHash: z.string().optional(),
});

export const adminLoginSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(1, 'Password is required'),
});

export type AdminUserInput = z.infer<typeof adminUserSchema>;
export type AdminLoginInput = z.infer<typeof adminLoginSchema>;
