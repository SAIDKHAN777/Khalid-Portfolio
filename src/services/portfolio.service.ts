import { prisma } from '@/lib/db';
import { invalidatePublicCache } from '@/lib/cache';
import type {
  SiteSettingsInput,
  UpdateSiteSettingsInput,
  SectionInput,
  UpdateSectionInput,
  ServiceInput,
  UpdatePortfolioServiceInput,
  WorkInput,
  UpdateWorkInput,
} from '@/lib/validators/portfolio';

export class PortfolioService {
  // ==================== SITE SETTINGS ====================
  async getSettings() {
    return await prisma.siteSettings.findUnique({
      where: { id: 'default' },
    });
  }

  async updateSettings(data: UpdateSiteSettingsInput) {
    const result = await prisma.siteSettings.upsert({
      where: { id: 'default' },
      update: data,
      create: {
        id: 'default',
        heroGreeting: data.heroGreeting || 'Hello',
        heroIntro:
          data.heroIntro ||
          'My name is Khalid. I work as an AI Engineer, AI Automation Expert and Full Stack Developer, building software apps, backend systems, AI platforms and personal AI agents.',
        heroPhotoUrl: data.heroPhotoUrl,
        ownerName: data.ownerName || 'Khalid',
        aboutTitle: data.aboutTitle || 'About Khalid',
        aboutBio: data.aboutBio,
        aboutBioParagraph1:
          data.aboutBioParagraph1 ||
          'I am Khalid, an AI Engineer, Creative Motion Technologist, and Full Stack Developer. Over the past several years, I have worked across the convergence of engineering rigour and cinematic media production—building intelligent software systems, resilient backend architectures, and high-retention digital media for modern brands and platforms worldwide.',
        aboutBioParagraph2:
          data.aboutBioParagraph2 ||
          'My work centres on turning complex creative visions into seamless, high-performance digital experiences. Whether architecting autonomous AI agent pipelines, engineering buttery 60fps interactive web portfolios, or directing commercial video edits and brand identities, I treat every project with extreme precision, narrative rhythm, and uncompromising craft.',
        aboutBioParagraph3:
          data.aboutBioParagraph3 ||
          'I believe technology should elevate human storytelling, not distract from it. From raw system design to the final rendered frame, my focus is always on delivering measurable business impact and memorable visual delight.',
        socialProfiles: data.socialProfiles,
        aboutYoutubeUrl: data.aboutYoutubeUrl || 'https://youtube.com',
        aboutFacebookUrl: data.aboutFacebookUrl || 'https://facebook.com',
        aboutLinkedinUrl: data.aboutLinkedinUrl || 'https://linkedin.com',
        aboutGithubUrl: data.aboutGithubUrl || 'https://github.com',
        aboutXUrl: data.aboutXUrl || 'https://x.com',
        footerHeadline: data.footerHeadline || 'Connect with us',
        footerSubline: data.footerSubline || "Have a project in mind? Let's make it happen.",
        contactButtonLabel: data.contactButtonLabel || 'Contact Us ->',
        contactUrl: data.contactUrl || 'mailto:contact@khalid.dev',
        footerCopyright: data.footerCopyright || '© 2026 Khalid. All rights reserved.',
        seoTitle: data.seoTitle || 'Khalid | AI Engineer & Full Stack Developer',
        seoDescription:
          data.seoDescription ||
          'Personal portfolio of Khalid - AI Engineer, AI Automation Expert and Full Stack Developer.',
        ogImageUrl: data.ogImageUrl,
      },
    });
    invalidatePublicCache();
    return result;
  }

  // ==================== SECTIONS ====================
  async getSections() {
    return await prisma.section.findMany({
      orderBy: { order: 'asc' },
      include: {
        _count: {
          select: { works: true, services: true },
        },
      },
    });
  }

  async getSectionById(id: string) {
    return await prisma.section.findUnique({
      where: { id },
      include: { works: true, services: true },
    });
  }

  async createSection(data: SectionInput) {
    const result = await prisma.section.create({
      data: {
        slug: data.slug,
        title: data.title,
        order: data.order ?? 0,
        isVisible: data.isVisible ?? true,
      },
    });
    invalidatePublicCache();
    return result;
  }

  async updateSection(id: string, data: UpdateSectionInput) {
    const result = await prisma.section.update({
      where: { id },
      data,
    });
    invalidatePublicCache();
    return result;
  }

  async deleteSection(id: string) {
    const result = await prisma.section.delete({
      where: { id },
    });
    invalidatePublicCache();
    return result;
  }

  async reorderSections(orderedIds: string[]) {
    const transactions = orderedIds.map((id, index) =>
      prisma.section.update({
        where: { id },
        data: { order: index + 1 },
      })
    );
    const result = await prisma.$transaction(transactions);
    invalidatePublicCache();
    return result;
  }

  // ==================== SERVICES ====================
  async getServices() {
    return await prisma.service.findMany({
      orderBy: { order: 'asc' },
      include: { section: true },
    });
  }

  async createService(data: ServiceInput) {
    const result = await prisma.service.create({
      data: {
        title: data.title,
        order: data.order ?? 0,
        sectionId: data.sectionId || null,
        isVisible: data.isVisible ?? true,
        description: data.description,
        icon: data.icon,
      },
    });
    invalidatePublicCache();
    return result;
  }

  async updateService(id: string, data: UpdatePortfolioServiceInput) {
    const result = await prisma.service.update({
      where: { id },
      data,
    });
    invalidatePublicCache();
    return result;
  }

  async deleteService(id: string) {
    const result = await prisma.service.delete({
      where: { id },
    });
    invalidatePublicCache();
    return result;
  }

  async reorderServices(orderedIds: string[]) {
    const transactions = orderedIds.map((id, index) =>
      prisma.service.update({
        where: { id },
        data: { order: index + 1 },
      })
    );
    const result = await prisma.$transaction(transactions);
    invalidatePublicCache();
    return result;
  }

  // ==================== WORKS ====================
  async getWorks(filter?: { sectionId?: string; isPublished?: boolean }) {
    const where: any = {};
    if (filter?.sectionId) where.sectionId = filter.sectionId;
    if (filter?.isPublished !== undefined) where.isPublished = filter.isPublished;

    return await prisma.work.findMany({
      where,
      orderBy: { order: 'asc' },
      include: { section: true },
    });
  }

  async getWorkById(id: string) {
    return await prisma.work.findUnique({
      where: { id },
      include: { section: true },
    });
  }

  async createWork(data: WorkInput) {
    const result = await prisma.work.create({
      data: {
        sectionId: data.sectionId,
        title: data.title,
        subtitle: data.subtitle,
        tags: JSON.stringify(data.tags ?? []),
        mediaType: data.mediaType,
        mediaUrl: data.mediaUrl,
        posterUrl: data.posterUrl,
        fallbackColorA: data.fallbackColorA,
        fallbackColorB: data.fallbackColorB,
        focalX: data.focalX ?? 50,
        focalY: data.focalY ?? 50,
        altText: data.altText,
        linkLabel: data.linkLabel,
        linkUrl: data.linkUrl,
        order: data.order ?? 0,
        isPublished: data.isPublished ?? true,
        isPinned: data.isPinned ?? true,
      },
    });
    invalidatePublicCache();
    return result;
  }

  async updateWork(id: string, data: UpdateWorkInput) {
    const { tags, ...rest } = data;
    const result = await prisma.work.update({
      where: { id },
      data: {
        ...rest,
        ...(tags !== undefined ? { tags: JSON.stringify(tags) } : {}),
      },
    });
    invalidatePublicCache();
    return result;
  }

  async deleteWork(id: string) {
    const result = await prisma.work.delete({
      where: { id },
    });
    invalidatePublicCache();
    return result;
  }

  async duplicateWork(id: string) {
    const original = await this.getWorkById(id);
    if (!original) throw new Error('Work not found');

    const highestOrderWork = await prisma.work.findFirst({
      where: { sectionId: original.sectionId },
      orderBy: { order: 'desc' },
    });

    const newOrder = (highestOrderWork?.order || 0) + 1;

    const result = await prisma.work.create({
      data: {
        sectionId: original.sectionId,
        title: `${original.title} (Copy)`,
        subtitle: original.subtitle,
        tags: original.tags,
        mediaType: original.mediaType,
        mediaUrl: original.mediaUrl,
        posterUrl: original.posterUrl,
        fallbackColorA: original.fallbackColorA,
        fallbackColorB: original.fallbackColorB,
        focalX: original.focalX,
        focalY: original.focalY,
        altText: original.altText,
        linkLabel: original.linkLabel,
        linkUrl: original.linkUrl,
        order: newOrder,
        isPublished: false, // Draft by default
        isPinned: original.isPinned,
      },
    });
    invalidatePublicCache();
    return result;
  }

  async reorderWorks(orderedIds: string[]) {
    const transactions = orderedIds.map((id, index) =>
      prisma.work.update({
        where: { id },
        data: { order: index + 1 },
      })
    );
    const result = await prisma.$transaction(transactions);
    invalidatePublicCache();
    return result;
  }

  // ==================== DASHBOARD METRICS ====================
  async getDashboardCounts() {
    const [sectionsCount, worksCount, publishedWorksCount, pinnedWorksCount, servicesCount] =
      await Promise.all([
        prisma.section.count(),
        prisma.work.count(),
        prisma.work.count({ where: { isPublished: true } }),
        prisma.work.count({ where: { isPinned: true } }),
        prisma.service.count(),
      ]);

    return {
      sectionsCount,
      worksCount,
      publishedWorksCount,
      pinnedWorksCount,
      unpublishedWorksCount: worksCount - publishedWorksCount,
      servicesCount,
    };
  }
}

export const portfolioService = new PortfolioService();
