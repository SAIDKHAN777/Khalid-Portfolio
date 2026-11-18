import { test, expect } from '@playwright/test';
import prisma from '../../src/lib/db';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@saidkhan.dev';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'ChangeThisStrongPassword123!';

test.describe('Analytics & Click Tracking E2E Suite', () => {
  let authCookie: string;
  let testProjectId: string;

  test.beforeAll(async ({ request }) => {
    // 1. Authenticate as Admin
    const loginRes = await request.post('/api/auth/login', {
      data: {
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
      },
    });
    expect(loginRes.status()).toBe(200);
    authCookie = loginRes.headers()['set-cookie'];

    // 2. Create isolated test project for click metrics
    const testProject = await prisma.project.create({
      data: {
        title: 'E2E Analytics Project',
        slug: 'e2e-analytics-proj-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8),
        shortDescription: 'A test project for analytics E2E test',
        liveUrl: 'https://demo.example.com',
        githubUrl: 'https://github.com/example/repo',
        status: 'PUBLISHED',
      },
    });
    testProjectId = testProject.id;
  });

  test.afterAll(async () => {
    if (testProjectId) {
      await prisma.projectClick.deleteMany({ where: { projectId: testProjectId } });
      await prisma.project.deleteMany({ where: { id: testProjectId } });
    }
    await prisma.pageView.deleteMany({ where: { path: { startsWith: '/e2e-' } } });
  });

  test('POST /api/analytics/view records page view for human visitors', async ({ request }) => {
    const res = await request.post('/api/analytics/view', {
      data: {
        path: '/e2e-test-page',
        referrer: 'https://news.ycombinator.com',
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0',
        'X-Forwarded-For': '198.51.100.25',
      },
    });

    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.recorded).toBe(true);
    expect(body.data.isBot).toBe(false);
    expect(body.data.id).toBeDefined();
  });

  test('POST /api/analytics/view correctly identifies bot user agents', async ({ request }) => {
    const res = await request.post('/api/analytics/view', {
      data: {
        path: '/e2e-bot-crawler-page',
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
        'X-Forwarded-For': '66.249.66.1',
      },
    });

    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.isBot).toBe(true);
  });

  test('POST /api/analytics/view rejects invalid payload without path', async ({ request }) => {
    const res = await request.post('/api/analytics/view', {
      data: {
        referrer: 'https://broken.com',
      },
    });

    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  test('POST /api/analytics/click records LIVE_DEMO and GITHUB clicks', async ({ request }) => {
    const demoRes = await request.post('/api/analytics/click', {
      data: {
        projectId: testProjectId,
        clickType: 'LIVE_DEMO',
      },
      headers: {
        'X-Forwarded-For': '203.0.113.10',
      },
    });

    expect(demoRes.status()).toBe(201);
    const demoBody = await demoRes.json();
    expect(demoBody.success).toBe(true);
    expect(demoBody.data.clickType).toBe('LIVE_DEMO');
    expect(demoBody.data.projectId).toBe(testProjectId);

    const githubRes = await request.post('/api/analytics/click', {
      data: {
        projectId: testProjectId,
        clickType: 'GITHUB',
      },
      headers: {
        'X-Forwarded-For': '203.0.113.11',
      },
    });

    expect(githubRes.status()).toBe(201);
    const githubBody = await githubRes.json();
    expect(githubBody.success).toBe(true);
    expect(githubBody.data.clickType).toBe('GITHUB');
  });

  test('POST /api/analytics/click returns 404 for non-existent project', async ({ request }) => {
    const res = await request.post('/api/analytics/click', {
      data: {
        projectId: 'clx0000000000000000000000',
        clickType: 'LIVE_DEMO',
      },
    });

    expect(res.status()).toBe(404);
  });

  test('POST /api/analytics/click returns 400 for invalid clickType', async ({ request }) => {
    const res = await request.post('/api/analytics/click', {
      data: {
        projectId: testProjectId,
        clickType: 'FACEBOOK_LINK',
      },
    });

    expect(res.status()).toBe(400);
  });

  test('GET /api/admin/analytics rejects unauthorized requests with 401', async ({ request }) => {
    const res = await request.get('/api/admin/analytics');
    expect(res.status()).toBe(401);
  });

  test('GET /api/admin/analytics returns aggregated metrics for authorized admin', async ({
    request,
  }) => {
    const res = await request.get('/api/admin/analytics?range=30d', {
      headers: { Cookie: authCookie },
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.range).toBe('30d');
    expect(body.data.views).toHaveProperty('totalInRange');
    expect(body.data.views).toHaveProperty('today');
    expect(Array.isArray(body.data.views.viewsPerDay)).toBe(true);
    expect(Array.isArray(body.data.topPages)).toBe(true);
    expect(Array.isArray(body.data.topProjects)).toBe(true);
    expect(body.data.totalStats).toHaveProperty('views');
    expect(body.data.totalStats).toHaveProperty('clicks');
    expect(body.data.totalStats).toHaveProperty('downloads');
    expect(body.data.totalStats).toHaveProperty('messages');
  });

  test('GET /api/admin/analytics validates range parameter', async ({ request }) => {
    const res = await request.get('/api/admin/analytics?range=invalid_range', {
      headers: { Cookie: authCookie },
    });

    expect(res.status()).toBe(400);
  });
});
