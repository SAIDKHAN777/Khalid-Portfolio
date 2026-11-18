import type { APIRoute } from 'astro';
import { contentService } from '@/services/content.service';
import { createEducationSchema } from '@/lib/validators/content';
import { apiSuccess, apiError } from '@/lib/response';

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  const isAdmin = !!locals.user;
  const educations = await contentService.listEducations(isAdmin);
  return apiSuccess(educations);
};

export const POST: APIRoute = async ({ request, locals }) => {
  if (!locals.user) return apiError('Authentication required', 'UNAUTHORIZED', 401);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError('Malformed JSON payload', 'INVALID_JSON', 400);
  }

  const parseResult = createEducationSchema.safeParse(body);
  if (!parseResult.success) {
    return apiError('Validation error', 'VALIDATION_ERROR', 400, parseResult.error.format());
  }

  const education = await contentService.createEducation(parseResult.data);
  return apiSuccess(education, 201);
};
