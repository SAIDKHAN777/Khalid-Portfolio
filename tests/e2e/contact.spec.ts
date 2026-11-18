import { test, expect } from '@playwright/test';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@saidkhan.dev';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'ChangeThisStrongPassword123!';

test.describe('Contact Form & Background Notification Pipeline E2E', () => {
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

  test('submits valid contact form inquiry and queues notification', async ({ request }) => {
    const randomIp = `198.51.${Math.floor(Math.random() * 200)}.${Math.floor(Math.random() * 200)}`;
    const res = await request.post('/api/contact', {
      headers: {
        // Use a unique header IP for this test to avoid collision with rate limits
        'X-Forwarded-For': randomIp,
      },
      data: {
        name: 'Sarah Connor',
        email: 'sarah@resistance.org',
        subject: 'Architecture Consulting Request',
        message:
          'Hello Said, we need an urgent system architecture audit for our distributed platform.',
      },
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty('id');
    expect(body.data.message).toContain('received');
  });

  test('rejects invalid contact form input with 400 validation error', async ({ request }) => {
    const res = await request.post('/api/contact', {
      headers: { 'X-Forwarded-For': '198.51.100.2' },
      data: {
        name: 'S', // too short
        email: 'invalid-email-address',
        subject: 'Hi', // too short
        message: 'short', // too short
      },
    });

    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  test('honeypot trap returns synthetic success without saving or processing', async ({
    request,
  }) => {
    const res = await request.post('/api/contact', {
      headers: { 'X-Forwarded-For': '198.51.100.3' },
      data: {
        name: 'Spam Bot 3000',
        email: 'spammer@darkweb.ru',
        subject: 'Buy cheap backlinks today',
        message: 'Guaranteed SEO ranking boost within 24 hours buy now.',
        honeypot: 'bot-injected-field-value', // Honeypot trap triggered
      },
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    // Notice honeypot does NOT return a database message ID
    expect(body.data).not.toHaveProperty('id');
  });

  test('enforces strict IP rate limiting (maximum 3 inquiries per hour)', async ({ request }) => {
    const rateLimitIp = `198.51.100.${Math.floor(Math.random() * 200 + 50)}`;
    const payload = {
      name: 'Rate Limit Tester',
      email: 'ratelimit@test.com',
      subject: 'Testing Rate Limits',
      message: 'Checking that repeated contact submissions trigger rate limiter.',
    };

    // 1st, 2nd, 3rd requests succeed
    const r1 = await request.post('/api/contact', {
      headers: { 'X-Forwarded-For': rateLimitIp },
      data: payload,
    });
    const r2 = await request.post('/api/contact', {
      headers: { 'X-Forwarded-For': rateLimitIp },
      data: payload,
    });
    const r3 = await request.post('/api/contact', {
      headers: { 'X-Forwarded-For': rateLimitIp },
      data: payload,
    });

    expect(r1.status()).toBe(200);
    expect(r2.status()).toBe(200);
    expect(r3.status()).toBe(200);

    // 4th request must be rate limited with 429
    const r4 = await request.post('/api/contact', {
      headers: { 'X-Forwarded-For': rateLimitIp },
      data: payload,
    });
    expect(r4.status()).toBe(429);
    const body4 = await r4.json();
    expect(body4.success).toBe(false);
    expect(body4.error.code).toBe('RATE_LIMIT_EXCEEDED');
  });

  test('admin can manage inbox: list messages, mark as read, delete', async ({ request }) => {
    // 1. Submit a message
    const randomIp = `198.51.${Math.floor(Math.random() * 200)}.${Math.floor(Math.random() * 200)}`;
    const submitRes = await request.post('/api/contact', {
      headers: { 'X-Forwarded-For': randomIp },
      data: {
        name: 'Admin Inbox Tester',
        email: 'inbox@test.com',
        subject: 'Inbox Workflow Verification',
        message: 'This message will be listed, marked as read, and deleted by admin.',
      },
    });
    const {
      data: { id: messageId },
    } = await submitRes.json();
    expect(messageId).toBeDefined();

    // 2. Unauthenticated access to /api/contact returns 401
    const unauthRes = await request.get('/api/contact');
    expect(unauthRes.status()).toBe(401);

    // 3. Authenticated admin lists messages
    const listRes = await request.get('/api/contact', {
      headers: { Cookie: authCookie },
    });
    expect(listRes.status()).toBe(200);
    const listBody = await listRes.json();
    expect(listBody.data.messages.some((m: { id: string }) => m.id === messageId)).toBe(true);

    // 4. Mark as read
    const readRes = await request.patch(`/api/contact/${messageId}`, {
      headers: { Cookie: authCookie },
      data: { isRead: true },
    });
    expect(readRes.status()).toBe(200);
    const readBody = await readRes.json();
    expect(readBody.data.isRead).toBe(true);

    // 5. Delete message
    const deleteRes = await request.delete(`/api/contact/${messageId}`, {
      headers: { Cookie: authCookie },
    });
    expect(deleteRes.status()).toBe(200);
  });
});
