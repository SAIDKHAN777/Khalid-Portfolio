import { prisma } from '../lib/db';
import { isBotUserAgent, generateDailyIpHash, detectDevice } from '../lib/analytics';
import { logger } from '../lib/logger';
import { captureServerError } from '../lib/sentry';
import { AppError } from '../lib/errorHandler';
import type { ClickType } from '@prisma/client';

export interface TrackPageViewParams {
  path: string;
  referrer?: string | null;
  rawIp: string;
  userAgent?: string | null;
  country?: string | null;
}

export interface TrackProjectClickParams {
  projectId: string;
  clickType: 'LIVE' | 'GITHUB' | 'DETAILS' | 'LIVE_DEMO';
  rawIp?: string;
  userAgent?: string | null;
}

export class AnalyticsService {
  /**
   * Track a page view.
   * IP is hashed with daily salt for privacy into visitorHash.
   * Device is extracted and stored.
   */
  async trackPageView(params: TrackPageViewParams) {
    const isBot = isBotUserAgent(params.userAgent);
    const visitorHash = generateDailyIpHash(params.rawIp);
    const device = detectDevice(params.userAgent);

    try {
      const view = await prisma.pageView.create({
        data: {
          path: params.path,
          referrer: params.referrer || null,
          country: params.country || null,
          device,
          visitorHash,
        },
      });

      return {
        id: view.id,
        path: view.path,
        createdAt: view.createdAt,
        isBot,
      };
    } catch (error) {
      logger.error({ error, path: params.path }, 'Failed to record page view');
      captureServerError(error, { service: 'AnalyticsService.trackPageView' });
      throw error;
    }
  }

  /**
   * Track a project click (Live, GitHub, or Details).
   */
  async trackProjectClick(params: TrackProjectClickParams) {
    const project = await prisma.project.findFirst({
      where: { id: params.projectId, deletedAt: null },
      select: { id: true, title: true, slug: true },
    });

    if (!project) {
      throw new AppError(`Project with ID ${params.projectId} not found`, 404, 'NOT_FOUND');
    }

    const type: ClickType =
      params.clickType === 'LIVE_DEMO' ? 'LIVE' : (params.clickType as ClickType);

    try {
      const click = await prisma.projectClick.create({
        data: {
          projectId: params.projectId,
          type,
        },
      });

      return {
        id: click.id,
        projectId: click.projectId,
        clickType: params.clickType,
        projectTitle: project.title,
        createdAt: click.createdAt,
      };
    } catch (error) {
      logger.error({ error, projectId: params.projectId }, 'Failed to record project click');
      captureServerError(error, { service: 'AnalyticsService.trackProjectClick' });
      throw error;
    }
  }

  /**
   * Track a resume download event with hashed visitor IP.
   */
  async trackResumeDownload(params: { rawIp: string; userAgent?: string | null }) {
    const isBot = isBotUserAgent(params.userAgent);
    const visitorHash = generateDailyIpHash(params.rawIp);

    try {
      const download = await prisma.resumeDownload.create({
        data: {
          visitorHash,
        },
      });

      return {
        id: download.id,
        createdAt: download.createdAt,
        isBot,
      };
    } catch (error) {
      logger.error({ error }, 'Failed to record resume download');
      captureServerError(error, { service: 'AnalyticsService.trackResumeDownload' });
      throw error;
    }
  }

  /**
   * Aggregate statistics for the admin dashboard.
   */
  async getAdminStats(range: '7d' | '30d' | '90d' | 'all' = '30d') {
    const now = new Date();
    let startDate: Date;

    switch (range) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'all':
        startDate = new Date(0);
        break;
      case '30d':
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
    }

    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    try {
      // 1. Total views in range & today
      const [rangeViews, todayViews] = await Promise.all([
        prisma.pageView.count({
          where: {
            createdAt: { gte: startDate },
          },
        }),
        prisma.pageView.count({
          where: {
            createdAt: { gte: todayStart },
          },
        }),
      ]);

      // 2. Views per day time-series & device counts
      const viewsInRange = await prisma.pageView.findMany({
        where: {
          createdAt: { gte: startDate },
        },
        select: {
          createdAt: true,
          device: true,
        },
        orderBy: { createdAt: 'asc' },
      });

      const dayMap = new Map<string, number>();
      const deviceCounts: Record<string, number> = { desktop: 0, mobile: 0, tablet: 0 };

      for (const v of viewsInRange) {
        const dateKey = v.createdAt.toISOString().slice(0, 10);
        dayMap.set(dateKey, (dayMap.get(dateKey) || 0) + 1);

        const dev = v.device || 'desktop';
        deviceCounts[dev] = (deviceCounts[dev] || 0) + 1;
      }

      const viewsPerDay = Array.from(dayMap.entries()).map(([date, views]) => ({
        date,
        views,
      }));

      // 3. Top pages
      const topPagesGroup = await prisma.pageView.groupBy({
        by: ['path'],
        where: {
          createdAt: { gte: startDate },
        },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      });

      const topPages = topPagesGroup.map((item) => ({
        path: item.path,
        views: item._count.id,
      }));

      // 4. Top projects by clicks
      const projectClicksGroup = await prisma.projectClick.groupBy({
        by: ['projectId', 'type'],
        where: {
          createdAt: { gte: startDate },
        },
        _count: { id: true },
      });

      const projectIds = Array.from(new Set(projectClicksGroup.map((c) => c.projectId)));
      const projects = await prisma.project.findMany({
        where: { id: { in: projectIds } },
        select: { id: true, title: true, slug: true },
      });
      const projectMap = new Map(projects.map((p) => [p.id, p]));

      const projectClickAgg = new Map<
        string,
        {
          projectId: string;
          title: string;
          slug: string;
          liveDemoClicks: number;
          githubClicks: number;
          detailsClicks: number;
          totalClicks: number;
        }
      >();

      for (const c of projectClicksGroup) {
        const p = projectMap.get(c.projectId);
        if (!p) continue;

        if (!projectClickAgg.has(c.projectId)) {
          projectClickAgg.set(c.projectId, {
            projectId: c.projectId,
            title: p.title,
            slug: p.slug,
            liveDemoClicks: 0,
            githubClicks: 0,
            detailsClicks: 0,
            totalClicks: 0,
          });
        }

        const agg = projectClickAgg.get(c.projectId)!;
        if (c.type === 'LIVE') {
          agg.liveDemoClicks += c._count.id;
        } else if (c.type === 'GITHUB') {
          agg.githubClicks += c._count.id;
        } else if (c.type === 'DETAILS') {
          agg.detailsClicks += c._count.id;
        }
        agg.totalClicks += c._count.id;
      }

      const topProjects = Array.from(projectClickAgg.values()).sort(
        (a, b) => b.totalClicks - a.totalClicks
      );

      // 5. Views by country
      const countryGroup = await prisma.pageView.groupBy({
        by: ['country'],
        where: {
          createdAt: { gte: startDate },
        },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      });

      const viewsByCountry = countryGroup.map((item) => ({
        country: item.country || 'Unknown',
        views: item._count.id,
      }));

      // 6. Total all-time stats
      const [totalViewsAllTime, totalClicksAllTime, totalDownloadsAllTime, totalMessagesAllTime] =
        await Promise.all([
          prisma.pageView.count(),
          prisma.projectClick.count(),
          prisma.resumeDownload.count(),
          prisma.contactMessage.count(),
        ]);

      return {
        range,
        startDate: startDate.toISOString(),
        views: {
          totalInRange: rangeViews,
          today: todayViews,
          viewsPerDay,
        },
        topPages,
        topProjects,
        viewsByCountry,
        viewsByDevice: deviceCounts,
        totalStats: {
          views: totalViewsAllTime,
          clicks: totalClicksAllTime,
          downloads: totalDownloadsAllTime,
          messages: totalMessagesAllTime,
        },
      };
    } catch (error) {
      logger.error({ error, range }, 'Failed to compute admin analytics stats');
      captureServerError(error, { service: 'AnalyticsService.getAdminStats' });
      throw error;
    }
  }

  /**
   * Purge raw PageView logs older than retentionDays (default 90 days).
   */
  async cleanupOldAnalytics(retentionDays = 90) {
    const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
    logger.info({ retentionDays, cutoffDate }, 'Cleaning up old raw PageView logs');

    try {
      const result = await prisma.pageView.deleteMany({
        where: {
          createdAt: { lt: cutoffDate },
        },
      });

      logger.info({ deletedCount: result.count }, 'Old PageView cleanup completed');
      return {
        deletedCount: result.count,
        cutoffDate: cutoffDate.toISOString(),
      };
    } catch (error) {
      logger.error({ error, cutoffDate }, 'Failed to clean up old analytics');
      captureServerError(error, { service: 'AnalyticsService.cleanupOldAnalytics' });
      throw error;
    }
  }
}

export const analyticsService = new AnalyticsService();
