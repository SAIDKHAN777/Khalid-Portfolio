import { createHash } from 'node:crypto';

export const SESSION_COOKIE_NAME = 'portfolio_session';
export const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60; // 7 days
export const MAX_FAILED_ATTEMPTS = 5;
export const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

const PBKDF2_ITERATIONS = 100_000;
const SALT_BYTES = 16;
const HASH_BITS = 256;

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a[i] ^ b[i];
  }
  return diff === 0;
}

async function derivePbkdf2(password: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations,
      hash: 'SHA-256',
    },
    keyMaterial,
    HASH_BITS
  );

  return new Uint8Array(derivedBits);
}

export async function hashPassword(password: string): Promise<string> {
  const salt = new Uint8Array(SALT_BYTES);
  crypto.getRandomValues(salt);
  const derived = await derivePbkdf2(password, salt, PBKDF2_ITERATIONS);
  return `pbkdf2_sha256$${PBKDF2_ITERATIONS}$${bytesToHex(salt)}$${bytesToHex(derived)}`;
}

export async function verifyPassword(hash: string, plain: string): Promise<boolean> {
  try {
    const parts = hash.split('$');
    if (parts.length !== 4 || parts[0] !== 'pbkdf2_sha256') {
      return false;
    }
    const iterations = parseInt(parts[1], 10);
    if (!Number.isFinite(iterations) || iterations <= 0) return false;
    const salt = hexToBytes(parts[2]);
    const expected = hexToBytes(parts[3]);
    const actual = await derivePbkdf2(plain, salt, iterations);
    return constantTimeEqual(expected, actual);
  } catch {
    return false;
  }
}

export function generateSessionToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return bytesToHex(bytes);
}

export function hashSessionToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function getCookieOptions(isProduction = true) {
  return {
    path: '/',
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax' as const,
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}
