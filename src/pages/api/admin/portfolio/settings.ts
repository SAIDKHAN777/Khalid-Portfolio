import type { APIRoute } from 'astro';
import { portfolioService } from '@/services/portfolio.service';
import { updateSiteSettingsSchema } from '@/lib/validators/portfolio';
import { apiSuccess, apiError } from '@/lib/response';

export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    const settings = await portfolioService.getSettings();
    return apiSuccess(settings);
  } catch (err: any) {
    return apiError(err.message || 'Failed to fetch settings', 'SETTINGS_FETCH_ERROR', 500);
  }
};

export const PUT: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const parsed = updateSiteSettingsSchema.safeParse(body);
    if (!parsed.success) {
      return apiError('Validation error', 'VALIDATION_ERROR', 400, parsed.error.format());
    }

    const updated = await portfolioService.updateSettings(parsed.data);
    return apiSuccess(updated);
  } catch (err: any) {
    return apiError(err.message || 'Failed to update settings', 'SETTINGS_UPDATE_ERROR', 500);
  }
};
