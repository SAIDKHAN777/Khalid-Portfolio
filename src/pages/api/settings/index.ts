import type { APIRoute } from 'astro';
import { contentService } from '@/services/content.service';
import { updateSiteSettingSchema } from '@/lib/validators/content';
import { apiSuccess, apiError } from '@/lib/response';

export const prerender = false;

export const GET: APIRoute = async () => {
  const settings = await contentService.getSiteSettings();
  return apiSuccess(settings);
};

export const PUT: APIRoute = async ({ request, locals }) => {
  if (!locals.user) return apiError('Authentication required', 'UNAUTHORIZED', 401);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError('Malformed JSON payload', 'INVALID_JSON', 400);
  }

  const parseResult = updateSiteSettingSchema.safeParse(body);
  if (!parseResult.success) {
    return apiError('Validation error', 'VALIDATION_ERROR', 400, parseResult.error.format());
  }

  const updated = await contentService.updateSiteSettings(parseResult.data);
  return apiSuccess(updated);
};
