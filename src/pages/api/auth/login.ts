import type { APIRoute } from 'astro';
import { loginSchema } from '@/lib/validators/auth';
import { authService } from '@/services/auth.service';
import { apiSuccess, apiError } from '@/lib/response';
import { SESSION_COOKIE_NAME, getCookieOptions } from '@/lib/auth';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies, clientAddress }) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError('Malformed JSON payload', 'INVALID_JSON', 400);
  }

  const parseResult = loginSchema.safeParse(body);
  if (!parseResult.success) {
    return apiError('Validation error', 'VALIDATION_ERROR', 400, parseResult.error.format());
  }

  const { email, password } = parseResult.data;
  const ipAddress = clientAddress || request.headers.get('x-forwarded-for') || undefined;
  const userAgent = request.headers.get('user-agent') || undefined;

  try {
    const { user, session } = await authService.login({
      email,
      password,
      ipAddress,
      userAgent,
    });

    // Set HTTP-only secure cookie
    cookies.set(SESSION_COOKIE_NAME, session.token, getCookieOptions());

    return apiSuccess({
      user,
      expiresAt: session.expiresAt,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '';

    if (message.startsWith('ACCOUNT_LOCKED')) {
      const parts = message.split(':');
      const seconds = parts[1] || '900';
      return apiError(
        `Account temporarily locked due to repeated failed login attempts. Try again in ${Math.ceil(Number(seconds) / 60)} minutes.`,
        'ACCOUNT_LOCKED',
        429,
        { retryAfterSeconds: Number(seconds) }
      );
    }

    if (message === 'INVALID_CREDENTIALS') {
      return apiError('Invalid email or password', 'INVALID_CREDENTIALS', 401);
    }

    return apiError('An unexpected error occurred during login', 'INTERNAL_ERROR', 500);
  }
};
