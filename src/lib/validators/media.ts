import { z } from 'zod';

export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/svg+xml',
  'image/gif',
];

export const ALLOWED_DOCUMENT_TYPES = ['application/pdf'];

export const ALLOWED_MIME_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOCUMENT_TYPES];

export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
export const MAX_DOCUMENT_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export function validateFileUpload(file: { name: string; type: string; size: number }): {
  valid: boolean;
  error?: string;
} {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Unsupported file type: ${file.type}. Allowed formats: JPG, PNG, WebP, SVG, GIF, PDF.`,
    };
  }

  const isPdf = file.type === 'application/pdf';
  const maxSize = isPdf ? MAX_DOCUMENT_SIZE_BYTES : MAX_IMAGE_SIZE_BYTES;

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size exceeds the limit of ${isPdf ? '10MB' : '5MB'}. Received ${(file.size / (1024 * 1024)).toFixed(2)}MB.`,
    };
  }

  return { valid: true };
}

export const mediaQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  folder: z.string().optional(),
  format: z.string().optional(),
  type: z.enum(['IMAGE', 'PDF', 'OTHER']).optional(),
});

export type MediaQuery = z.infer<typeof mediaQuerySchema>;

export const createMediaSchema = z.object({
  url: z.string().url(),
  publicId: z.string().min(1),
  type: z.enum(['IMAGE', 'PDF', 'OTHER']).default('IMAGE'),
  mimeType: z.string().min(1),
  size: z.number().int().nonnegative(),
  width: z.number().int().positive().optional().nullable(),
  height: z.number().int().positive().optional().nullable(),
  alt: z.string().optional().nullable(),
  folder: z.string().optional().default('portfolio'),
});

export const updateMediaSchema = z.object({
  alt: z.string().optional().nullable(),
  folder: z.string().optional(),
});

export type CreateMediaInput = z.infer<typeof createMediaSchema>;
export type UpdateMediaInput = z.infer<typeof updateMediaSchema>;
