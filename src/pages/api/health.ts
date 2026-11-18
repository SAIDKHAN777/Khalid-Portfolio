import type { APIRoute } from 'astro';
import { apiSuccess, apiError } from '@/lib/response';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/db';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  logger.info({ path: '/api/health', method: request.method }, 'Health check requested');

  try {
    await prisma.$queryRaw`SELECT 1`;
    return apiSuccess({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
    });
  } catch (error) {
    logger.error({ error }, 'Database health check failed');
    return apiError('Database unreachable', 'SERVICE_UNAVAILABLE', 503, {
      status: 'degraded',
      database: 'disconnected',
    });
  }
};
