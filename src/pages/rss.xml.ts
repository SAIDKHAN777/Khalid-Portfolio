import type { APIRoute } from 'astro';
import { prisma } from '../lib/db';
import { getBaseUrl } from '../lib/seo';
import { logger } from '../lib/logger';
import { captureServerError } from '../lib/sentry';

export const prerender = false;

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export const GET: APIRoute = async ({ request }) => {
  try {
    const baseUrl = getBaseUrl(request.url);

    const [settings, posts] = await Promise.all([
      prisma.siteSetting.findUnique({
        where: { id: 'default' },
      }),
      prisma.blogPost.findMany({
        where: { status: 'PUBLISHED', deletedAt: null },
        orderBy: { publishedAt: 'desc' },
        take: 50,
        include: {
          tags: true,
        },
      }),
    ]);

    const title =
      settings?.defaultSeoTitle ||
      settings?.heroTitle ||
      'Khalid | Engineering & Systems Architecture';
    const description =
      settings?.defaultSeoDescription ||
      'Personal technical publications, distributed systems blueprints, and engineering insights.';
    const feedUrl = `${baseUrl}/rss.xml`;
    const siteUrl = `${baseUrl}/blog`;
    const lastBuildDate = new Date().toUTCString();

    const itemsXml = posts
      .map((post) => {
        const postUrl = `${baseUrl}/blog/${post.slug}`;
        const pubDate = (post.publishedAt || post.createdAt).toUTCString();
        const categories = post.tags
          .map((t) => `      <category>${escapeXml(t.name)}</category>`)
          .join('\n');

        return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${postUrl}</link>
      <guid isPermaLink="true">${postUrl}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${escapeXml(post.excerpt || post.title)}</description>
${categories ? categories + '\n' : ''}    </item>`;
      })
      .join('\n');

    const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(title)}</title>
    <link>${siteUrl}</link>
    <description>${escapeXml(description)}</description>
    <language>en</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${feedUrl}" rel="self" type="application/rss+xml"/>
${itemsXml}
  </channel>
</rss>`;

    return new Response(rssXml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      },
    });
  } catch (error: any) {
    logger.error({ err: error.message }, 'Failed to generate rss.xml');
    captureServerError(error, { route: '/rss.xml' });
    return new Response('Error generating RSS feed', { status: 500 });
  }
};
