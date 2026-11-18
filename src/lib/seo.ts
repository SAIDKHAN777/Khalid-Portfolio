import { env } from './env';

export interface SeoProps {
  title?: string;
  description?: string;
  image?: string;
  canonicalUrl?: string;
  type?: 'website' | 'article' | 'profile';
  noindex?: boolean;
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  tags?: string[];
}

export function getBaseUrl(requestUrl?: string): string {
  if (requestUrl) {
    try {
      const parsed = new URL(requestUrl);
      return `${parsed.protocol}//${parsed.host}`;
    } catch {
      // ignore
    }
  }
  return env.SITE_URL || 'https://saidkhan.dev';
}

export function buildPersonSchema(params: {
  name: string;
  title: string;
  bio?: string | null;
  url: string;
  email?: string | null;
  githubUrl?: string | null;
  linkedinUrl?: string | null;
  twitterUrl?: string | null;
}) {
  const sameAs: string[] = [];
  if (params.githubUrl) sameAs.push(params.githubUrl);
  if (params.linkedinUrl) sameAs.push(params.linkedinUrl);
  if (params.twitterUrl) sameAs.push(params.twitterUrl);

  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: params.name,
    jobTitle: params.title,
    description: params.bio || undefined,
    url: params.url,
    email: params.email ? `mailto:${params.email}` : undefined,
    sameAs: sameAs.length > 0 ? sameAs : undefined,
  };
}

export function buildBlogPostingSchema(params: {
  title: string;
  description: string;
  url: string;
  imageUrl?: string | null;
  datePublished?: string | null;
  dateModified?: string | null;
  authorName: string;
  authorUrl?: string;
  tags?: string[];
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': params.url,
    },
    headline: params.title,
    description: params.description,
    image: params.imageUrl || undefined,
    datePublished: params.datePublished || undefined,
    dateModified: params.dateModified || params.datePublished || undefined,
    author: {
      '@type': 'Person',
      name: params.authorName,
      url: params.authorUrl || undefined,
    },
    keywords: params.tags && params.tags.length > 0 ? params.tags.join(', ') : undefined,
  };
}

export function buildProjectSchema(params: {
  title: string;
  description: string;
  url: string;
  liveDemoUrl?: string | null;
  githubUrl?: string | null;
  imageUrl?: string | null;
  authorName: string;
  techStack?: string[];
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: params.title,
    description: params.description,
    url: params.url,
    image: params.imageUrl || undefined,
    applicationCategory: 'WebApplication',
    operatingSystem: 'All',
    author: {
      '@type': 'Person',
      name: params.authorName,
    },
    keywords:
      params.techStack && params.techStack.length > 0 ? params.techStack.join(', ') : undefined,
  };
}

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export function buildBreadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
