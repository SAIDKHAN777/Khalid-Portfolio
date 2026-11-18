import { test, expect } from '@playwright/test';

test.describe('Works Dedicated Page', () => {
  test('Clicking Works in Topbar navigates to /works and displays 4 large categories', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/', { waitUntil: 'networkidle' });

    const worksLink = page.locator('#topbar-works-link');
    await expect(worksLink).toBeVisible();
    await worksLink.click();

    await page.waitForURL('**/works');
    expect(page.url()).toContain('/works');

    // Works link should be active with underline
    await expect(worksLink).toHaveClass(/is-active/);

    // Back button should be present
    const backBtn = page.locator('#works-back-button');
    await expect(backBtn).toBeVisible();

    // Verify 4 categories
    const categories = page.locator('.works-category-link');
    await expect(categories).toHaveCount(4);

    const expectedTitles = [
      'Video Editing',
      'Graphic Design',
      'Motion Graphics',
      'Digital Marketing',
    ];

    for (let i = 0; i < expectedTitles.length; i++) {
      const item = categories.nth(i);
      await expect(item).toContainText(expectedTitles[i]);
      await expect(item).toBeVisible();
    }

    // Capture desktop screenshot
    await page.screenshot({
      path: '/home/saidkhan/.gemini/antigravity/brain/e58b1996-d179-44df-8576-225d38484489/works_page_desktop.png',
      fullPage: true,
    });
  });

  test('Mobile view displays 4 large categories cleanly', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/works', { waitUntil: 'networkidle' });

    const categories = page.locator('.works-category-link');
    await expect(categories).toHaveCount(4);

    // Capture mobile screenshot
    await page.screenshot({
      path: '/home/saidkhan/.gemini/antigravity/brain/e58b1996-d179-44df-8576-225d38484489/works_page_mobile.png',
      fullPage: true,
    });
  });

  test('Category link navigates to service detail page', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/works', { waitUntil: 'networkidle' });

    const firstCategory = page.locator('.works-category-link').first();
    await firstCategory.click();

    await page.waitForURL('**/services/video-editing');
    expect(page.url()).toContain('/services/video-editing');
  });
});
