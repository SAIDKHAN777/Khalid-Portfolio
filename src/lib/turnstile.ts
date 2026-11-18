import { logger } from './logger';

export async function verifyTurnstileToken(token?: string, remoteIp?: string): Promise<boolean> {
  const secretKey = process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY;

  // In development, test mode, or if secret key is not set, allow execution
  if (!secretKey || process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development') {
    return true;
  }

  if (!token) {
    logger.warn('Turnstile verification failed: Token missing in production');
    return false;
  }

  try {
    const formData = new URLSearchParams();
    formData.append('secret', secretKey);
    formData.append('response', token);
    if (remoteIp) {
      formData.append('remoteip', remoteIp);
    }

    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
    });

    const data = (await response.json()) as { success: boolean; 'error-codes'?: string[] };
    if (!data.success) {
      logger.warn({ errorCodes: data['error-codes'] }, 'Turnstile verification rejected');
      return false;
    }

    return true;
  } catch (error) {
    logger.error({ error }, 'Failed to connect to Cloudflare Turnstile verification endpoint');
    return false;
  }
}
