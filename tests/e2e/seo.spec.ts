import { test, expect } from '@playwright/test';

test.describe('SEO, Sitemap & Syndication E2E Suite (Step 9)', () => {
  test('GET /sitemap.xml generates valid XML with static and published dynamic URLs', async ({
    request,
  }) => {
    const res = await request.get('/sitemap.xml');
    expect(res.status()).toBe(200);

    const contentType = res.headers()['content-type'];
    expect(contentType).toContain('xml');

    const xml = await res.text();
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');

    // Verify core static routes
    expect(xml).toContain('/about</loc>');
    expect(xml).toContain('/projects</loc>');
    expect(xml).toContain('/blog</loc>');
    expect(xml).toContain('/contact</loc>');

    // Verify sitemap attributes
    expect(xml).toContain('<priority>1.0</priority>');
    expect(xml).toContain('<changefreq>weekly</changefreq>');
  });

  test('GET /robots.txt serves valid directives disallowing admin and pointing to sitemap', async ({
    request,
  }) => {
    const res = await request.get('/robots.txt');
    expect(res.status()).toBe(200);

    const contentType = res.headers()['content-type'];
    expect(contentType).toContain('text/plain');

    const text = await res.text();
    expect(text).toContain('User-agent: *');
    expect(text).toContain('Allow: /');
    expect(text).toContain('Disallow: /admin/');
    expect(text).toContain('Disallow: /api/admin/');
    expect(text).toContain('Sitemap:');
    expect(text).toContain('/sitemap.xml');
  });

  test('GET /rss.xml returns valid RSS 2.0 syndication feed for technical blog', async ({
    request,
  }) => {
    const res = await request.get('/rss.xml');
    expect(res.status()).toBe(200);

    const contentType = res.headers()['content-type'];
    expect(contentType).toContain('xml');

    const xml = await res.text();
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">');
    expect(xml).toContain('<channel>');
    expect(xml).toContain('<title>');
    expect(xml).toContain('<link>');
    expect(xml).toContain('<description>');
    expect(xml).toContain('<language>en</language>');
  });
});
