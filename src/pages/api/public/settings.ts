import type { APIRoute } from 'astro';
import { getSiteSettings } from '@/lib/public-data';
import { apiSuccess, apiError } from '@/lib/response';

export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    const settings = await getSiteSettings();
    return apiSuccess(settings);
  } catch (err: any) {
    return apiError(err.message || 'Failed to load public settings', 'SETTINGS_LOAD_ERROR', 500);
  }
};
