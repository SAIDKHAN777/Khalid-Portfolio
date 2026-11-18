import type { APIRoute } from 'astro';
import { processImage, getMediaDriver } from '@/lib/media';
import { apiSuccess, apiError } from '@/lib/response';
import crypto from 'crypto';

export const prerender = false;

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm'];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB

export const POST: APIRoute = async ({ request }) => {
  try {
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return apiError('Content-Type must be multipart/form-data', 'INVALID_CONTENT_TYPE', 400);
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const mediaType = (formData.get('type') as string) || 'image';

    if (!file) {
      return apiError('File is required', 'MISSING_FILE', 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const mimeType = file.type;
    const size = buffer.length;

    // Handle Image Upload
    if (mediaType === 'image') {
      if (!ALLOWED_IMAGE_TYPES.includes(mimeType)) {
        return apiError(
          `Invalid image type: ${mimeType}. Allowed: ${ALLOWED_IMAGE_TYPES.join(', ')}`,
          'INVALID_FILE_TYPE',
          400
        );
      }

      if (size > MAX_IMAGE_SIZE) {
        return apiError('Image exceeds max allowed size of 10MB', 'FILE_TOO_LARGE', 413);
      }

      const hash = crypto.randomBytes(8).toString('hex');
      const baseName = `img_${Date.now()}_${hash}`;
      const processed = await processImage(buffer, baseName, mimeType);

      return apiSuccess({
        type: 'image',
        webpUrl: processed.webpPath,
        avifUrl: processed.avifPath,
        url: processed.webpPath,
        width: processed.width,
        height: processed.height,
        size,
        mimeType,
      });
    }

    // Handle Video Upload
    if (mediaType === 'video') {
      if (!ALLOWED_VIDEO_TYPES.includes(mimeType)) {
        return apiError(
          `Invalid video type: ${mimeType}. Allowed: ${ALLOWED_VIDEO_TYPES.join(', ')}`,
          'INVALID_FILE_TYPE',
          400
        );
      }

      if (size > MAX_VIDEO_SIZE) {
        return apiError('Video exceeds max allowed size of 50MB', 'FILE_TOO_LARGE', 413);
      }

      const ext = mimeType === 'video/mp4' ? 'mp4' : 'webm';
      const hash = crypto.randomBytes(8).toString('hex');
      const filename = `vid_${Date.now()}_${hash}.${ext}`;

      const mediaDriver = getMediaDriver();
      const videoUrl = await mediaDriver.uploadFile(buffer, filename, mimeType);

      // Handle optional or required poster image if uploaded in same request
      let posterUrl: string | undefined = undefined;
      const posterFile = formData.get('poster') as File | null;
      if (posterFile && posterFile.size > 0) {
        const posterBuffer = Buffer.from(await posterFile.arrayBuffer());
        const posterBaseName = `poster_${Date.now()}_${hash}`;
        const posterProcessed = await processImage(posterBuffer, posterBaseName, posterFile.type || 'image/webp');
        posterUrl = posterProcessed.webpPath;
      }

      return apiSuccess({
        type: 'video',
        url: videoUrl,
        posterUrl,
        size,
        mimeType,
      });
    }

    return apiError('Invalid media type. Must be "image" or "video"', 'INVALID_MEDIA_TYPE', 400);
  } catch (err: any) {
    return apiError(err.message || 'Media upload failed', 'UPLOAD_ERROR', 500);
  }
};
