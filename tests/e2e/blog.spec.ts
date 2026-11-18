import { test, expect } from '@playwright/test';
import prisma from '../../src/lib/db';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@saidkhan.dev';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'ChangeThisStrongPassword123!';

test.describe('Blog Engine API E2E Suite', () => {
  let authCookie: string;
  let createdPublishedId: string;
  let createdDraftId: string;

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
  });

  test.afterAll(async () => {
    await prisma.blogPost.deleteMany({
      where: {
        slug: { startsWith: 'e2e-' },
      },
    });
  });

  test('unauthenticated write requests to /api/blog are rejected with 401', async ({ request }) => {
    const res = await request.post('/api/blog', {
      data: {
        title: 'Hacked Blog Post',
        summary: 'Should fail immediately',
        content: 'Malicious payload',
      },
    });

    expect(res.status()).toBe(401);
  });

  test('manages complete blog lifecycle: create published, create draft, public verification, markdown render', async ({
    request,
  }) => {
    // 1. Admin creates a published post
    const publishedRes = await request.post('/api/blog', {
      headers: { Cookie: authCookie },
      data: {
        title: 'E2E Building Zero-JS Public Pages with Astro',
        slug: 'e2e-zero-js-astro-architecture-' + Date.now(),
        summary: 'How we built lightning fast public pages with Astro islands architecture',
        content:
          '# Fast SSR\n\nPerformance is key. Visit [Said Khan Portfolio](https://saidkhan.dev).',
        status: 'PUBLISHED',
        tags: ['astro', 'performance'],
      },
    });

    expect(publishedRes.status()).toBe(201);
    const publishedBody = await publishedRes.json();
    expect(publishedBody.success).toBe(true);
    const publishedSlug = publishedBody.data.slug;
    createdPublishedId = publishedBody.data.id;

    // 2. Admin creates a draft post
    const draftRes = await request.post('/api/blog', {
      headers: { Cookie: authCookie },
      data: {
        title: 'E2E Secret Unreleased Post',
        slug: 'e2e-secret-unreleased-post-' + Date.now(),
        summary: 'This should remain invisible to visitors',
        content: 'Work in progress draft content',
        status: 'DRAFT',
      },
    });

    expect(draftRes.status()).toBe(201);
    const draftBody = await draftRes.json();
    const draftSlug = draftBody.data.slug;
    createdDraftId = draftBody.data.id;

    // 3. Public GET /api/blog should include published post but NEVER include draft
    const publicListRes = await request.get('/api/blog');
    expect(publicListRes.status()).toBe(200);
    const publicListBody = await publicListRes.json();
    const slugs = publicListBody.data.posts.map((p: { slug: string }) => p.slug);

    expect(slugs).toContain(publishedSlug);
    expect(slugs).not.toContain(draftSlug);

    // 4. Public GET for draft slug must return 404
    const draftFetchRes = await request.get(`/api/blog/${draftSlug}`);
    expect(draftFetchRes.status()).toBe(404);

    // 5. Public GET for published slug with render=true returns sanitized HTML
    const renderFetchRes = await request.get(`/api/blog/${publishedSlug}?render=true`);
    expect(renderFetchRes.status()).toBe(200);
    const renderBody = await renderFetchRes.json();
    expect(renderBody.data).toHaveProperty('htmlContent');
    expect(renderBody.data.htmlContent).toContain('<h1>Fast SSR</h1>');
    expect(renderBody.data.htmlContent).toContain('href="https://saidkhan.dev"');
    expect(renderBody.data.htmlContent).toContain('target="_blank"');
  });
});
