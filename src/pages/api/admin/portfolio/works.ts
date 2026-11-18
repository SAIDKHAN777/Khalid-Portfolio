import type { APIRoute } from 'astro';
import { portfolioService } from '@/services/portfolio.service';
import { workSchema, updateWorkSchema } from '@/lib/validators/portfolio';
import { apiSuccess, apiError } from '@/lib/response';
import { z } from 'zod';

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  try {
    const sectionId = url.searchParams.get('sectionId') || undefined;
    const isPublishedParam = url.searchParams.get('isPublished');
    const isPublished = isPublishedParam !== null ? isPublishedParam === 'true' : undefined;

    const works = await portfolioService.getWorks({ sectionId, isPublished });
    return apiSuccess(works);
  } catch (err: any) {
    return apiError(err.message || 'Failed to fetch works', 'WORKS_FETCH_ERROR', 500);
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const parsed = workSchema.safeParse(body);
    if (!parsed.success) {
      return apiError('Validation error', 'VALIDATION_ERROR', 400, parsed.error.format());
    }

    const created = await portfolioService.createWork(parsed.data);
    return apiSuccess(created, 201);
  } catch (err: any) {
    return apiError(err.message || 'Failed to create work', 'WORK_CREATE_ERROR', 500);
  }
};

export const PUT: APIRoute = async ({ request, url }) => {
  try {
    const id = url.searchParams.get('id');
    if (!id) return apiError('Work ID required', 'MISSING_ID', 400);

    const body = await request.json();
    const parsed = updateWorkSchema.safeParse(body);
    if (!parsed.success) {
      return apiError('Validation error', 'VALIDATION_ERROR', 400, parsed.error.format());
    }

    const updated = await portfolioService.updateWork(id, parsed.data);
    return apiSuccess(updated);
  } catch (err: any) {
    return apiError(err.message || 'Failed to update work', 'WORK_UPDATE_ERROR', 500);
  }
};

export const DELETE: APIRoute = async ({ url }) => {
  try {
    const id = url.searchParams.get('id');
    if (!id) return apiError('Work ID required', 'MISSING_ID', 400);

    await portfolioService.deleteWork(id);
    return apiSuccess(null);
  } catch (err: any) {
    return apiError(err.message || 'Failed to delete work', 'WORK_DELETE_ERROR', 500);
  }
};

const patchActionSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('reorder'),
    orderedIds: z.array(z.string()).min(1),
  }),
  z.object({
    action: z.literal('duplicate'),
    id: z.string().min(1),
  }),
  z.object({
    action: z.literal('togglePublish'),
    id: z.string().min(1),
    isPublished: z.boolean(),
  }),
  z.object({
    action: z.literal('togglePin'),
    id: z.string().min(1),
    isPinned: z.boolean(),
  }),
]);

export const PATCH: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const parsed = patchActionSchema.safeParse(body);
    if (!parsed.success) {
      return apiError('Validation error', 'VALIDATION_ERROR', 400, parsed.error.format());
    }

    if (parsed.data.action === 'reorder') {
      await portfolioService.reorderWorks(parsed.data.orderedIds);
      return apiSuccess(null);
    }

    if (parsed.data.action === 'duplicate') {
      const copy = await portfolioService.duplicateWork(parsed.data.id);
      return apiSuccess(copy, 201);
    }

    if (parsed.data.action === 'togglePublish') {
      const updated = await portfolioService.updateWork(parsed.data.id, {
        isPublished: parsed.data.isPublished,
      });
      return apiSuccess(updated);
    }

    if (parsed.data.action === 'togglePin') {
      const updated = await portfolioService.updateWork(parsed.data.id, {
        isPinned: parsed.data.isPinned,
      });
      return apiSuccess(updated);
    }

    return apiError('Unknown action', 'UNKNOWN_ACTION', 400);
  } catch (err: any) {
    return apiError(err.message || 'Failed to perform work action', 'WORK_ACTION_ERROR', 500);
  }
};
