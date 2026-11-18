import type { APIRoute } from 'astro';
import { contentService } from '@/services/content.service';
import { createCategorySchema } from '@/lib/validators/content';
import { apiSuccess, apiError } from '@/lib/response';

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  const type = url.searchParams.get('type') || undefined;
  const categories = await contentService.listCategories(type);
  return apiSuccess(categories);
};

export const POST: APIRoute = async ({ request, locals }) => {
  if (!locals.user) return apiError('Authentication required', 'UNAUTHORIZED', 401);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError('Malformed JSON payload', 'INVALID_JSON', 400);
  }

  const parseResult = createCategorySchema.safeParse(body);
  if (!parseResult.success) {
    return apiError('Validation error', 'VALIDATION_ERROR', 400, parseResult.error.format());
  }

  const category = await contentService.createCategory(parseResult.data);
  return apiSuccess(category, 201);
};
