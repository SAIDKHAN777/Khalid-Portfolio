import type { APIRoute } from 'astro';
import { blogService } from '@/services/blog.service';
import { updateBlogPostSchema } from '@/lib/validators/blog';
import { apiSuccess, apiError } from '@/lib/response';

export const prerender = false;

export const GET: APIRoute = async ({ params, url, locals }) => {
  const { id } = params;
  if (!id) return apiError('Post identifier required', 'MISSING_ID', 400);

  const isAdmin = !!locals.user;
  const renderHtml = url.searchParams.get('render') === 'true';

  let post = await blogService.getPostBySlug(id, isAdmin, renderHtml);
  if (!post) {
    post = await blogService.getPostById(id);
  }

  if (!post) {
    return apiError('Post not found', 'NOT_FOUND', 404);
  }

  return apiSuccess(post);
};

export const PUT: APIRoute = async ({ params, request, locals }) => {
  if (!locals.user) {
    return apiError('Authentication required', 'UNAUTHORIZED', 401);
  }

  const { id } = params;
  if (!id) return apiError('Post identifier required', 'MISSING_ID', 400);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError('Malformed JSON payload', 'INVALID_JSON', 400);
  }

  const parseResult = updateBlogPostSchema.safeParse(body);
  if (!parseResult.success) {
    return apiError('Validation error', 'VALIDATION_ERROR', 400, parseResult.error.format());
  }

  try {
    const updated = await blogService.updatePost(id, parseResult.data);
    return apiSuccess(updated);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update post';
    return apiError(message, 'UPDATE_ERROR', 400);
  }
};

export const DELETE: APIRoute = async ({ params, url, locals }) => {
  if (!locals.user) {
    return apiError('Authentication required', 'UNAUTHORIZED', 401);
  }

  const { id } = params;
  if (!id) return apiError('Post identifier required', 'MISSING_ID', 400);

  const permanent = url.searchParams.get('permanent') === 'true';

  try {
    await blogService.deletePost(id, !permanent);
    return apiSuccess({ message: 'Blog post deleted successfully' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete post';
    return apiError(message, 'DELETE_ERROR', 500);
  }
};
