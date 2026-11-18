import type { APIRoute } from 'astro';
import { authService } from '@/services/auth.service';
import { apiSuccess } from '@/lib/response';
import { SESSION_COOKIE_NAME } from '@/lib/auth';

export const prerender = false;

export const POST: APIRoute = async ({ cookies }) => {
  const sessionCookie = cookies.get(SESSION_COOKIE_NAME);

  if (sessionCookie?.value) {
    await authService.logout(sessionCookie.value);
  }

  // Clear cookie from client
  cookies.delete(SESSION_COOKIE_NAME, { path: '/' });

  return apiSuccess({
    message: 'Logged out successfully',
  });
};
