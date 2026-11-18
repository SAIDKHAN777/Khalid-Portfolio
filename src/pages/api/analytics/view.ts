import type { APIRoute } from 'astro';
import { pageViewSchema } from '@/lib/validators/analytics';
import { analyticsService } from '@/services/analytics.service';
import { apiSuccess, apiError } from '@/lib/response';
import { logger } from '@/lib/logger';
import { captureException } from '@/lib/sentry';

export const prerender = false;

export const POST: APIRoute = async ({ request, clientAddress }) => {
  try {
    let body: any;
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      body = await request.json();
    } else {
      const text = await request.text();
      try {
        body = JSON.parse(text);
      } catch {
        body = {};
      }
    }

    const validation = pageViewSchema.safeParse(body);
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
    const country =
      request.headers.get('cf-ipcountry') || request.headers.get('x-country-code') || null;

    const result = await analyticsService.trackPageView({
      path: validation.data.path,
      referrer: validation.data.referrer,
      rawIp,
      userAgent,
      country,
    });

    return apiSuccess(
      {
        recorded: true,
        id: result.id,
        isBot: result.isBot,
      },
      201
    );
  } catch (error: any) {
    logger.error({ err: error }, 'Failed to record page view');
    captureException(error);
    return apiError('Failed to record page view', 'INTERNAL_ERROR', 500);
  }
};
