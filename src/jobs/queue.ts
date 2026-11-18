import { logger } from '@/lib/logger';

export const CONTACT_QUEUE_NAME = 'contact-notifications';
export const ANALYTICS_QUEUE_NAME = 'analytics-maintenance';

export interface ContactNotificationJobData {
  messageId: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  ipHash?: string;
  createdAt: string;
}

export interface AnalyticsMaintenanceJobData {
  retentionDays: number;
}

export async function enqueueContactNotification(data: ContactNotificationJobData) {
  logger.info(
    { messageId: data.messageId, email: data.email },
    'Contact notification recorded'
  );
  return { id: data.messageId };
}

export async function enqueueAnalyticsMaintenance(retentionDays = 90) {
  logger.info({ retentionDays }, 'Analytics maintenance triggered');
  return { retentionDays };
}

export async function scheduleDailyAnalyticsCleanup() {
  logger.info('Analytics cleanup scheduler registered');
}
