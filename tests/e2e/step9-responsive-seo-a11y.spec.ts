import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Step 9 — Responsive Layout, Accessibility & SEO Suite', () => {
  const VIEWPORTS = [
    { name: '360px Small Mobile', width: 360, height: 640 },
    { name: '768px Tablet', width: 768, height: 1024 },
    { name: '1024px Small Laptop', width: 1024, height: 768 },
    { name: '1440px Desktop', width: 1440, height: 900 },
    { name: '2560px Ultrawide', width: 2560, height: 1440 },
  ];

  for (const vp of VIEWPORTS) {
    test(`Responsive Check on ${vp.name} (${vp.width}x${vp.height}): Zero horizontal overflow`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const overflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      expect(overflow).toBe(false);
    });
  }

  test('Hero layout: Mobile portrait sits below intro; Tablet portrait sits beside intro', async ({
    page,
  }) => {
    // 1. Mobile (360x640)
    await page.setViewportSize({ width: 360, height: 640 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const mobileIntro = page.locator('#hero p').first();
    const mobilePortrait = page.locator('#hero img').first();

    const introBoxMobile = await mobileIntro.boundingBox();
    const portraitBoxMobile = await mobilePortrait.boundingBox();

    expect(introBoxMobile).not.toBeNull();
    expect(portraitBoxMobile).not.toBeNull();
    if (introBoxMobile && portraitBoxMobile) {
      // Portrait sits below intro on mobile
      expect(portraitBoxMobile.y).toBeGreaterThanOrEqual(introBoxMobile.y);
    }

    // 2. Tablet (768x1024)
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(300);

    const tabletIntro = page.locator('#hero p').first();
    const tabletPortrait = page.locator('#hero img').first();

    const introBoxTablet = await tabletIntro.boundingBox();
    const portraitBoxTablet = await tabletPortrait.boundingBox();

    expect(introBoxTablet).not.toBeNull();
    expect(portraitBoxTablet).not.toBeNull();
    if (introBoxTablet && portraitBoxTablet) {
      // Portrait sits beside intro on tablet
      expect(portraitBoxTablet.x).toBeGreaterThanOrEqual(
        introBoxTablet.x + introBoxTablet.width * 0.7
      );
    }
  });

  test('View button is removed per user request', async ({ page }) => {
    await page.goto('/');
    const viewBtn = page.locator('#view-button');
    await expect(viewBtn).toHaveCount(0);
  });

  test('Bottom bar: Clean layout per user request (bottom-bar removed)', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const bottomBar = page.locator('#bottom-bar');
    await expect(bottomBar).toHaveCount(0);
  });

  test('Heading band: 40vh on mobile, 48vh on desktop', async ({ page }) => {
    // Mobile
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const mobileBand = page.locator('.section-heading-band').first();
    const mobileHeight = await mobileBand.evaluate(
      (el: HTMLElement) => el.getBoundingClientRect().height
    );
    // 40vh of 800 is 320px
    expect(mobileHeight).toBeCloseTo(320, -1);

    // Desktop
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const desktopBand = page.locator('.section-heading-band').first();
    const desktopHeight = await desktopBand.evaluate(
      (el: HTMLElement) => el.getBoundingClientRect().height
    );
    // 48vh of 1000 is 480px
    expect(desktopHeight).toBeCloseTo(480, -1);
  });

  test('Accessibility: Skip to content link, semantic headings, and ARIA labels', async ({
    page,
  }) => {
    await page.goto('/');

    // 1. Skip link
    const skipLink = page.locator('a[href="#scroll-container"]');
    await expect(skipLink).toBeAttached();
    expect(await skipLink.innerText()).toBe('Skip to content');

    // 2. Semantic Headings: h1 on Hero, h2 on SectionHeading, h3 on WorkPanel
    const h1 = page.locator('#hero h1');
    await expect(h1).toHaveCount(1);
    expect(await h1.innerText()).toBe('Hello');

    const h2s = page.locator('h2');
    expect(await h2s.count()).toBeGreaterThanOrEqual(1);

    const h3s = page.locator('h3');
    expect(await h3s.count()).toBeGreaterThanOrEqual(1);

    // 3. ARIA labels
    const menuBtn = page.locator('#menu-button');
    expect(await menuBtn.getAttribute('aria-label')).toBe('Open Navigation Menu');
  });

  test('SEO & Structured Data: Meta tags, JSON-LD Person schema, sitemap.xml, robots.txt', async ({
    page,
    request,
  }) => {
    await page.goto('/');

    // 1. Canonical link
    const canonical = page.locator('link[rel="canonical"]');
    await expect(canonical).toBeAttached();
    expect(await canonical.getAttribute('href')).toBeTruthy();

    // 2. OpenGraph & Twitter tags
    const ogTitle = page.locator('meta[property="og:title"]');
    await expect(ogTitle).toBeAttached();
    const ogContent = await ogTitle.getAttribute('content');
    expect((ogContent ?? '').includes('Khalid') || (ogContent ?? '').includes('Said Khan')).toBe(true);

    const twitterCard = page.locator('meta[name="twitter:card"]');
    await expect(twitterCard).toBeAttached();
    expect(await twitterCard.getAttribute('content')).toBe('summary_large_image');

    // 3. JSON-LD Person schema
    const jsonLdScript = page.locator('script[type="application/ld+json"]');
    await expect(jsonLdScript).toBeAttached();
    const jsonText = await jsonLdScript.innerText();
    const schema = JSON.parse(jsonText);

    expect(schema['@context']).toBe('https://schema.org');
    expect(schema['@type']).toBe('Person');
    expect(schema.name === 'Khalid' || schema.name === 'Said Khan').toBe(true);
    expect(Array.isArray(schema.jobTitle)).toBe(true);
    expect(schema.jobTitle).toContain('AI Engineer');
    expect(schema.jobTitle).toContain('Full Stack Developer');
    expect(Array.isArray(schema.sameAs)).toBe(true);

    // 4. sitemap.xml
    const sitemapRes = await request.get('/sitemap.xml');
    expect(sitemapRes.status()).toBe(200);
    expect(sitemapRes.headers()['content-type']).toContain('xml');
    const sitemapText = await sitemapRes.text();
    expect(sitemapText).toContain('<urlset');
    expect(sitemapText).toContain('<loc>');

    // 5. robots.txt
    const robotsRes = await request.get('/robots.txt');
    expect(robotsRes.status()).toBe(200);
    const robotsText = await robotsRes.text();
    expect(robotsText).toContain('User-agent: *');
    expect(robotsText).toContain('Sitemap:');
  });

  test('Zero WCAG AA violations on home page via Axe core', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .exclude('astro-dev-toolbar')
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
