import { test, expect } from '@playwright/test';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@saidkhan.dev';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'ChangeThisStrongPassword123!';

test.describe('Media Management & Resume Tracking E2E Suite', () => {
  let authCookie: string;

  test.beforeAll(async ({ request }) => {
    const loginRes = await request.post('/api/auth/login', {
      data: {
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
      },
    });
    expect(loginRes.status()).toBe(200);
    authCookie = loginRes.headers()['set-cookie'];
  });

  test('unauthenticated media requests are rejected with 401', async ({ request }) => {
    const listRes = await request.get('/api/admin/media');
    expect(listRes.status()).toBe(401);

    const uploadRes = await request.post('/api/admin/media/upload');
    expect(uploadRes.status()).toBe(401);

    const deleteRes = await request.delete('/api/admin/media/non-existent-id');
    expect(deleteRes.status()).toBe(401);
  });

  test('admin can upload, list, and delete media assets via multipart/form-data', async ({
    request,
  }) => {
    // 1. Upload a simulated PNG image
    const sampleImageBuffer = Buffer.from('89504e470d0a1a0a0000000d49484452', 'hex'); // basic PNG header bytes

    const uploadRes = await request.post('/api/admin/media/upload', {
      headers: { Cookie: authCookie },
      multipart: {
        file: {
          name: 'e2e-test-banner.png',
          mimeType: 'image/png',
          buffer: sampleImageBuffer,
        },
        altText: 'E2E Testing Project Banner',
        folder: 'portfolio/tests',
      },
    });

    expect(uploadRes.status()).toBe(201);
    const uploadBody = await uploadRes.json();
    expect(uploadBody.success).toBe(true);
    const mediaId = uploadBody.data.id;
    expect(mediaId).toBeDefined();
    expect(uploadBody.data.url).toBeDefined();

    // 2. List media assets as Admin
    const listRes = await request.get('/api/admin/media', {
      headers: { Cookie: authCookie },
    });
    expect(listRes.status()).toBe(200);
    const listBody = await listRes.json();
    expect(listBody.data.media.some((m: { id: string }) => m.id === mediaId)).toBe(true);

    // 3. Delete media asset
    const deleteRes = await request.delete(`/api/admin/media/${mediaId}`, {
      headers: { Cookie: authCookie },
    });
    expect(deleteRes.status()).toBe(200);

    // 4. Verify it is removed from list
    const postDeleteList = await request.get('/api/admin/media', {
      headers: { Cookie: authCookie },
    });
    const postDeleteBody = await postDeleteList.json();
    expect(postDeleteBody.data.media.some((m: { id: string }) => m.id === mediaId)).toBe(false);
  });

  test('public resume download tracks event and returns active document URL', async ({
    request,
  }) => {
    const res = await request.get('/api/resume/download?redirect=false', {
      headers: {
        'X-Forwarded-For': '198.51.100.77',
      },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();

    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty('resumeUrl');
    expect(body.data.recorded).toBe(true);
  });
});
