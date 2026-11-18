import type { APIRoute } from 'astro';
import { contentService } from '@/services/content.service';
import { updateCategorySchema } from '@/lib/validators/content';
import { apiSuccess, apiError } from '@/lib/response';

export const prerender = false;

export const PUT: APIRoute = async ({ params, request, locals }) => {
  if (!locals.user) return apiError('Authentication required', 'UNAUTHORIZED', 401);
  const { id } = params;
  if (!id) return apiError('Category ID required', 'MISSING_ID', 400);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError('Malformed JSON payload', 'INVALID_JSON', 400);
  }

  const parseResult = updateCategorySchema.safeParse(body);
  if (!parseResult.success) {
    return apiError('Validation error', 'VALIDATION_ERROR', 400, parseResult.error.format());
  }

  const updated = await contentService.updateCategory(id, parseResult.data);
  return apiSuccess(updated);
};

export const DELETE: APIRoute = async ({ params, locals }) => {
  if (!locals.user) return apiError('Authentication required', 'UNAUTHORIZED', 401);
  const { id } = params;
  if (!id) return apiError('Category ID required', 'MISSING_ID', 400);

  await contentService.deleteCategory(id);
  return apiSuccess({ message: 'Category deleted successfully' });
};
