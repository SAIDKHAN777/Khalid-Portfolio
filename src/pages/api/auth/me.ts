import type { APIRoute } from 'astro';
import { apiSuccess, apiError } from '@/lib/response';
import { authService } from '@/services/auth.service';
import { SESSION_COOKIE_NAME } from '@/lib/auth';

export const prerender = false;

export const GET: APIRoute = async ({ locals, cookies }) => {
  // If middleware populated locals.user, use it
  if (locals.user) {
    return apiSuccess({ user: locals.user });
  }

  // Fallback: extract cookie directly
  const sessionToken = cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionToken) {
    return apiError('Authentication required', 'UNAUTHORIZED', 401);
  }

  const authData = await authService.validateSession(sessionToken);
  if (!authData) {
    return apiError('Invalid or expired session', 'UNAUTHORIZED', 401);
  }

  return apiSuccess({ user: authData.user });
};
