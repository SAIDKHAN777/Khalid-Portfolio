import crypto from 'crypto';

const BOT_PATTERNS = [
  /bot/i,
  /crawl/i,
  /spider/i,
  /googlebot/i,
  /bingbot/i,
  /yandex/i,
  /baiduspider/i,
  /duckduckbot/i,
  /slurp/i,
  /semrush/i,
  /ahrefs/i,
  /mj12bot/i,
  /dotbot/i,
  /petalbot/i,
  /facebookexternalhit/i,
  /linkedinbot/i,
  /twitterbot/i,
  /slackbot/i,
  /whatsapp/i,
  /telegrambot/i,
  /headlesschrome/i,
  /python-requests/i,
  /postmanruntime/i,
  /curl/i,
  /wget/i,
];

export function isBotUserAgent(userAgent?: string | null): boolean {
  if (!userAgent) return false;
  return BOT_PATTERNS.some((pattern) => pattern.test(userAgent));
}

export function generateDailyIpHash(rawIp: string, customSalt?: string): string {
  const salt = customSalt || new Date().toISOString().slice(0, 10);
  return crypto.createHash('sha256').update(`${rawIp}-${salt}`).digest('hex').slice(0, 16);
}

export function detectDevice(userAgent?: string | null): 'mobile' | 'tablet' | 'desktop' {
  if (!userAgent) return 'desktop';
  const ua = userAgent.toLowerCase();
  if (/ipad|tablet|(android(?!.*mobile))/i.test(ua)) {
    return 'tablet';
  }
  if (/mobi|ipod|iphone|android|blackberry|opera mini|iemobile/i.test(ua)) {
    return 'mobile';
  }
  return 'desktop';
}
