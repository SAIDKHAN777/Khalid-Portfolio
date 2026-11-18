import type { APIRoute } from 'astro';
import { mediaService } from '@/services/media.service';
import { mediaQuerySchema } from '@/lib/validators/media';
import { apiSuccess, apiError } from '@/lib/response';

export const prerender = false;

export const GET: APIRoute = async ({ url, locals }) => {
  if (!locals.user) {
    return apiError('Authentication required', 'UNAUTHORIZED', 401);
  }

  const queryParams = Object.fromEntries(url.searchParams.entries());
  const parseResult = mediaQuerySchema.safeParse(queryParams);

  if (!parseResult.success) {
    return apiError(
      'Invalid query parameters',
      'VALIDATION_ERROR',
      400,
      parseResult.error.format()
    );
  }

  const result = await mediaService.listMedia(parseResult.data);
  return apiSuccess(result);
};
