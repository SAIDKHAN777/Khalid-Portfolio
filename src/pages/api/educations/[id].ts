import type { APIRoute } from 'astro';
import { contentService } from '@/services/content.service';
import { updateEducationSchema } from '@/lib/validators/content';
import { apiSuccess, apiError } from '@/lib/response';

export const prerender = false;

export const PUT: APIRoute = async ({ params, request, locals }) => {
  if (!locals.user) return apiError('Authentication required', 'UNAUTHORIZED', 401);
  const { id } = params;
  if (!id) return apiError('Education ID required', 'MISSING_ID', 400);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError('Malformed JSON payload', 'INVALID_JSON', 400);
  }

  const parseResult = updateEducationSchema.safeParse(body);
  if (!parseResult.success) {
    return apiError('Validation error', 'VALIDATION_ERROR', 400, parseResult.error.format());
  }

  const updated = await contentService.updateEducation(id, parseResult.data);
  return apiSuccess(updated);
};

export const DELETE: APIRoute = async ({ params, url, locals }) => {
  if (!locals.user) return apiError('Authentication required', 'UNAUTHORIZED', 401);
  const { id } = params;
  if (!id) return apiError('Education ID required', 'MISSING_ID', 400);

  const permanent = url.searchParams.get('permanent') === 'true';
  await contentService.deleteEducation(id, !permanent);
  return apiSuccess({ message: 'Education deleted successfully' });
};
