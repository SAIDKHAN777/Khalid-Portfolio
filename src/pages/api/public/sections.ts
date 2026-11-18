import type { APIRoute } from 'astro';
import { getSectionsWithWorks } from '@/lib/public-data';
import { apiSuccess, apiError } from '@/lib/response';

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  try {
    const isPreview = url.searchParams.get('preview') === 'true';
    const sections = await getSectionsWithWorks({ preview: isPreview });
    return apiSuccess(sections);
  } catch (err: any) {
    return apiError(err.message || 'Failed to load public sections', 'SECTIONS_LOAD_ERROR', 500);
  }
};
