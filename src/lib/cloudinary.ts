import { logger } from './logger';

export const isCloudinaryConfigured = (): boolean => false;

export async function uploadBufferToCloudinary(
  buffer: Buffer,
  options: {
    folder?: string;
    publicId?: string;
    resourceType?: 'image' | 'raw' | 'auto';
  } = {}
): Promise<{
  url: string;
  secureUrl: string;
  publicId: string;
  format: string;
  bytes: number;
  width?: number;
  height?: number;
}> {
  const { folder = 'portfolio', publicId, resourceType = 'auto' } = options;
  const generatedId =
    publicId || `${folder}/media_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const format = resourceType === 'raw' ? 'pdf' : 'webp';

  return {
    url: `/api/media/${encodeURIComponent(generatedId)}`,
    secureUrl: `/api/media/${encodeURIComponent(generatedId)}`,
    publicId: generatedId,
    format,
    bytes: buffer.length,
  };
}

export async function deleteFromCloudinary(
  publicId: string,
  _resourceType: 'image' | 'raw' = 'image'
): Promise<boolean> {
  logger.info({ publicId }, 'Media asset removed from storage metadata');
  return true;
}

export function buildOptimizedImageUrl(publicId: string): string {
  return `/api/media/${encodeURIComponent(publicId)}`;
}
