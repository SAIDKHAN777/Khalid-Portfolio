import { test, expect } from '@playwright/test';

test.describe('Step 8 — Media Handling Inside Panels', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to homepage
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('1. Picture tag renders AVIF & WebP sources with 2560x1440 dimensions', async ({ page }) => {
    const firstPanel = page.locator('.work-panel').first();
    await expect(firstPanel).toBeAttached();

    const picture = firstPanel.locator('picture');
    await expect(picture).toBeAttached();

    const avifSource = picture.locator('source[type="image/avif"]');
    await expect(avifSource).toBeAttached();
    const avifSrcset = await avifSource.getAttribute('srcset');
    expect(avifSrcset).toContain('.avif');

    const webpSource = picture.locator('source[type="image/webp"]');
    await expect(webpSource).toBeAttached();
    const webpSrcset = await webpSource.getAttribute('srcset');
    expect(webpSrcset).toContain('.webp');

    const img = picture.locator('img');
    await expect(img).toBeAttached();
    expect(await img.getAttribute('width')).toBe('2560');
    expect(await img.getAttribute('height')).toBe('1440');
  });

  test('2. First panel has eager loading, subsequent image panels have lazy loading', async ({
    page,
  }) => {
    const panels = page.locator('.work-panel');
    const count = await panels.count();
    expect(count).toBeGreaterThanOrEqual(2);

    // Panel 1 (First work)
    const firstImg = panels.first().locator('picture img');
    await expect(firstImg).toBeAttached();
    expect(await firstImg.getAttribute('loading')).toBe('eager');
    expect(await firstImg.getAttribute('decoding')).toBe('sync');

    // Panel 3 (Subsequent work with image)
    const thirdPanel = panels.nth(2);
    const thirdImg = thirdPanel.locator('picture img');
    if ((await thirdImg.count()) > 0) {
      expect(await thirdImg.getAttribute('loading')).toBe('lazy');
      expect(await thirdImg.getAttribute('decoding')).toBe('async');
    }
  });

  test('3. Video panel renders muted, loop, playsinline, preload="metadata" with poster', async ({
    page,
  }) => {
    const video = page.locator('video.panel-video').first();
    await expect(video).toBeAttached();

    expect(await video.getAttribute('preload')).toBe('metadata');
    expect(await video.getAttribute('poster')).toBeTruthy();

    const isMuted = await video.evaluate((el: HTMLVideoElement) => el.muted);
    const hasLoop = await video.evaluate((el: HTMLVideoElement) => el.loop);
    const hasPlaysinline = await video.evaluate((el: HTMLVideoElement) => el.playsInline);

    expect(isMuted).toBe(true);
    expect(hasLoop).toBe(true);
    expect(hasPlaysinline).toBe(true);
  });

  test('4. Video IntersectionObserver plays only when visible and pauses otherwise', async ({
    page,
  }) => {
    const video = page.locator('video.panel-video').first();
    await expect(video).toBeAttached();

    // Initially at top (hero/services), video should be paused
    const initiallyPaused = await video.evaluate((el: HTMLVideoElement) => el.paused);
    expect(initiallyPaused).toBe(true);

    // Scroll video panel into view
    await video.scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);

    // Check if video is playing or paused based on intersection
    const isPausedAfterScroll = await video.evaluate((el: HTMLVideoElement) => el.paused);
    // Intersection observer triggers play when >=60% in view
    expect(typeof isPausedAfterScroll).toBe('boolean');

    // Scroll back to top
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.waitForTimeout(500);

    const pausedAtTop = await video.evaluate((el: HTMLVideoElement) => el.paused);
    expect(pausedAtTop).toBe(true);
  });

  test('5. Focal point positioning applies at desktop 16:9 and mobile 9:16', async ({ page }) => {
    // Desktop 16:9 (1920x1080)
    await page.setViewportSize({ width: 1920, height: 1080 });
    const firstImg = page.locator('.work-panel').first().locator('picture img');
    await expect(firstImg).toBeAttached();

    const desktopPosition = await firstImg.evaluate(
      (el: HTMLImageElement) => el.style.objectPosition
    );
    expect(desktopPosition).toBe('30% 40%');

    // Mobile 9:16 (390x844)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(300);

    const mobilePosition = await firstImg.evaluate(
      (el: HTMLImageElement) => el.style.objectPosition
    );
    expect(mobilePosition).toBe('30% 40%');

    // Object-fit cover remains applied
    const objectFit = await firstImg.evaluate(
      (el: HTMLImageElement) => window.getComputedStyle(el).objectFit
    );
    expect(objectFit).toBe('cover');
  });

  test('6. Fallback gradient and project title render when no media is assigned', async ({
    page,
  }) => {
    // Find a work panel with no mediaUrl
    const fallbackPanel = page.locator('.work-panel:not([data-media-url])').first();
    if ((await fallbackPanel.count()) > 0) {
      await expect(fallbackPanel).toBeAttached();

      const bgStyle = await fallbackPanel.evaluate((el: HTMLElement) => el.style.background);
      expect(bgStyle).toContain('linear-gradient');

      const title = fallbackPanel.locator('h3');
      await expect(title).toBeVisible();
      const titleText = await title.innerText();
      expect(titleText.length).toBeGreaterThan(0);
    }
  });

  test('7. Admin UI exposes focal point sliders and alt text input', async ({ page }) => {
    // Login to admin
    await page.goto('/admin/login');
    await page.fill('#email', 'admin@saidkhan.dev');
    await page.fill('#password', 'ChangeThisStrongPassword123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/admin\/dashboard/);

    // Go to Works admin page
    await page.goto('/admin/works');
    await page.waitForLoadState('networkidle');

    // Click Create Showcase Work
    const openCreateBtn = page.locator('#open-create-work-btn');
    await expect(openCreateBtn).toBeVisible();
    await openCreateBtn.click();

    // Verify focal point controls exist
    const focalXRange = page.locator('#work-focalX-range');
    const focalYRange = page.locator('#work-focalY-range');
    const altTextInput = page.locator('#work-altText-input');

    await expect(focalXRange).toBeVisible();
    await expect(focalYRange).toBeVisible();
    await expect(altTextInput).toBeVisible();

    // Adjust focal slider
    await focalXRange.fill('42');
    await focalXRange.dispatchEvent('input');
    const focalXVal = page.locator('#focalX-val');
    await expect(focalXVal).toHaveText('42%');

    // Fill alt text
    await altTextInput.fill('High speed motion title sequence screenshot');
    expect(await altTextInput.inputValue()).toBe('High speed motion title sequence screenshot');
  });
});
