import { analyticsService } from '@/services/analytics.service';
import { logger } from '@/lib/logger';
import { captureServerError } from '@/lib/sentry';

export async function processAnalyticsMaintenance(retentionDays = 90) {
  logger.info({ retentionDays }, 'Starting scheduled analytics maintenance and cleanup');
  try {
    const result = await analyticsService.cleanupOldAnalytics(retentionDays);
    logger.info(
      { deletedCount: result.deletedCount, cutoffDate: result.cutoffDate },
      'Scheduled analytics maintenance completed successfully'
    );
    return result;
  } catch (error: any) {
    logger.error({ err: error.message }, 'Scheduled analytics maintenance failed');
    captureServerError(error, { context: 'processAnalyticsMaintenance' });
    throw error;
  }
}
