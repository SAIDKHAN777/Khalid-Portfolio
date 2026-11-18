import type { APIRoute } from 'astro';
import { submitContactSchema, contactQuerySchema } from '@/lib/validators/contact';
import { contactService } from '@/services/contact.service';
import { checkRateLimit } from '@/lib/rateLimit';
import { verifyTurnstileToken } from '@/lib/turnstile';
import { enqueueContactNotification } from '@/jobs/queue';
import { apiSuccess, apiError } from '@/lib/response';
import { logger } from '@/lib/logger';
import crypto from 'crypto';

export const prerender = false;

// GET: Admin inbox
export const GET: APIRoute = async ({ url, locals }) => {
  if (!locals.user) {
    return apiError('Authentication required', 'UNAUTHORIZED', 401);
  }

  const queryParams = Object.fromEntries(url.searchParams.entries());
  const parseResult = contactQuerySchema.safeParse(queryParams);

  if (!parseResult.success) {
    return apiError(
      'Invalid query parameters',
      'VALIDATION_ERROR',
      400,
      parseResult.error.format()
    );
  }

  const result = await contactService.listMessages(parseResult.data);
  return apiSuccess(result);
};

// POST: Public contact submission
export const POST: APIRoute = async ({ request, clientAddress }) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError('Malformed JSON payload', 'INVALID_JSON', 400);
  }

  // 1. Validate payload with Zod
  const parseResult = submitContactSchema.safeParse(body);
  if (!parseResult.success) {
    return apiError('Validation error', 'VALIDATION_ERROR', 400, parseResult.error.format());
  }

  const { name, email, subject, message, honeypot, turnstileToken } = parseResult.data;
  const rawIp =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() || clientAddress || '127.0.0.1';

  // 2. Spam Protection: Honeypot trap
  if (honeypot && honeypot.trim().length > 0) {
    logger.warn({ ip: rawIp, honeypot }, 'Spam bot caught by honeypot field');
    // Silently return success to mislead the bot
    return apiSuccess({
      message: 'Thank you for reaching out! Your message has been received.',
    });
  }

  // 3. Spam Protection: IP Rate Limiting (3 per hour)
  const rateLimitResult = await checkRateLimit(`contact:${rawIp}`, 3, 3600);
  if (!rateLimitResult.allowed) {
    logger.warn({ ip: rawIp }, 'Contact form rate limit exceeded');
    return apiError(
      'Too many contact inquiries from this network. Please try again later.',
      'RATE_LIMIT_EXCEEDED',
      429,
      { resetInSeconds: rateLimitResult.resetInSeconds }
    );
  }

  // 4. Spam Protection: Cloudflare Turnstile Verification
  const isTurnstileValid = await verifyTurnstileToken(turnstileToken, rawIp);
  if (!isTurnstileValid) {
    return apiError(
      'Security verification failed. Please complete the captcha.',
      'CAPTCHA_FAILED',
      400
    );
  }

  // Salted daily IP hash for privacy
  const dailySalt = new Date().toISOString().slice(0, 10);
  const ipHash = crypto
    .createHash('sha256')
    .update(`${rawIp}-${dailySalt}`)
    .digest('hex')
    .slice(0, 16);

  try {
    // 5. Persist to ContactMessage table in Database
    const savedMessage = await contactService.createMessage({
      name,
      email,
      subject,
      message,
      ipHash,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    // 6. Enqueue BullMQ background job (asynchronous, non-blocking)
    await enqueueContactNotification({
      messageId: savedMessage.id,
      name,
      email,
      subject,
      message,
      ipHash,
      createdAt: savedMessage.createdAt.toISOString(),
    });

    logger.info(
      { messageId: savedMessage.id, email },
      'Contact inquiry saved and notification job enqueued'
    );

    return apiSuccess(
      {
        message:
          'Thank you for reaching out! Your message has been received and queued for notification.',
        id: savedMessage.id,
      },
      200
    );
  } catch (error: unknown) {
    logger.error({ error }, 'Failed to save contact message');
    return apiError(
      'An unexpected server error occurred while sending your message.',
      'INTERNAL_ERROR',
      500
    );
  }
};
