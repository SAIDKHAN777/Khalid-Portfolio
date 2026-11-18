import { prisma } from './db';
import { memoryCache, CACHE_KEYS } from './cache';
import type { SiteSettings, Service, Section, Work } from '@prisma/client';

export type PublicWork = Work & {
  tagsList: string[];
  hasMedia: boolean;
  computedTone: 'light' | 'dark';
};

export type PublicSectionWithWorks = Section & {
  works: PublicWork[];
};

type SectionWithPrismaWorks = Section & {
  works: Work[];
};

export type PublicPortfolioData = {
  settings: SiteSettings;
  services: Service[];
  sections: PublicSectionWithWorks[];
  isPreview: boolean;
};

const DEFAULT_SETTINGS: SiteSettings = {
  id: 'default',
  heroGreeting: 'Hello',
  heroIntro:
    'My name is Khalid. I work as an AI Engineer, AI Automation Expert and Full Stack Developer, building software apps, backend systems, AI platforms and personal AI agents.',
  heroPhotoUrl: '/images/khalid-cutout.png',
  ownerName: 'Khalid',
  aboutTitle: 'About Khalid',
  aboutBio:
    'I am Khalid, an AI Engineer, Creative Motion Technologist, and Full Stack Developer. Over the past several years, I have worked across the convergence of engineering rigour and cinematic media production—building intelligent software systems, resilient backend architectures, and high-retention digital media for modern brands and platforms worldwide.\n\nMy work centres on turning complex creative visions into seamless, high-performance digital experiences. Whether architecting autonomous AI agent pipelines, engineering buttery 60fps interactive web portfolios, or directing commercial video edits and brand identities, I treat every project with extreme precision, narrative rhythm, and uncompromising craft.\n\nI believe technology should elevate human storytelling, not distract from it. From raw system design to the final rendered frame, my focus is always on delivering measurable business impact and memorable visual delight.',
  aboutBioParagraph1:
    'I am Khalid, an AI Engineer, Creative Motion Technologist, and Full Stack Developer. Over the past several years, I have worked across the convergence of engineering rigour and cinematic media production—building intelligent software systems, resilient backend architectures, and high-retention digital media for modern brands and platforms worldwide.',
  aboutBioParagraph2:
    'My work centres on turning complex creative visions into seamless, high-performance digital experiences. Whether architecting autonomous AI agent pipelines, engineering buttery 60fps interactive web portfolios, or directing commercial video edits and brand identities, I treat every project with extreme precision, narrative rhythm, and uncompromising craft.',
  aboutBioParagraph3:
    'I believe technology should elevate human storytelling, not distract from it. From raw system design to the final rendered frame, my focus is always on delivering measurable business impact and memorable visual delight.',
  socialProfiles: [
    { id: '1', title: 'Facebook', url: 'https://facebook.com', logoUrl: '' },
    { id: '2', title: 'YouTube', url: 'https://youtube.com', logoUrl: '' },
    { id: '3', title: 'LinkedIn', url: 'https://linkedin.com', logoUrl: '' },
  ],
  aboutYoutubeUrl: 'https://youtube.com',
  aboutFacebookUrl: 'https://facebook.com',
  aboutLinkedinUrl: 'https://linkedin.com',
  aboutGithubUrl: 'https://github.com',
  aboutXUrl: 'https://x.com',
  footerHeadline: 'Connect with us',
  footerSubline: "Have a project in mind? Let's make it happen.",
  contactButtonLabel: 'Contact Us ->',
  contactUrl: 'mailto:contact@khalid.dev',
  footerCopyright: '© 2026 Khalid. All rights reserved.',
  seoTitle: 'Khalid | AI Engineer & Full Stack Developer',
  seoDescription:
    'Cinematic engineering portfolio of Khalid — AI Systems, Autonomous Agents, Full Stack Development and Motion Engineering.',
  ogImageUrl: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

/**
 * Server-side loader for Site Settings with in-memory caching.
 */
export async function getSiteSettings(): Promise<SiteSettings> {
  const cached = memoryCache.get<SiteSettings>(CACHE_KEYS.SETTINGS);
  if (cached) return cached;

  const settings = await prisma.siteSettings.findFirst();
  const result = settings || DEFAULT_SETTINGS;

  memoryCache.set(CACHE_KEYS.SETTINGS, result);
  return result;
}

/**
 * Server-side loader for visible services ordered by display sequence.
 */
export async function getServices(): Promise<Service[]> {
  const cached = memoryCache.get<Service[]>(CACHE_KEYS.SERVICES);
  if (cached) return cached;

  const services = await prisma.service.findMany({
    where: { isVisible: true },
    orderBy: { order: 'asc' },
  });

  memoryCache.set(CACHE_KEYS.SERVICES, services);
  return services;
}

/**
 * Server-side loader for visible sections and their works.
 *
 * Rules:
 * 1. Only visible sections are queried (`isVisible: true`).
 * 2. In public mode, only published works are included (`isPublished: true`).
 * 3. In preview mode (`preview: true`), unpublished draft works are also included.
 * 4. Empty state rule: any section with 0 works (or 0 published works) is skipped.
 * 5. Media fallback rule: if mediaUrl is missing, fallback colours are guaranteed.
 */
export async function getSectionsWithWorks(options?: {
  preview?: boolean;
  pinnedOnly?: boolean;
}): Promise<PublicSectionWithWorks[]> {
  const isPreview = Boolean(options?.preview);
  const pinnedOnly = options?.pinnedOnly !== undefined ? options.pinnedOnly : true;
  const cacheKey = `${isPreview ? CACHE_KEYS.SECTIONS_PREVIEW : CACHE_KEYS.SECTIONS_PUBLIC}:${pinnedOnly ? 'pinned' : 'all'}`;

  const cached = memoryCache.get<PublicSectionWithWorks[]>(cacheKey);
  if (cached) return cached;

  const sections = await prisma.section.findMany({
    where: { isVisible: true },
    orderBy: { order: 'asc' },
    include: {
      works: {
        where: isPreview
          ? (pinnedOnly ? { isPinned: true } : undefined)
          : { isPublished: true, ...(pinnedOnly ? { isPinned: true } : {}) },
        orderBy: { order: 'asc' },
      },
    },
  });

  // Filter out empty sections: sections with no published works must be skipped entirely
  const populatedSections: PublicSectionWithWorks[] = (sections as SectionWithPrismaWorks[])
    .filter((section: SectionWithPrismaWorks) => section.works.length > 0)
    .map((section: SectionWithPrismaWorks) => ({
      ...section,
      works: section.works.map((work: Work) => {
        let tagsList: string[] = [];
        try {
          if (Array.isArray(work.tags)) {
            tagsList = work.tags as string[];
          } else if (typeof work.tags === 'string') {
            tagsList = JSON.parse(work.tags);
          }
        } catch {
          tagsList = [];
        }

        const hasMedia = Boolean(work.mediaUrl && work.mediaUrl.trim().length > 0);

        return {
          ...work,
          tagsList,
          hasMedia,
          fallbackColorA: work.fallbackColorA || '#1E1E24',
          fallbackColorB: work.fallbackColorB || '#2A2A35',
          computedTone: 'dark' as const,
        };
      }),
    }));

  memoryCache.set(cacheKey, populatedSections);
  return populatedSections;
}

/**
 * Combined loader providing full public page data in one call.
 */
export async function getPortfolioData(options?: {
  preview?: boolean;
  pinnedOnly?: boolean;
}): Promise<PublicPortfolioData> {
  const isPreview = Boolean(options?.preview);
  const pinnedOnly = options?.pinnedOnly !== undefined ? options.pinnedOnly : true;
  const cacheKey = `${
    isPreview ? CACHE_KEYS.PORTFOLIO_BUNDLE_PREVIEW : CACHE_KEYS.PORTFOLIO_BUNDLE_PUBLIC
  }:${pinnedOnly ? 'pinned' : 'all'}`;

  const cached = memoryCache.get<PublicPortfolioData>(cacheKey);
  if (cached) return cached;

  const [settings, services, sections] = await Promise.all([
    getSiteSettings(),
    getServices(),
    getSectionsWithWorks({ preview: isPreview, pinnedOnly }),
  ]);

  const bundle: PublicPortfolioData = {
    settings,
    services,
    sections,
    isPreview,
  };

  memoryCache.set(cacheKey, bundle);
  return bundle;
}
