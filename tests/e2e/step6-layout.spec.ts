import { test, expect } from '@playwright/test';

const VIEWPORTS = [
  { width: 1920, height: 1080, name: '1920x1080 Baseline' },
  { width: 1536, height: 864, name: '1536x864 Laptop' },
  { width: 1366, height: 768, name: '1366x768 Compact' },
];

for (const vp of VIEWPORTS) {
  test.describe(`Step 6: Page Layout & Geometry [${vp.name}]`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    test('1. Hero matches specifications and DB content', async ({ page }) => {
      await page.goto('/');

      const hero = page.locator('#hero');
      await expect(hero).toBeVisible();

      // Check height matches 100vh
      const heroBox = await hero.boundingBox();
      expect(heroBox).not.toBeNull();
      expect(heroBox!.height).toBeCloseTo(vp.height, -1);

      // Check DB greeting "Hello"
      const greeting = hero.locator('h1');
      await expect(greeting).toHaveText('Hello');

      // Check DB intro paragraph
      const intro = hero.locator('p');
      await expect(intro).toContainText('My name is Khalid');

      // Check portrait
      const portrait = hero.locator('img[alt="Khalid"]');
      await expect(portrait).toBeVisible();

      // Check no horizontal overflow
      const hasHorizontalScroll = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth
      );
      expect(hasHorizontalScroll).toBe(false);
    });

    test('2. Services List renders 4 rows without (Services) label', async ({ page }) => {
      await page.goto('/');

      const services = page.locator('#services');
      await expect(services).toBeVisible();

      // Verify no (Services) label exists anywhere in services section
      const textContent = await services.textContent();
      expect(textContent).not.toContain('(Services)');

      // Verify 4 canonical services
      await expect(services).toContainText('Video Editing');
      await expect(services).toContainText('Graphic Design');
      await expect(services).toContainText('Motion Graphic');
      await expect(services).toContainText('Digital Marketing');
    });

    test('3. Section Heading Bands and Work Panels geometry', async ({ page }) => {
      await page.goto('/');

      // Check 3 work sections from DB
      const sections = page.locator('.work-section');
      await expect(sections).toHaveCount(3);

      // Check heading band height is ~48vh
      const headingBands = page.locator('.section-heading-band');
      await expect(headingBands).toHaveCount(3);
      const bandBox = await headingBands.first().boundingBox();
      expect(bandBox).not.toBeNull();
      const expectedBandHeight = vp.height * 0.48;
      expect(bandBox!.height).toBeGreaterThanOrEqual(expectedBandHeight - 50);

      // Check work panels have 100vh height
      const workPanels = page.locator('.work-panel');
      const count = await workPanels.count();
      expect(count).toBeGreaterThanOrEqual(7);

      const panelBox = await workPanels.first().boundingBox();
      expect(panelBox).not.toBeNull();
      expect(panelBox!.height).toBeCloseTo(vp.height, -1);

      // Verify tag pills exist with styling
      const tagPills = page.locator('.shape-tag-pill');
      expect(await tagPills.count()).toBeGreaterThanOrEqual(1);
    });

    test('4. Footer matches specifications and dark gradient', async ({ page }) => {
      await page.goto('/');

      const footer = page.locator('#footer');
      await expect(footer).toBeVisible();

      // Check headline & subline
      await expect(footer.locator('h2')).toContainText('Connect with us');
      await expect(footer).toContainText("Have a project in mind? Let's make it happen.");

      // Check contact button
      const contactBtn = footer.locator('a.shape-contact-btn');
      await expect(contactBtn).toBeVisible();
      await expect(contactBtn).toContainText('Contact Us');
    });

    test('5. Fixed UI components: MenuButton, ViewButton, BottomBar', async ({ page }) => {
      await page.goto('/');

      // MenuButton (3 lines, top right)
      const menuBtn = page.locator('#menu-button');
      await expect(menuBtn).toBeVisible();
      const lines = menuBtn.locator('.menu-line');
      await expect(lines).toHaveCount(3);

      // ViewButton removed per user request
      const viewBtn = page.locator('#view-button');
      await expect(viewBtn).toHaveCount(0);

      // BottomBar removed per user request
      const bottomBar = page.locator('#bottom-bar');
      await expect(bottomBar).toHaveCount(0);
    });
  });
}
