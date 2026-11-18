import type { APIRoute } from 'astro';
import { adminAnalyticsQuerySchema } from '@/lib/validators/analytics';
import { analyticsService } from '@/services/analytics.service';
import { apiSuccess, apiError } from '@/lib/response';
import { logger } from '@/lib/logger';
import { captureException } from '@/lib/sentry';

export const prerender = false;

export const GET: APIRoute = async ({ url, locals }) => {
  if (!locals.user) {
    return apiError('Authentication required', 'UNAUTHORIZED', 401);
  }

  try {
    const rawRange = url.searchParams.get('range') || '30d';
    const validation = adminAnalyticsQuerySchema.safeParse({ range: rawRange });

    if (!validation.success) {
      return apiError(
        validation.error.issues[0]?.message || 'Invalid range parameter',
        'VALIDATION_ERROR',
        400,
        validation.error.format()
      );
    }

    const stats = await analyticsService.getAdminStats(validation.data.range);
    return apiSuccess(stats);
  } catch (error: any) {
    logger.error({ err: error }, 'Failed to fetch admin analytics');
    captureException(error);
    return apiError('Failed to fetch admin analytics', 'INTERNAL_ERROR', 500);
  }
};
