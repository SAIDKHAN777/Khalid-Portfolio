import type { APIRoute } from 'astro';
import { projectService } from '@/services/project.service';
import { updateProjectSchema } from '@/lib/validators/content';
import { apiSuccess, apiError } from '@/lib/response';

export const prerender = false;

export const GET: APIRoute = async ({ params, locals }) => {
  const { id } = params;
  if (!id) return apiError('Project identifier required', 'MISSING_ID', 400);

  const isAdmin = !!locals.user;
  // Try by slug first, then by id
  let project = await projectService.getProjectBySlug(id, isAdmin);
  if (!project) {
    project = await projectService.getProjectById(id);
  }

  if (!project) {
    return apiError('Project not found', 'NOT_FOUND', 404);
  }

  return apiSuccess(project);
};

export const PUT: APIRoute = async ({ params, request, locals }) => {
  if (!locals.user) {
    return apiError('Authentication required', 'UNAUTHORIZED', 401);
  }

  const { id } = params;
  if (!id) return apiError('Project identifier required', 'MISSING_ID', 400);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError('Malformed JSON payload', 'INVALID_JSON', 400);
  }

  const parseResult = updateProjectSchema.safeParse(body);
  if (!parseResult.success) {
    return apiError('Validation error', 'VALIDATION_ERROR', 400, parseResult.error.format());
  }

  try {
    const updated = await projectService.updateProject(id, parseResult.data);
    return apiSuccess(updated);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update project';
    return apiError(message, 'UPDATE_ERROR', 400);
  }
};

export const DELETE: APIRoute = async ({ params, url, locals }) => {
  if (!locals.user) {
    return apiError('Authentication required', 'UNAUTHORIZED', 401);
  }

  const { id } = params;
  if (!id) return apiError('Project identifier required', 'MISSING_ID', 400);

  const permanent = url.searchParams.get('permanent') === 'true';

  try {
    await projectService.deleteProject(id, !permanent);
    return apiSuccess({ message: 'Project deleted successfully' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete project';
    return apiError(message, 'DELETE_ERROR', 500);
  }
};
