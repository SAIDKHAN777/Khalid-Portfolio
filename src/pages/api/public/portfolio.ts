import type { APIRoute } from 'astro';
import { getPortfolioData } from '@/lib/public-data';
import { apiSuccess, apiError } from '@/lib/response';

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  try {
    const isPreview = url.searchParams.get('preview') === 'true';
    const bundle = await getPortfolioData({ preview: isPreview });
    return apiSuccess(bundle);
  } catch (err: any) {
    return apiError(
      err.message || 'Failed to load public portfolio bundle',
      'PORTFOLIO_LOAD_ERROR',
      500
    );
  }
};
