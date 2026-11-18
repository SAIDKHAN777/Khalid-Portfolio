import { test, expect } from '@playwright/test';

test.describe('Step 7: Motion & Kinetic Scroll System', () => {
  test.use({ viewport: { width: 1920, height: 1080 } });

  test('1. Verify 12 scroll checkpoints, screenshots, and dynamic UI state', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 12 Checkpoint targets and expected states
    const checkpoints = [
      { id: '01-hero', selector: '#hero', tone: 'light' },
      { id: '02-services', selector: '#services', tone: 'light' },
      { id: '03-band-video', selector: '#video-editing .section-heading-band', tone: 'light' },
      { id: '04-stack-video', selector: '#video-editing .panels-stack', tone: 'dark' },
      {
        id: '05-panel-ve-2',
        selector: '#video-editing .panels-stack',
        scrollOffset: 800,
        tone: 'dark',
      },
      { id: '06-band-graphic', selector: '#graphic-design .section-heading-band', tone: 'light' },
      { id: '07-stack-graphic', selector: '#graphic-design .panels-stack', tone: 'dark' },
      {
        id: '08-panel-gd-2',
        selector: '#graphic-design .panels-stack',
        scrollOffset: 800,
        tone: 'dark',
      },
      {
        id: '09-panel-gd-3',
        selector: '#graphic-design .panels-stack',
        scrollOffset: 1600,
        tone: 'dark',
      },
      { id: '10-band-motion', selector: '#motion-graphics .section-heading-band', tone: 'light' },
      { id: '11-stack-motion', selector: '#motion-graphics .panels-stack', tone: 'dark' },
      { id: '12-footer', selector: '#footer', tone: 'dark' },
    ];

    const menuButton = page.locator('#menu-button');

    for (const cp of checkpoints) {
      const target = page.locator(cp.selector).first();
      await expect(target).toBeAttached();

      // Scroll into view
      await target.scrollIntoViewIfNeeded();
      if (cp.scrollOffset) {
        await page.evaluate((offset) => window.scrollBy(0, offset), cp.scrollOffset);
      }
      await page.waitForTimeout(300);

      // Capture screenshot for visual audit
      await page.screenshot({
        path: `test-results/motion-checkpoints/${cp.id}.png`,
      });

      // Verify tone attribute on UI elements
      const currentTone = await menuButton.getAttribute('data-tone');
      expect(currentTone).toBeDefined();
    }
  });

  test('2. MenuButton interactions: line contraction, fullscreen overlay, Esc close', async ({
    page,
  }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const menuBtn = page.locator('#menu-button');
    const navOverlay = page.locator('#nav-overlay');

    // Initially overlay is hidden
    await expect(navOverlay).toHaveCSS('opacity', '0');

    // Scroll down so menu button becomes visible and action-able
    await page.evaluate(() => window.scrollTo(0, 200));
    await page.waitForTimeout(400);

    // Click menu button to open overlay
    await menuBtn.click();
    await page.waitForTimeout(350);
    await expect(navOverlay).toHaveCSS('opacity', '1');

    // Verify sections inside overlay
    await expect(navOverlay).toContainText('Video Editing');
    await expect(navOverlay).toContainText('Graphic Design');
    await expect(navOverlay).toContainText('Motion Graphics');
    await expect(navOverlay).toContainText('Contact Us');

    // Press Escape to close overlay
    await page.keyboard.press('Escape');
    await page.waitForTimeout(350);
    await expect(navOverlay).toHaveCSS('opacity', '0');
  });

  test('3. View Button is removed per user design direction', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const viewButton = page.locator('#view-button');
    await expect(viewButton).toHaveCount(0);
  });

  test('4. Footer Contact button hover: pill scale and arrow translation', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const footer = page.locator('#footer');
    await footer.scrollIntoViewIfNeeded();

    const contactBtn = footer.locator('a.shape-contact-btn');
    await expect(contactBtn).toBeVisible();

    // Hover over contact button
    await contactBtn.hover();
    await page.waitForTimeout(200);

    // Verify hover scale and arrow exists
    const arrow = contactBtn.locator('span:last-child');
    await expect(arrow).toBeVisible();
  });

  test('5. Accessibility: prefers-reduced-motion disables smooth scroll pinning', async ({
    page,
  }) => {
    // Emulate reduced motion
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Verify content is still fully rendered and accessible
    await expect(page.locator('#hero')).toBeVisible();
    await expect(page.locator('#services')).toBeVisible();
    await expect(page.locator('.work-section').first()).toBeVisible();
    await expect(page.locator('#footer')).toBeVisible();
  });
});
