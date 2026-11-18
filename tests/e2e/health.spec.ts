import { test, expect } from '@playwright/test';

test.describe('Health Check API Route', () => {
  test('returns 200 with standard API envelope and healthy status', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty('success', true);
    expect(body).toHaveProperty('data');
    expect(body.data).toHaveProperty('status', 'healthy');
    expect(body.error).toBeNull();
  });
});
