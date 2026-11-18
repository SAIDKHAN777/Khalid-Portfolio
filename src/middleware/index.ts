import { defineMiddleware } from 'astro:middleware';
import { authService } from '@/services/auth.service';
import { SESSION_COOKIE_NAME } from '@/lib/auth';
import { apiError } from '@/lib/response';
import { checkRateLimit } from '@/lib/rateLimit';
import { applySecurityHeaders } from '@/lib/securityHeaders';

// Public API routes that do not require admin session
const PUBLIC_API_ROUTES = [
  '/api/health',
  '/api/sentry-test',
  '/api/auth/login',
  '/api/auth/logout',
  '/api/contact',
  '/api/resume/download',
  '/api/analytics/view',
  '/api/analytics/click',
  '/api/media/',
];

const MAX_BODY_SIZE_GENERAL = 1024 * 1024; // 1MB
const MAX_BODY_SIZE_MEDIA = 10 * 1024 * 1024; // 10MB

export const onRequest = defineMiddleware(async (context, next) => {
  const { url, request, cookies, locals, clientAddress } = context;
  const pathname = url.pathname;
  const method = request.method.toUpperCase();

  // 1. Request Body Size Limits
  if (['POST', 'PUT', 'PATCH'].includes(method)) {
    const rawContentLength = request.headers.get('content-length');
    if (rawContentLength) {
      const contentLength = parseInt(rawContentLength, 10);
      const isMediaUpload =
        pathname.startsWith('/api/admin/media/upload') ||
        pathname.startsWith('/api/admin/portfolio/upload');
      const maxAllowed = isMediaUpload ? MAX_BODY_SIZE_MEDIA : MAX_BODY_SIZE_GENERAL;

      if (!isNaN(contentLength) && contentLength > maxAllowed) {
        return applySecurityHeaders(
          apiError(
            `Payload exceeds maximum allowed size of ${isMediaUpload ? '10MB' : '1MB'}`,
            'PAYLOAD_TOO_LARGE',
            413
          )
        );
      }
    }
  }

  // 2. Global Sliding Window Rate Limiting (100 requests per minute)
  const clientIp =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() || clientAddress || '127.0.0.1';

  const shouldEnforceGlobalRateLimit =
    process.env.NODE_ENV !== 'test' || request.headers.get('x-test-global-ratelimit') === 'true';

  if (shouldEnforceGlobalRateLimit) {
    const globalLimit = await checkRateLimit(`global:${clientIp}`, 100, 60);
    if (!globalLimit.allowed) {
      const resp = apiError('Too many requests. Please slow down.', 'RATE_LIMIT_EXCEEDED', 429, {
        retryAfter: globalLimit.resetInSeconds,
      });
      resp.headers.set('Retry-After', String(globalLimit.resetInSeconds));
      return applySecurityHeaders(resp);
    }
  }

  // 3. CSRF Protection for state-changing requests
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const origin = request.headers.get('origin');
    const host = request.headers.get('host');

    if (origin && host) {
      try {
        const originUrl = new URL(origin);
        if (originUrl.host !== host) {
          return applySecurityHeaders(
            apiError('Cross-Site Request Forgery (CSRF) blocked', 'FORBIDDEN_CSRF', 403)
          );
        }
      } catch {
        return applySecurityHeaders(apiError('Invalid request origin', 'INVALID_ORIGIN', 400));
      }
    }
  }

  // 4. Extract and validate session token if present
  const sessionToken = cookies.get(SESSION_COOKIE_NAME)?.value;
  if (sessionToken) {
    const authData = await authService.validateSession(sessionToken);
    if (authData) {
      locals.user = authData.user;
      locals.session = authData.session;
    }
  }

  // 5. Access Control checks
  // A. Admin UI pages under /admin (except /admin/login)
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    if (!locals.user) {
      return context.redirect('/admin/login');
    }
  }

  // B. Protected API endpoints
  if (pathname.startsWith('/api/')) {
    const isExplicitlyPublic = PUBLIC_API_ROUTES.some((route) => pathname.startsWith(route));
    const isPublicGet =
      method === 'GET' &&
      !pathname.startsWith('/api/admin') &&
      !pathname.startsWith('/api/auth/me');

    // If it's not public and user is not authenticated, block with 401
    if (!isExplicitlyPublic && !isPublicGet && !locals.user) {
      return applySecurityHeaders(
        apiError('Authentication required to access this resource', 'UNAUTHORIZED', 401)
      );
    }
  }

  // 6. Execute downstream request and apply comprehensive Security Headers
  const response = await next();
  return applySecurityHeaders(response);
});
