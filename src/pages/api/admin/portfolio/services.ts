import type { APIRoute } from 'astro';
import { portfolioService } from '@/services/portfolio.service';
import { serviceSchema, updatePortfolioServiceSchema } from '@/lib/validators/portfolio';
import { apiSuccess, apiError } from '@/lib/response';
import { z } from 'zod';

export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    const services = await portfolioService.getServices();
    return apiSuccess(services);
  } catch (err: any) {
    return apiError(err.message || 'Failed to fetch services', 'SERVICES_FETCH_ERROR', 500);
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const parsed = serviceSchema.safeParse(body);
    if (!parsed.success) {
      return apiError('Validation error', 'VALIDATION_ERROR', 400, parsed.error.format());
    }

    const created = await portfolioService.createService(parsed.data);
    return apiSuccess(created, 201);
  } catch (err: any) {
    return apiError(err.message || 'Failed to create service', 'SERVICE_CREATE_ERROR', 500);
  }
};

export const PUT: APIRoute = async ({ request, url }) => {
  try {
    const id = url.searchParams.get('id');
    if (!id) return apiError('Service ID required', 'MISSING_ID', 400);

    const body = await request.json();
    const parsed = updatePortfolioServiceSchema.safeParse(body);
    if (!parsed.success) {
      return apiError('Validation error', 'VALIDATION_ERROR', 400, parsed.error.format());
    }

    const updated = await portfolioService.updateService(id, parsed.data);
    return apiSuccess(updated);
  } catch (err: any) {
    return apiError(err.message || 'Failed to update service', 'SERVICE_UPDATE_ERROR', 500);
  }
};

export const DELETE: APIRoute = async ({ url }) => {
  try {
    const id = url.searchParams.get('id');
    if (!id) return apiError('Service ID required', 'MISSING_ID', 400);

    await portfolioService.deleteService(id);
    return apiSuccess(null);
  } catch (err: any) {
    return apiError(err.message || 'Failed to delete service', 'SERVICE_DELETE_ERROR', 500);
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

    await portfolioService.reorderServices(parsed.data.orderedIds);
    return apiSuccess(null);
  } catch (err: any) {
    return apiError(err.message || 'Failed to reorder services', 'SERVICE_REORDER_ERROR', 500);
  }
};
