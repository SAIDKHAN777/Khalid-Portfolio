import type { APIRoute } from 'astro';
import { portfolioService } from '@/services/portfolio.service';
import { sectionSchema, updateSectionSchema } from '@/lib/validators/portfolio';
import { apiSuccess, apiError } from '@/lib/response';
import { z } from 'zod';

export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    const sections = await portfolioService.getSections();
    return apiSuccess(sections);
  } catch (err: any) {
    return apiError(err.message || 'Failed to fetch sections', 'SECTIONS_FETCH_ERROR', 500);
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const parsed = sectionSchema.safeParse(body);
    if (!parsed.success) {
      return apiError('Validation error', 'VALIDATION_ERROR', 400, parsed.error.format());
    }

    const created = await portfolioService.createSection(parsed.data);
    return apiSuccess(created, 201);
  } catch (err: any) {
    return apiError(err.message || 'Failed to create section', 'SECTION_CREATE_ERROR', 500);
  }
};

export const PUT: APIRoute = async ({ request, url }) => {
  try {
    const id = url.searchParams.get('id');
    if (!id) return apiError('Section ID required', 'MISSING_ID', 400);

    const body = await request.json();
    const parsed = updateSectionSchema.safeParse(body);
    if (!parsed.success) {
      return apiError('Validation error', 'VALIDATION_ERROR', 400, parsed.error.format());
    }

    const updated = await portfolioService.updateSection(id, parsed.data);
    return apiSuccess(updated);
  } catch (err: any) {
    return apiError(err.message || 'Failed to update section', 'SECTION_UPDATE_ERROR', 500);
  }
};

export const DELETE: APIRoute = async ({ url }) => {
  try {
    const id = url.searchParams.get('id');
    if (!id) return apiError('Section ID required', 'MISSING_ID', 400);

    await portfolioService.deleteSection(id);
    return apiSuccess(null);
  } catch (err: any) {
    return apiError(err.message || 'Failed to delete section', 'SECTION_DELETE_ERROR', 500);
  }
};

const reorderSchema = z.object({
  orderedIds: z.array(z.string()).min(1),
});

export const PATCH: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const parsed = reorderSchema.safeParse(body);
    if (!parsed.success) {
      return apiError('Validation error', 'VALIDATION_ERROR', 400, parsed.error.format());
    }

    await portfolioService.reorderSections(parsed.data.orderedIds);
    return apiSuccess(null);
  } catch (err: any) {
    return apiError(err.message || 'Failed to reorder sections', 'SECTION_REORDER_ERROR', 500);
  }
};
