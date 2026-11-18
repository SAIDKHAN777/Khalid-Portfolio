import type { APIRoute } from 'astro';
import { blogService } from '@/services/blog.service';
import { apiSuccess, apiError } from '@/lib/response';

export const prerender = false;

export const DELETE: APIRoute = async ({ params, locals }) => {
  if (!locals.user) return apiError('Authentication required', 'UNAUTHORIZED', 401);
  const { id } = params;
  if (!id) return apiError('Tag ID required', 'MISSING_ID', 400);

  try {
    await blogService.deleteTag(id);
    return apiSuccess({ message: 'Tag deleted successfully' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete tag';
    return apiError(message, 'DELETE_ERROR', 500);
  }
};
