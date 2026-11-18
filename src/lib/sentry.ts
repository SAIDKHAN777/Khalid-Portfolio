import { logger } from './logger';

export type SeverityLevel = 'fatal' | 'error' | 'warning' | 'log' | 'info' | 'debug';

export function captureServerError(
  error: unknown,
  context?: Record<string, unknown>
): string | undefined {
  const errorMessage = error instanceof Error ? error.message : String(error);
  logger.error({ err: errorMessage, context }, `[Error Capture] ${errorMessage}`);
  return undefined;
}

export const captureException = captureServerError;

export function captureServerMessage(message: string, level: SeverityLevel = 'info'): void {
  logger.info({ level }, `[Server Message] ${message}`);
}
