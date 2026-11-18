import { test, expect } from '@playwright/test';

test.describe('Hero Social Links & Direct Topbar Contact Form Modal', () => {
  test('Hero displays dynamic social links below intro paragraph (Desktop)', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/', { waitUntil: 'networkidle' });

    const heroSocial = page.locator('#hero-social-links');
    await expect(heroSocial).toBeVisible();

    const links = heroSocial.locator('a');
    const count = await links.count();
    expect(count).toBeGreaterThanOrEqual(1);

    // Ensure social links sit below the Hero intro paragraph
    const introBox = await page.locator('#hero p').boundingBox();
    const socialBox = await heroSocial.boundingBox();
    expect(introBox).not.toBeNull();
    expect(socialBox).not.toBeNull();
    expect(socialBox!.y).toBeGreaterThanOrEqual(introBox!.y + introBox!.height);

    await page.screenshot({
      path: '/home/saidkhan/.gemini/antigravity/brain/e58b1996-d179-44df-8576-225d38484489/hero_with_social_desktop.png',
    });
  });

  test('Hero displays dynamic social links below intro paragraph (Mobile)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/', { waitUntil: 'networkidle' });

    const heroSocial = page.locator('#hero-social-links');
    await expect(heroSocial).toBeVisible();

    await page.screenshot({
      path: '/home/saidkhan/.gemini/antigravity/brain/e58b1996-d179-44df-8576-225d38484489/hero_with_social_mobile.png',
    });
  });

  test('About page also continues showing dynamic social links', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/about', { waitUntil: 'networkidle' });

    const aboutSocialLinks = page.locator('.social-links-row a');
    const count = await aboutSocialLinks.count();
    expect(count).toBeGreaterThanOrEqual(1);
    await expect(aboutSocialLinks.first()).toBeVisible();
  });

  test('Clicking Topbar Contact opens Contact Form Modal directly without scrolling to footer', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/', { waitUntil: 'networkidle' });

    const modal = page.locator('#contact-modal');
    await expect(modal).not.toBeVisible();

    const contactBtn = page.locator('#topbar-contact-link');
    await expect(contactBtn).toBeVisible();
    await contactBtn.click();

    // Modal should be open and visible immediately
    await expect(modal).toBeVisible();
    await expect(page.locator('#contact-modal-title')).toBeVisible();
    await expect(page.locator('#contact-form')).toBeVisible();

    // Page should NOT have scrolled down to footer
    const scrollY = await page.evaluate(() => window.scrollY);
    expect(scrollY).toBeLessThan(50);

    await page.screenshot({
      path: '/home/saidkhan/.gemini/antigravity/brain/e58b1996-d179-44df-8576-225d38484489/topbar_contact_modal_home.png',
    });

    // Close modal cleanly
    await page.locator('#contact-modal-close').click();
    await expect(modal).not.toBeVisible();
  });

  test('Topbar Contact opens Contact Form Modal from Works, Press, and About pages', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    for (const route of ['/works', '/press', '/about']) {
      await page.goto(route, { waitUntil: 'networkidle' });
      const modal = page.locator('#contact-modal');
      await expect(modal).not.toBeVisible();

      await page.locator('#topbar-contact-link').click();
      await expect(modal).toBeVisible();
      await expect(page.locator('#contact-form')).toBeVisible();

      await page.locator('#contact-modal-close').click();
      await expect(modal).not.toBeVisible();
    }
  });
});
