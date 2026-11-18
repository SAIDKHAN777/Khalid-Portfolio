import type { APIRoute } from 'astro';
import { mediaService } from '@/services/media.service';
import { apiSuccess, apiError } from '@/lib/response';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  if (!locals.user) {
    return apiError('Authentication required', 'UNAUTHORIZED', 401);
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return apiError('Expected multipart/form-data payload', 'INVALID_FORM_DATA', 400);
  }

  const file = formData.get('file') as File | null;
  if (!file || typeof file === 'string') {
    return apiError('No file provided in form-data field "file"', 'MISSING_FILE', 400);
  }

  const altText = (formData.get('altText') as string) || undefined;
  const folder = (formData.get('folder') as string) || 'portfolio';

  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const media = await mediaService.uploadMedia(buffer, {
      filename: file.name,
      mimeType: file.type,
      size: file.size,
      altText,
      folder,
    });

    return apiSuccess(media, 201);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Media upload failed';
    return apiError(message, 'UPLOAD_ERROR', 400);
  }
};
