import { z } from 'zod';

export const pageViewSchema = z.object({
  path: z.string().min(1, 'Path is required').max(500),
  referrer: z.string().max(1000).optional().nullable(),
  country: z.string().max(10).optional().nullable(),
  device: z.string().max(50).optional().nullable(),
  visitorHash: z.string().optional(),
});

export const projectClickSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  clickType: z.enum(['LIVE', 'GITHUB', 'DETAILS']),
});

export const resumeDownloadSchema = z.object({
  visitorHash: z.string().optional(),
});

export const adminAnalyticsQuerySchema = z.object({
  range: z.enum(['7d', '30d', '90d', 'all']).default('30d'),
});

export type PageViewInput = z.infer<typeof pageViewSchema>;
export type ProjectClickInput = z.infer<typeof projectClickSchema>;
export type ResumeDownloadInput = z.infer<typeof resumeDownloadSchema>;
export type AdminAnalyticsQuery = z.infer<typeof adminAnalyticsQuerySchema>;
