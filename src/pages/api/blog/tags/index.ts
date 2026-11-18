import type { APIRoute } from 'astro';
import { blogService } from '@/services/blog.service';
import { createTagSchema } from '@/lib/validators/blog';
import { apiSuccess, apiError } from '@/lib/response';

export const prerender = false;

export const GET: APIRoute = async () => {
  const tags = await blogService.listTags();
  return apiSuccess(tags);
};

export const POST: APIRoute = async ({ request, locals }) => {
  if (!locals.user) return apiError('Authentication required', 'UNAUTHORIZED', 401);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError('Malformed JSON payload', 'INVALID_JSON', 400);
  }

  const parseResult = createTagSchema.safeParse(body);
  if (!parseResult.success) {
    return apiError('Validation error', 'VALIDATION_ERROR', 400, parseResult.error.format());
  }

  const tag = await blogService.createTag(parseResult.data.name, parseResult.data.slug);
  return apiSuccess(tag, 201);
};
