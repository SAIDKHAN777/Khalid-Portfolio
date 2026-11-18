import { test, expect } from '@playwright/test';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@saidkhan.dev';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'ChangeThisStrongPassword123!';

test.describe('Content Management APIs Access Control & Operations', () => {
  let authCookie: string;

  test.beforeAll(async ({ request }) => {
    // Obtain valid session cookie for admin requests
    const loginRes = await request.post('/api/auth/login', {
      data: {
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
      },
    });
    expect(loginRes.status()).toBe(200);
    authCookie = loginRes.headers()['set-cookie'];
  });

  test('public GET requests succeed without authentication', async ({ request }) => {
    const projectsRes = await request.get('/api/projects');
    expect(projectsRes.status()).toBe(200);
    const projectsBody = await projectsRes.json();
    expect(projectsBody.success).toBe(true);
    expect(projectsBody.data).toHaveProperty('projects');
    expect(projectsBody.data).toHaveProperty('pagination');

    const skillsRes = await request.get('/api/skills');
    expect(skillsRes.status()).toBe(200);

    const servicesRes = await request.get('/api/services');
    expect(servicesRes.status()).toBe(200);

    const settingsRes = await request.get('/api/settings');
    expect(settingsRes.status()).toBe(200);
    const settingsBody = await settingsRes.json();
    expect(settingsBody.data.siteName).toBeDefined();
  });

  test('unauthenticated mutation requests are strictly rejected with 401', async ({ request }) => {
    // Unauthenticated project creation
    const projectRes = await request.post('/api/projects', {
      data: {
        title: 'Hacked Project',
        description: 'Should fail',
      },
    });
    expect(projectRes.status()).toBe(401);
    const projectBody = await projectRes.json();
    expect(projectBody.success).toBe(false);
    expect(projectBody.error.code).toBe('UNAUTHORIZED');

    // Unauthenticated skill creation
    const skillRes = await request.post('/api/skills', {
      data: {
        name: 'Hacked Skill',
        category: 'Malicious',
      },
    });
    expect(skillRes.status()).toBe(401);
  });

  test('authenticated admin can create, update, and delete content', async ({ request }) => {
    // 1. Create a new published project as Admin
    const createRes = await request.post('/api/projects', {
      headers: { Cookie: authCookie },
      data: {
        title: 'E2E Full-Stack Microservices Platform',
        slug: 'e2e-microservices-platform',
        description: 'High availability event-driven architecture using Kafka & Node.js',
        techStack: ['Node.js', 'Kafka', 'PostgreSQL', 'Docker'],
        status: 'PUBLISHED',
        isFeatured: true,
      },
    });

    expect(createRes.status()).toBe(201);
    const createdBody = await createRes.json();
    expect(createdBody.success).toBe(true);
    const projectId = createdBody.data.id;
    const projectSlug = createdBody.data.slug;
    expect(projectId).toBeDefined();

    // 2. Publicly fetch by slug
    const fetchRes = await request.get(`/api/projects/${projectSlug}`);
    expect(fetchRes.status()).toBe(200);
    const fetchBody = await fetchRes.json();
    expect(fetchBody.data.title).toBe('E2E Full-Stack Microservices Platform');

    // 3. Update the project
    const updateRes = await request.put(`/api/projects/${projectId}`, {
      headers: { Cookie: authCookie },
      data: {
        title: 'E2E Full-Stack Microservices Platform (v2)',
        description: 'Updated high availability event-driven architecture',
      },
    });
    expect(updateRes.status()).toBe(200);
    const updateBody = await updateRes.json();
    expect(updateBody.data.title).toContain('(v2)');

    // 4. Soft Delete the project
    const deleteRes = await request.delete(`/api/projects/${projectId}`, {
      headers: { Cookie: authCookie },
    });
    expect(deleteRes.status()).toBe(200);

    // 5. Verify it is now hidden from public queries
    const postDeleteRes = await request.get(`/api/projects/${projectSlug}`);
    expect(postDeleteRes.status()).toBe(404);
  });
});
