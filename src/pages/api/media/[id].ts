import type { APIRoute } from 'astro';
import prisma from '@/lib/db';

export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
  const id = params.id;
  if (!id) {
    return new Response('Not found', { status: 404 });
  }

  const media = await prisma.media.findFirst({
    where: {
      OR: [{ id }, { publicId: id }],
    },
  });

  if (!media || !media.data) {
    return new Response('Media not found', { status: 404 });
  }

  const bytes = Buffer.from(media.data, 'base64');
  return new Response(bytes, {
    status: 200,
    headers: {
      'Content-Type': media.mimeType || 'application/octet-stream',
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Content-Length': String(bytes.byteLength),
    },
  });
};
