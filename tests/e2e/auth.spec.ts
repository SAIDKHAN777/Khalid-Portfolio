import { test, expect } from '@playwright/test';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@saidkhan.dev';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'ChangeThisStrongPassword123!';

test.describe('Admin Authentication End-to-End Suite', () => {
  test('rejects login with wrong password and returns 401', async ({ request }) => {
    const res = await request.post('/api/auth/login', {
      data: {
        email: ADMIN_EMAIL,
        password: 'IncorrectPassword987!',
      },
    });

    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('INVALID_CREDENTIALS');
  });

  test('rejects unauthorized access to /admin/dashboard and redirects to /admin/login', async ({
    page,
  }) => {
    // Navigate without session cookie
    const response = await page.goto('/admin/dashboard');
    expect(response?.url()).toContain('/admin/login');
  });

  test('rejects unauthorized access to /api/auth/me with 401', async ({ request }) => {
    const res = await request.get('/api/auth/me');
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  test('executes complete authentication lifecycle: login -> authenticated session -> me -> logout', async ({
    request,
  }) => {
    // 1. Successful Login
    const loginRes = await request.post('/api/auth/login', {
      data: {
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
      },
    });

    expect(loginRes.status()).toBe(200);
    const loginBody = await loginRes.json();
    expect(loginBody.success).toBe(true);
    expect(loginBody.data.user.email).toBe(ADMIN_EMAIL);
    expect(loginBody.data.user).not.toHaveProperty('passwordHash');

    // Extract cookie from response headers
    const setCookieHeader = loginRes.headers()['set-cookie'];
    expect(setCookieHeader).toBeDefined();
    expect(setCookieHeader).toContain('portfolio_session');

    // 2. Access /api/auth/me using the session cookie
    const meRes = await request.get('/api/auth/me', {
      headers: {
        Cookie: setCookieHeader,
      },
    });

    expect(meRes.status()).toBe(200);
    const meBody = await meRes.json();
    expect(meBody.success).toBe(true);
    expect(meBody.data.user.email).toBe(ADMIN_EMAIL);

    // 3. Logout
    const logoutRes = await request.post('/api/auth/logout', {
      headers: {
        Cookie: setCookieHeader,
      },
    });

    expect(logoutRes.status()).toBe(200);
    const logoutBody = await logoutRes.json();
    expect(logoutBody.success).toBe(true);

    // 4. Verify session is now invalidated
    const postLogoutRes = await request.get('/api/auth/me', {
      headers: {
        Cookie: setCookieHeader,
      },
    });
    expect(postLogoutRes.status()).toBe(401);
  });
});
