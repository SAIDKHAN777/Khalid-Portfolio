export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  totalLimit: number;
  resetInSeconds: number;
}

const memoryStore = new Map<string, { count: number; expiresAt: number }>();

export async function checkRateLimit(
  key: string,
  limit = 3,
  windowSeconds = 3600
): Promise<RateLimitResult> {
  const now = Date.now();
  const entry = memoryStore.get(key);

  if (!entry || entry.expiresAt < now) {
    memoryStore.set(key, { count: 1, expiresAt: now + windowSeconds * 1000 });
    return {
      allowed: true,
      remaining: Math.max(0, limit - 1),
      totalLimit: limit,
      resetInSeconds: windowSeconds,
    };
  }

  entry.count += 1;
  const remainingSeconds = Math.max(1, Math.ceil((entry.expiresAt - now) / 1000));

  if (entry.count > limit) {
    return {
      allowed: false,
      remaining: 0,
      totalLimit: limit,
      resetInSeconds: remainingSeconds,
    };
  }

  return {
    allowed: true,
    remaining: Math.max(0, limit - entry.count),
    totalLimit: limit,
    resetInSeconds: remainingSeconds,
  };
}
