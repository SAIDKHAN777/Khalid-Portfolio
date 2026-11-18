import type { APIRoute } from 'astro';
import { getBaseUrl } from '../lib/seo';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const baseUrl = getBaseUrl(request.url);

  const content = `# Robots.txt for Khalid Portfolio & Engineering Platform
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/admin/

# Sitemap location
Sitemap: ${baseUrl}/sitemap.xml
`;

  return new Response(content, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
    },
  });
};
