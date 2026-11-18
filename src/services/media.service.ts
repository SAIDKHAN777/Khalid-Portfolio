import prisma from '@/lib/db';
import { uploadBufferToCloudinary, deleteFromCloudinary } from '@/lib/cloudinary';
import { validateFileUpload, type MediaQuery } from '@/lib/validators/media';
import { logger } from '@/lib/logger';
import { captureServerError } from '@/lib/sentry';
import { AppError } from '@/lib/errorHandler';
import type { MediaType, Prisma } from '@prisma/client';

export class MediaService {
  async uploadMedia(
    buffer: Buffer,
    fileInfo: {
      filename: string;
      mimeType: string;
      size: number;
      altText?: string;
      folder?: string;
    }
  ) {
    const { filename, mimeType, size, altText, folder = 'portfolio' } = fileInfo;

    // 1. Validate file type and size
    const validation = validateFileUpload({ name: filename, type: mimeType, size });
    if (!validation.valid) {
      throw new AppError(validation.error || 'Invalid file', 400, 'VALIDATION_ERROR');
    }

    const isPdf = mimeType === 'application/pdf';
    const resourceType = isPdf ? 'raw' : 'image';
    const mediaType: MediaType = isPdf ? 'PDF' : mimeType.startsWith('image/') ? 'IMAGE' : 'OTHER';

    // 2. Upload to Cloudinary
    const uploadResult = await uploadBufferToCloudinary(buffer, {
      folder,
      resourceType,
    });

    try {
      // 3. Store record in Media table with base64 data for D1 serving
      const media = await prisma.media.create({
        data: {
          url: uploadResult.secureUrl || uploadResult.url,
          publicId: uploadResult.publicId,
          type: mediaType,
          mimeType,
          size: size || uploadResult.bytes || 0,
          width: uploadResult.width || null,
          height: uploadResult.height || null,
          alt: altText || filename,
          folder,
          data: buffer.toString('base64'),
        },
      });

      // If a resume PDF was uploaded, link it automatically to SiteSetting
      if (
        isPdf ||
        filename.toLowerCase().includes('resume') ||
        filename.toLowerCase().includes('cv')
      ) {
        await prisma.siteSetting
          .update({
            where: { id: 'default' },
            data: { resumeUrl: media.url },
          })
          .catch(() => {});
      }

      logger.info(
        { mediaId: media.id, publicId: media.publicId },
        'Media uploaded and persisted successfully'
      );
      return media;
    } catch (error: any) {
      if (error?.code === 'P2002') {
        throw new AppError('A media file with this publicId already exists', 409, 'CONFLICT_ERROR');
      }
      logger.error({ error, filename }, 'Failed to save media metadata');
      captureServerError(error, { service: 'MediaService.uploadMedia' });
      throw error;
    }
  }

  async listMedia(query: MediaQuery) {
    const { page, limit, folder, type } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.MediaWhereInput = {};

    if (folder) where.folder = folder;
    if (type) where.type = type;

    try {
      const [mediaList, total] = await Promise.all([
        prisma.media.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.media.count({ where }),
      ]);

      return {
        media: mediaList,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error({ error, query }, 'Failed to list media');
      captureServerError(error, { service: 'MediaService.listMedia' });
      throw error;
    }
  }

  async getMediaById(id: string) {
    const media = await prisma.media.findUnique({ where: { id } });
    if (!media) {
      throw new AppError('Media not found', 404, 'NOT_FOUND');
    }
    return media;
  }

  async deleteMedia(id: string) {
    const media = await prisma.media.findUnique({ where: { id } });
    if (!media) {
      throw new AppError('Media not found', 404, 'NOT_FOUND');
    }

    const isPdf = media.type === 'PDF';
    try {
      await deleteFromCloudinary(media.publicId, isPdf ? 'raw' : 'image');
    } catch (err) {
      logger.warn({ err, publicId: media.publicId }, 'Cloudinary asset deletion returned warning');
    }

    try {
      return await prisma.media.delete({ where: { id } });
    } catch (error: any) {
      if (error?.code === 'P2025') {
        throw new AppError('Media not found', 404, 'NOT_FOUND');
      }
      logger.error({ error, id }, 'Failed to delete media record');
      captureServerError(error, { service: 'MediaService.deleteMedia', id });
      throw error;
    }
  }

  async recordResumeDownload(data: { ipHash?: string; userAgent?: string; referrer?: string }) {
    try {
      await prisma.resumeDownload.create({
        data: {
          visitorHash: data.ipHash || 'anonymous',
        },
      });

      const settings = await prisma.siteSetting.findUnique({
        where: { id: 'default' },
      });

      return (
        settings?.resumeUrl || 'https://res.cloudinary.com/demo/raw/upload/resume_said_khan.pdf'
      );
    } catch (error) {
      logger.error({ error }, 'Failed to record resume download');
      captureServerError(error, { service: 'MediaService.recordResumeDownload' });
      throw error;
    }
  }
}

export const mediaService = new MediaService();
export default mediaService;
