import prisma from '@/lib/db';
import type {
  ContactQuery,
  SubmitContactInput,
  UpdateContactMessageInput,
} from '@/lib/validators/contact';
import type { MessageStatus, Prisma } from '@prisma/client';
import { generateDailyIpHash } from '@/lib/analytics';
import { logger } from '@/lib/logger';
import { captureServerError } from '@/lib/sentry';
import { AppError } from '@/lib/errorHandler';

export class ContactService {
  async listMessages(query: ContactQuery) {
    const { page, limit, status, isRead, search } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ContactMessageWhereInput = {};

    if (status) {
      where.status = status;
    } else if (isRead !== undefined) {
      where.status = isRead ? { not: 'NEW' } : 'NEW';
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { subject: { contains: search } },
      ];
    }

    try {
      const [messages, total] = await Promise.all([
        prisma.contactMessage.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.contactMessage.count({ where }),
      ]);

      return {
        messages,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error({ error, query }, 'Failed to list contact messages');
      captureServerError(error, { service: 'ContactService.listMessages' });
      throw error;
    }
  }

  async getMessageById(id: string) {
    const message = await prisma.contactMessage.findUnique({
      where: { id },
    });

    if (!message) {
      throw new AppError('Contact message not found', 404, 'NOT_FOUND');
    }

    return message;
  }

  async createMessage(
    input: SubmitContactInput & { ipHash?: string; rawIp?: string; userAgent?: string }
  ) {
    try {
      const resolvedIpHash =
        input.ipHash || (input.rawIp ? generateDailyIpHash(input.rawIp) : null);
      return await prisma.contactMessage.create({
        data: {
          name: input.name,
          email: input.email,
          subject: input.subject,
          message: input.message,
          ipHash: resolvedIpHash,
          userAgent: input.userAgent || null,
          status: 'NEW',
        },
      });
    } catch (error) {
      logger.error({ error, email: input.email }, 'Failed to create contact message');
      captureServerError(error, { service: 'ContactService.createMessage' });
      throw error;
    }
  }

  async updateMessage(id: string, input: UpdateContactMessageInput) {
    let status = input.status;
    if (!status && input.isRead !== undefined) {
      status = input.isRead ? 'READ' : 'NEW';
    }

    try {
      return await prisma.contactMessage.update({
        where: { id },
        data: status ? { status } : {},
      });
    } catch (error: any) {
      if (error?.code === 'P2025') {
        throw new AppError('Contact message not found', 404, 'NOT_FOUND');
      }
      logger.error({ error, id }, 'Failed to update contact message');
      captureServerError(error, { service: 'ContactService.updateMessage', id });
      throw error;
    }
  }

  async deleteMessage(id: string) {
    try {
      return await prisma.contactMessage.delete({
        where: { id },
      });
    } catch (error: any) {
      if (error?.code === 'P2025') {
        throw new AppError('Contact message not found', 404, 'NOT_FOUND');
      }
      logger.error({ error, id }, 'Failed to delete contact message');
      captureServerError(error, { service: 'ContactService.deleteMessage', id });
      throw error;
    }
  }
}

export const contactService = new ContactService();
export default contactService;
