import type { APIRoute } from 'astro';
import { prisma } from '../lib/db';
import { getBaseUrl } from '../lib/seo';
import { logger } from '../lib/logger';
import { captureServerError } from '../lib/sentry';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  try {
    const baseUrl = getBaseUrl(request.url);

    // Fetch published dynamic routes
    const [projects, posts] = await Promise.all([
      prisma.project.findMany({
        where: { status: 'PUBLISHED', deletedAt: null },
        select: { slug: true, updatedAt: true },
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.blogPost.findMany({
        where: { status: 'PUBLISHED', deletedAt: null },
        select: { slug: true, updatedAt: true },
        orderBy: { updatedAt: 'desc' },
      }),
    ]);

    const now = new Date().toISOString().slice(0, 10);

    // Core static pages
    const staticUrls = [
      { loc: `${baseUrl}/`, priority: '1.0', changefreq: 'weekly', lastmod: now },
      { loc: `${baseUrl}/about`, priority: '0.8', changefreq: 'monthly', lastmod: now },
      { loc: `${baseUrl}/projects`, priority: '0.9', changefreq: 'weekly', lastmod: now },
      { loc: `${baseUrl}/blog`, priority: '0.9', changefreq: 'daily', lastmod: now },
      { loc: `${baseUrl}/contact`, priority: '0.7', changefreq: 'monthly', lastmod: now },
    ];

    const projectUrls = projects.map((p) => ({
      loc: `${baseUrl}/projects/${p.slug}`,
      priority: '0.8',
      changefreq: 'monthly',
      lastmod: p.updatedAt.toISOString().slice(0, 10),
    }));

    const postUrls = posts.map((post) => ({
      loc: `${baseUrl}/blog/${post.slug}`,
      priority: '0.8',
      changefreq: 'weekly',
      lastmod: post.updatedAt.toISOString().slice(0, 10),
    }));

    const allUrls = [...staticUrls, ...projectUrls, ...postUrls];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls
  .map(
    (item) => `  <url>
    <loc>${item.loc}</loc>
    <lastmod>${item.lastmod}</lastmod>
    <changefreq>${item.changefreq}</changefreq>
    <priority>${item.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

    return new Response(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      },
    });
  } catch (error: any) {
    logger.error({ err: error.message }, 'Failed to generate sitemap.xml');
    captureServerError(error, { route: '/sitemap.xml' });
    return new Response('Error generating sitemap', { status: 500 });
  }
};
