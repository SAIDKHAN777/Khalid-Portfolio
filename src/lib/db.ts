import { PrismaClient } from '@prisma/client';
import { PrismaD1 } from '@prisma/adapter-d1';
import { env } from 'cloudflare:workers';
import { logger } from './logger';
import { captureServerError } from './sentry';

type D1Binding = ConstructorParameters<typeof PrismaD1>[0];

function buildExtendedClient(d1Database: D1Binding) {
  const adapter = new PrismaD1(d1Database);
  const baseClient = new PrismaClient({ adapter });

  return baseClient.$extends({
    name: 'soft-delete',
    query: {
      project: {
        async findMany({ args, query }) {
          if (args.where?.deletedAt === undefined) {
            args.where = { ...args.where, deletedAt: null };
          }
          return query(args);
        },
        async findFirst({ args, query }) {
          if (args.where?.deletedAt === undefined) {
            args.where = { ...args.where, deletedAt: null };
          }
          return query(args);
        },
        async count({ args, query }) {
          if (args.where?.deletedAt === undefined) {
            args.where = { ...args.where, deletedAt: null };
          }
          return query(args);
        },
      },
      blogPost: {
        async findMany({ args, query }) {
          if (args.where?.deletedAt === undefined) {
            args.where = { ...args.where, deletedAt: null };
          }
          return query(args);
        },
        async findFirst({ args, query }) {
          if (args.where?.deletedAt === undefined) {
            args.where = { ...args.where, deletedAt: null };
          }
          return query(args);
        },
        async count({ args, query }) {
          if (args.where?.deletedAt === undefined) {
            args.where = { ...args.where, deletedAt: null };
          }
          return query(args);
        },
      },
    },
  });
}

export type ExtendedPrismaClient = ReturnType<typeof buildExtendedClient>;

function getActiveClient(): ExtendedPrismaClient {
  const dbBinding = (env as unknown as { DB?: D1Binding }).DB;
  if (!dbBinding) {
    throw new Error('Cloudflare D1 binding "DB" is not available in the runtime environment.');
  }
  return buildExtendedClient(dbBinding);
}

export const prisma: ExtendedPrismaClient = new Proxy({} as ExtendedPrismaClient, {
  get(_target, prop, receiver) {
    const client = getActiveClient();
    const value = Reflect.get(client, prop, receiver);
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  },
});

export async function checkDatabaseHealth(): Promise<{
  status: 'ok' | 'fail';
  latencyMs: number;
  error?: string;
}> {
  const startTime = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    const latencyMs = Date.now() - startTime;
    return { status: 'ok', latencyMs };
  } catch (err: unknown) {
    const latencyMs = Date.now() - startTime;
    const errorMessage = err instanceof Error ? err.message : String(err);
    logger.error({ err: errorMessage }, `Database health check failed: ${errorMessage}`);
    captureServerError(err, { check: 'health-check', latencyMs });
    return { status: 'fail', latencyMs, error: errorMessage };
  }
}

export default prisma;
