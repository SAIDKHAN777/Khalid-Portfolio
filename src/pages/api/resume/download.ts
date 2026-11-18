import type { APIRoute } from 'astro';
import { mediaService } from '@/services/media.service';
import { apiSuccess } from '@/lib/response';
import crypto from 'crypto';

export const prerender = false;

export const GET: APIRoute = async ({ request, url, clientAddress }) => {
  const rawIp =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() || clientAddress || '127.0.0.1';
  const dailySalt = new Date().toISOString().slice(0, 10);
  const ipHash = crypto
    .createHash('sha256')
    .update(`${rawIp}-${dailySalt}`)
    .digest('hex')
    .slice(0, 16);

  const userAgent = request.headers.get('user-agent') || undefined;
  const referrer = request.headers.get('referer') || undefined;

  const resumeUrl = await mediaService.recordResumeDownload({
    ipHash,
    userAgent,
    referrer,
  });

  const shouldRedirect =
    url.searchParams.get('redirect') !== 'false' &&
    !request.headers.get('accept')?.includes('application/json');

  if (shouldRedirect) {
    return new Response(null, {
      status: 302,
      headers: {
        Location: resumeUrl,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  }

  return apiSuccess({
    resumeUrl,
    recorded: true,
  });
};
