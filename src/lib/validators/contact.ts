import { z } from 'zod';

export const submitContactSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().trim().email('Please enter a valid email address'),
  subject: z.string().trim().min(3, 'Subject must be at least 3 characters').max(200),
  message: z.string().trim().min(10, 'Message must be at least 10 characters').max(5000),
  honeypot: z.string().optional(), // Must be empty to pass spam test
  turnstileToken: z.string().optional(),
});

export type SubmitContactInput = z.infer<typeof submitContactSchema>;

export const contactQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.enum(['NEW', 'READ', 'REPLIED', 'SPAM']).optional(),
  isRead: z.preprocess(
    (val) => (val === 'true' ? true : val === 'false' ? false : val),
    z.boolean().optional()
  ),
  search: z.string().optional(),
});

export type ContactQuery = z.infer<typeof contactQuerySchema>;

export const updateContactMessageSchema = z.object({
  status: z.enum(['NEW', 'READ', 'REPLIED', 'SPAM']).optional(),
  isRead: z.boolean().optional(),
});

export type UpdateContactMessageInput = z.infer<typeof updateContactMessageSchema>;
