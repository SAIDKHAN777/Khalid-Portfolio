import type { APIRoute } from 'astro';
import { mediaService } from '@/services/media.service';
import { apiSuccess, apiError } from '@/lib/response';

export const prerender = false;

export const DELETE: APIRoute = async ({ params, locals }) => {
  if (!locals.user) {
    return apiError('Authentication required', 'UNAUTHORIZED', 401);
  }

  const { id } = params;
  if (!id) return apiError('Media ID required', 'MISSING_ID', 400);

  try {
    await mediaService.deleteMedia(id);
    return apiSuccess({ message: 'Media asset deleted successfully from storage and database' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete media';
    return apiError(message, 'DELETE_ERROR', 404);
  }
};
