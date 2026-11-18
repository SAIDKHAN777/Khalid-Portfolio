import { test, expect } from '@playwright/test';

test.describe('Platform Security Hardening E2E Suite (Step 10)', () => {
  test('enforces strict enterprise security headers on all responses', async ({ request }) => {
    const res = await request.get('/api/health');
    expect(res.status()).toBe(200);

    const headers = res.headers();

    // 1. Content-Security-Policy
    expect(headers).toHaveProperty('content-security-policy');
    const csp = headers['content-security-policy'];
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("frame-ancestors 'none'");

    // 2. Strict-Transport-Security (HSTS)
    expect(headers).toHaveProperty('strict-transport-security');
    expect(headers['strict-transport-security']).toContain('max-age=31536000');
    expect(headers['strict-transport-security']).toContain('includeSubDomains');

    // 3. X-Content-Type-Options
    expect(headers['x-content-type-options']).toBe('nosniff');

    // 4. X-Frame-Options
    expect(headers['x-frame-options']).toBe('DENY');

    // 5. Referrer-Policy
    expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');

    // 6. Permissions-Policy
    expect(headers['permissions-policy']).toContain('camera=()');
    expect(headers['permissions-policy']).toContain('microphone=()');

    // 7. Cross-Origin-Opener-Policy
    expect(headers['cross-origin-opener-policy']).toBe('same-origin');
  });

  test('blocks oversized payloads exceeding 1MB threshold with 413 Payload Too Large', async ({
    request,
  }) => {
    // 1.2MB dummy string payload
    const oversizedString = 'A'.repeat(1.2 * 1024 * 1024);

    const res = await request.post('/api/contact', {
      headers: {
        'Content-Type': 'application/json',
      },
      data: JSON.stringify({
        name: 'Attacker',
        email: 'attacker@large.com',
        subject: 'DDoS Payload',
        message: oversizedString,
      }),
    });

    expect(res.status()).toBe(413);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('PAYLOAD_TOO_LARGE');
    expect(body.error.message).toContain('exceeds maximum allowed size');
  });

  test('blocks Cross-Site Request Forgery (CSRF) on mutations with mismatched origin', async ({
    request,
  }) => {
    const res = await request.post('/api/contact', {
      headers: {
        Origin: 'https://evil-phishing-site.com',
        Host: 'localhost:4321',
      },
      data: {
        name: 'Victim',
        email: 'victim@target.com',
        subject: 'Injected CSRF Form',
        message: 'This payload should be rejected due to origin mismatch.',
      },
    });

    expect(res.status()).toBe(403);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('FORBIDDEN_CSRF');
  });

  test('enforces global rate limiting when threshold is exceeded', async ({ request }) => {
    const testIp = `198.51.200.${Math.floor(Math.random() * 250)}`;

    // Fire requests rapidly with the test rate limit flag
    let rateLimited = false;
    for (let i = 0; i < 105; i++) {
      const res = await request.get('/api/health', {
        headers: {
          'X-Forwarded-For': testIp,
          'X-Test-Global-Ratelimit': 'true',
        },
      });

      if (res.status() === 429) {
        rateLimited = true;
        const body = await res.json();
        expect(body.success).toBe(false);
        expect(body.error.code).toBe('RATE_LIMIT_EXCEEDED');
        expect(res.headers()).toHaveProperty('retry-after');
        break;
      }
    }

    expect(rateLimited).toBe(true);
  });

  test('never leaks stack traces in error responses', async ({ request }) => {
    const res = await request.post('/api/analytics/click', {
      data: 'invalid non-json text payload',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body).not.toHaveProperty('stack');
    expect(JSON.stringify(body)).not.toContain('node_modules');
    expect(JSON.stringify(body)).not.toContain('/home/');
  });
});
