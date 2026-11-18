import type { APIRoute } from 'astro';
import { projectClickSchema } from '@/lib/validators/analytics';
import { analyticsService } from '@/services/analytics.service';
import { apiSuccess, apiError } from '@/lib/response';
import { logger } from '@/lib/logger';
import { captureException } from '@/lib/sentry';

export const prerender = false;

export const POST: APIRoute = async ({ request, clientAddress }) => {
  try {
    let body: any;
    try {
      body = await request.json();
    } catch {
      return apiError('Invalid JSON payload', 'BAD_REQUEST', 400);
    }

    const validation = projectClickSchema.safeParse(body);
    if (!validation.success) {
      return apiError(
        validation.error.issues[0]?.message || 'Validation error',
        'VALIDATION_ERROR',
        400
      );
    }

    const rawIp =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() || clientAddress || '127.0.0.1';

    const userAgent = request.headers.get('user-agent');

    const result = await analyticsService.trackProjectClick({
      projectId: validation.data.projectId,
      clickType: validation.data.clickType,
      rawIp,
      userAgent,
    });

    return apiSuccess(result, 201);
  } catch (error: any) {
    if (error.message && error.message.includes('not found')) {
      return apiError(error.message, 'NOT_FOUND', 404);
    }
    logger.error({ err: error }, 'Failed to record project click');
    captureException(error);
    return apiError('Failed to record project click', 'INTERNAL_ERROR', 500);
  }
};
