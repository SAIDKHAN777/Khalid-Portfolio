import prisma from '@/lib/db';
import {
  verifyPassword,
  generateSessionToken,
  hashSessionToken,
  MAX_FAILED_ATTEMPTS,
  LOCKOUT_DURATION_MS,
  SESSION_MAX_AGE_SECONDS,
} from '@/lib/auth';
import { generateDailyIpHash } from '@/lib/analytics';
import { logger } from '@/lib/logger';

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

export interface AuthSession {
  id: string;
  token: string;
  expiresAt: Date;
}

export class AuthService {
  async login(params: {
    email: string;
    password: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<{ user: AuthUser; session: AuthSession }> {
    const { email, password, ipAddress, userAgent } = params;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      logger.warn({ email, ipAddress }, 'Authentication failed: User not found');
      throw new Error('INVALID_CREDENTIALS');
    }

    // Check account lockout status
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const remainingSeconds = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 1000);
      logger.warn(
        { email, ipAddress, lockedUntil: user.lockedUntil },
        'Authentication rejected: Account temporarily locked due to repeated failures'
      );
      throw new Error(`ACCOUNT_LOCKED:${remainingSeconds}`);
    }

    // Verify password
    const passwordValid = await verifyPassword(user.passwordHash, password);

    if (!passwordValid) {
      const nextAttempts = user.failedLoginCount + 1;
      let lockedUntil: Date | null = null;

      if (nextAttempts >= MAX_FAILED_ATTEMPTS) {
        lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
        logger.warn(
          { email, ipAddress, nextAttempts, lockedUntil },
          'Account locked due to exceeding maximum failed login attempts'
        );
      } else {
        logger.warn(
          { email, ipAddress, attempt: nextAttempts, max: MAX_FAILED_ATTEMPTS },
          'Authentication failed: Incorrect password'
        );
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginCount: nextAttempts,
          lockedUntil,
        },
      });

      if (lockedUntil) {
        throw new Error('ACCOUNT_LOCKED:900');
      }

      throw new Error('INVALID_CREDENTIALS');
    }

    // Password valid -> Reset failed attempts and clear locks
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginCount: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
      },
    });

    // Generate cryptographic session token & hash for database persistence
    const token = generateSessionToken();
    const tokenHash = hashSessionToken(token);
    const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);

    const session = await prisma.session.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
        ipHash: ipAddress ? generateDailyIpHash(ipAddress) : undefined,
        userAgent,
      },
    });

    logger.info({ userId: user.id, email: user.email, ipAddress }, 'Admin logged in successfully');

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      session: {
        id: session.id,
        token,
        expiresAt: session.expiresAt,
      },
    };
  }

  async logout(token: string): Promise<boolean> {
    if (!token) return false;

    try {
      const tokenHash = hashSessionToken(token);
      await prisma.session.deleteMany({
        where: { tokenHash },
      });
      logger.info('User session revoked upon logout');
      return true;
    } catch (error) {
      logger.error({ error }, 'Failed to revoke session on logout');
      return false;
    }
  }

  async validateSession(token: string): Promise<{ user: AuthUser; session: AuthSession } | null> {
    if (!token) return null;

    const tokenHash = hashSessionToken(token);
    const session = await prisma.session.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!session) return null;

    // Check expiration
    if (session.expiresAt < new Date()) {
      await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
      return null;
    }

    return {
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: session.user.role,
      },
      session: {
        id: session.id,
        token,
        expiresAt: session.expiresAt,
      },
    };
  }
}

export const authService = new AuthService();
export default authService;
