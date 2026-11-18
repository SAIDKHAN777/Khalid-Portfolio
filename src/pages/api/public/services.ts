import type { APIRoute } from 'astro';
import { getServices } from '@/lib/public-data';
import { apiSuccess, apiError } from '@/lib/response';

export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    const services = await getServices();
    return apiSuccess(services);
  } catch (err: any) {
    return apiError(err.message || 'Failed to load public services', 'SERVICES_LOAD_ERROR', 500);
  }
};
