import { test, expect } from '@playwright/test';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@saidkhan.dev';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'ChangeThisStrongPassword123!';

test.describe('Admin Panel UI (Astro + React Islands) E2E Suite (Step 11)', () => {
  test('unauthenticated visitors navigating to /admin/* are redirected to /admin/login', async ({
    page,
  }) => {
    await page.goto('/admin/dashboard');
    await expect(page).toHaveURL(/\/admin\/login/);
    await expect(page.locator('h1')).toContainText('Admin Control Center');

    await page.goto('/admin/projects');
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test('admin logs in via UI form and navigates through all admin sections', async ({ page }) => {
    // 1. Visit Login Page
    await page.goto('/admin/login');
    await page.fill('#email', ADMIN_EMAIL);
    await page.fill('#password', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');

    // 2. Expect redirect to dashboard
    await expect(page).toHaveURL(/\/admin\/dashboard/);
    await expect(page.locator('body')).toContainText('Executive Analytics');
    await expect(page.locator('body')).toContainText('Admin Console');

    // 3. Navigate to Projects section
    await page.click('a[href="/admin/projects"]');
    await expect(page).toHaveURL(/\/admin\/projects/);
    await expect(page.locator('h1')).toContainText('Project Management');
    await expect(page.locator('#btn-create-project')).toBeVisible();

    // 4. Navigate to Blog section
    await page.click('a[href="/admin/blog"]');
    await expect(page).toHaveURL(/\/admin\/blog/);
    await expect(page.locator('h1')).toContainText('Technical Publications');
    await expect(page.locator('#btn-create-post')).toBeVisible();

    // 5. Navigate to Media Library
    await page.click('a[href="/admin/media"]');
    await expect(page).toHaveURL(/\/admin\/media/);
    await expect(page.locator('h1')).toContainText('Media & Asset Library');

    // 6. Navigate to Messages Inbox
    await page.click('a[href="/admin/messages"]');
    await expect(page).toHaveURL(/\/admin\/messages/);
    await expect(page.locator('h1')).toContainText('Contact Inquiries');

    // 7. Navigate to Settings
    await page.click('a[href="/admin/settings"]');
    await expect(page).toHaveURL(/\/admin\/settings/);
    await expect(page.locator('h1')).toContainText('Platform Configuration');
  });

  test('admin can create a new project through the React modal interface', async ({ page }) => {
    // 1. Log in
    await page.goto('/admin/login');
    await page.fill('#email', ADMIN_EMAIL);
    await page.fill('#password', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/admin\/dashboard/);

    // 2. Go to Projects and open modal
    await page.goto('/admin/projects');
    await page.waitForSelector('[data-hydrated="true"]');
    await page.click('#btn-create-project');

    // 3. Fill in modal fields
    const testTitle = `UI Automated Project ${Date.now()}`;
    await page.waitForSelector('#project-title-input');
    await page.fill('#project-title-input', testTitle);
    await page.fill(
      'textarea[placeholder*="architectural overview"]',
      'Testing full React island modal creation in Playwright E2E suite.'
    );
    await page.click('#btn-save-project');

    // 4. Verify project appears in the table
    await expect(page.locator('body')).toContainText(testTitle);
  });

  test('logout button terminates active session and redirects to login view', async ({ page }) => {
    // 1. Log in
    await page.goto('/admin/login');
    await page.fill('#email', ADMIN_EMAIL);
    await page.fill('#password', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/admin\/dashboard/);

    // 2. Click logout button
    await page.click('#admin-logout-btn');
    await expect(page).toHaveURL(/\/admin\/login/);

    // 3. Verify session is cleared
    await page.goto('/admin/dashboard');
    await expect(page).toHaveURL(/\/admin\/login/);
  });
});
