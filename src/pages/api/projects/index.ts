import type { APIRoute } from 'astro';
import { projectService } from '@/services/project.service';
import { paginationQuerySchema, createProjectSchema } from '@/lib/validators/content';
import { apiSuccess, apiError } from '@/lib/response';

export const prerender = false;

export const GET: APIRoute = async ({ url, locals }) => {
  const queryParams = Object.fromEntries(url.searchParams.entries());
  const parseResult = paginationQuerySchema.safeParse(queryParams);

  if (!parseResult.success) {
    return apiError(
      'Invalid query parameters',
      'VALIDATION_ERROR',
      400,
      parseResult.error.format()
    );
  }

  const isAdmin = !!locals.user;
  const result = await projectService.listProjects(parseResult.data, isAdmin);
  return apiSuccess(result);
};

export const POST: APIRoute = async ({ request, locals }) => {
  if (!locals.user) {
    return apiError('Authentication required', 'UNAUTHORIZED', 401);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError('Malformed JSON payload', 'INVALID_JSON', 400);
  }

  const parseResult = createProjectSchema.safeParse(body);
  if (!parseResult.success) {
    return apiError('Validation error', 'VALIDATION_ERROR', 400, parseResult.error.format());
  }

  try {
    const project = await projectService.createProject(parseResult.data);
    return apiSuccess(project, 201);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create project';
    return apiError(message, 'CREATE_ERROR', 500);
  }
};
