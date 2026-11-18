import prisma from './db';

export interface ProcessedImage {
  webpPath: string;
  avifPath: string;
  width: number;
  height: number;
}

export interface MediaDriver {
  uploadFile(file: Buffer, filename: string, mimeType: string): Promise<string>;
  deleteFile(fileUrl: string): Promise<void>;
}

export class D1MediaDriver implements MediaDriver {
  async uploadFile(file: Buffer, filename: string, mimeType: string): Promise<string> {
    const publicId = `upload_${Date.now()}_${filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const base64Data = file.toString('base64');
    const isPdf = mimeType === 'application/pdf';
    const mediaType = isPdf ? 'PDF' : mimeType.startsWith('image/') ? 'IMAGE' : 'OTHER';

    const record = await prisma.media.create({
      data: {
        url: '',
        publicId,
        type: mediaType,
        mimeType,
        size: file.length,
        alt: filename,
        folder: 'uploads',
        data: base64Data,
      },
    });

    const servedUrl = `/api/media/${record.id}`;
    await prisma.media.update({
      where: { id: record.id },
      data: { url: servedUrl },
    });

    return servedUrl;
  }

  async deleteFile(fileUrl: string): Promise<void> {
    const match = fileUrl.match(/\/api\/media\/([^/?#]+)/);
    if (!match) return;
    await prisma.media.delete({ where: { id: match[1] } }).catch(() => {});
  }
}

export async function processImage(
  inputBuffer: Buffer,
  baseFilename: string,
  mimeType = 'image/webp'
): Promise<ProcessedImage> {
  const driver = new D1MediaDriver();
  const servedUrl = await driver.uploadFile(inputBuffer, `${baseFilename}`, mimeType);

  return {
    webpPath: servedUrl,
    avifPath: servedUrl,
    width: 0,
    height: 0,
  };
}

export function getMediaDriver(): MediaDriver {
  return new D1MediaDriver();
}
