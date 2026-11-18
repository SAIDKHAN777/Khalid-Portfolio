import prisma from '@/lib/db';
import { slugify } from '@/lib/slug';
import type {
  PaginationQuery,
  CreateProjectInput,
  UpdateProjectInput,
} from '@/lib/validators/content';
import type { Prisma } from '@prisma/client';
import { logger } from '@/lib/logger';
import { captureServerError } from '@/lib/sentry';
import { AppError } from '@/lib/errorHandler';

function parseStringArray(val: unknown): string[] {
  if (Array.isArray(val)) return val.map(String);
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      return [];
    }
  }
  return [];
}

function hydrateProject<T extends { images: unknown; techStack: unknown }>(
  project: T
): Omit<T, 'images' | 'techStack'> & { images: string[]; techStack: string[] } {
  return {
    ...project,
    images: parseStringArray(project.images),
    techStack: parseStringArray(project.techStack),
  };
}

export class ProjectService {
  async listProjects(query: PaginationQuery, isAdmin = false) {
    const { page, limit, search, category, featured, status, includeDrafts } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ProjectWhereInput = {
      deletedAt: null,
    };

    // Public views strictly see PUBLISHED records
    if (!isAdmin && !includeDrafts) {
      where.status = 'PUBLISHED';
    } else if (status) {
      where.status = status;
    }

    if (featured !== undefined) {
      where.isFeatured = featured;
    }

    if (category) {
      where.category = { slug: category };
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { shortDescription: { contains: search } },
        { techStack: { contains: search } },
      ];
    }

    try {
      const [projects, total] = await Promise.all([
        prisma.project.findMany({
          where,
          skip,
          take: limit,
          orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
          select: {
            id: true,
            title: true,
            slug: true,
            shortDescription: true,
            fullDescription: true,
            thumbnailUrl: true,
            images: true,
            techStack: true,
            liveUrl: true,
            githubUrl: true,
            categoryId: true,
            isFeatured: true,
            order: true,
            status: true,
            publishedAt: true,
            createdAt: true,
            updatedAt: true,
            category: {
              select: { id: true, name: true, slug: true },
            },
            _count: {
              select: { clicks: true },
            },
          },
        }),
        prisma.project.count({ where }),
      ]);

      return {
        projects: projects.map(hydrateProject),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error({ error, query }, 'Failed to list projects');
      captureServerError(error, { service: 'ProjectService.listProjects' });
      throw error;
    }
  }

  async getProjectBySlug(slug: string, isAdmin = false) {
    const where: Prisma.ProjectWhereInput = {
      slug,
      deletedAt: null,
    };

    if (!isAdmin) {
      where.status = 'PUBLISHED';
    }

    try {
      const project = await prisma.project.findFirst({
        where,
        select: {
          id: true,
          title: true,
          slug: true,
          shortDescription: true,
          fullDescription: true,
          thumbnailUrl: true,
          images: true,
          techStack: true,
          liveUrl: true,
          githubUrl: true,
          categoryId: true,
          isFeatured: true,
          order: true,
          status: true,
          publishedAt: true,
          createdAt: true,
          updatedAt: true,
          category: {
            select: { id: true, name: true, slug: true },
          },
          _count: {
            select: { clicks: true },
          },
        },
      });

      return project ? hydrateProject(project) : null;
    } catch (error) {
      logger.error({ error, slug }, 'Failed to get project by slug');
      captureServerError(error, { service: 'ProjectService.getProjectBySlug', slug });
      throw error;
    }
  }

  async getProjectById(id: string) {
    try {
      const project = await prisma.project.findUnique({
        where: { id },
        select: {
          id: true,
          title: true,
          slug: true,
          shortDescription: true,
          fullDescription: true,
          thumbnailUrl: true,
          images: true,
          techStack: true,
          liveUrl: true,
          githubUrl: true,
          categoryId: true,
          isFeatured: true,
          order: true,
          status: true,
          publishedAt: true,
          createdAt: true,
          updatedAt: true,
          category: {
            select: { id: true, name: true, slug: true },
          },
          _count: {
            select: { clicks: true },
          },
        },
      });

      if (!project) {
        throw new AppError('Project not found', 404, 'NOT_FOUND');
      }

      return project ? hydrateProject(project) : null;
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      logger.error({ error, id }, 'Failed to get project by id');
      captureServerError(error, { service: 'ProjectService.getProjectById', id });
      throw error;
    }
  }

  async createProject(input: CreateProjectInput) {
    const baseSlug = input.slug ? slugify(input.slug) : slugify(input.title);
    let finalSlug = baseSlug;
    let counter = 1;

    // Guarantee unique slug
    while (await prisma.project.findUnique({ where: { slug: finalSlug } })) {
      finalSlug = `${baseSlug}-${counter}`;
      counter++;
    }

    const shortDescription = input.shortDescription || input.description || '';
    const fullDescription =
      input.fullDescription !== undefined ? input.fullDescription : input.content || null;
    const thumbnailUrl =
      input.thumbnailUrl !== undefined ? input.thumbnailUrl : input.featuredImage || null;
    const liveUrl = input.liveUrl !== undefined ? input.liveUrl : input.liveDemoUrl || null;
    const publishedAt =
      input.status === 'PUBLISHED'
        ? input.publishedAt
          ? new Date(input.publishedAt)
          : new Date()
        : input.publishedAt
          ? new Date(input.publishedAt)
          : null;

    try {
      return await prisma.project.create({
        data: {
          title: input.title,
          slug: finalSlug,
          shortDescription,
          fullDescription,
          thumbnailUrl,
          images: JSON.stringify(input.images || []),
          techStack: JSON.stringify(input.techStack || []),
          liveUrl,
          githubUrl: input.githubUrl || null,
          categoryId: input.categoryId || null,
          order: input.order ?? 0,
          isFeatured: input.isFeatured ?? false,
          status: input.status || 'DRAFT',
          publishedAt,
        },
        select: {
          id: true,
          title: true,
          slug: true,
          shortDescription: true,
          fullDescription: true,
          thumbnailUrl: true,
          images: true,
          techStack: true,
          liveUrl: true,
          githubUrl: true,
          categoryId: true,
          isFeatured: true,
          order: true,
          status: true,
          publishedAt: true,
          createdAt: true,
          updatedAt: true,
          category: {
            select: { id: true, name: true, slug: true },
          },
          _count: {
            select: { clicks: true },
          },
        },
      });
    } catch (error: any) {
      if (error?.code === 'P2002') {
        throw new AppError('A project with this slug already exists', 409, 'CONFLICT_ERROR');
      }
      logger.error({ error, title: input.title }, 'Failed to create project');
      captureServerError(error, { service: 'ProjectService.createProject' });
      throw error;
    }
  }

  async updateProject(id: string, input: UpdateProjectInput) {
    const existing = await prisma.project.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Project not found', 404, 'NOT_FOUND');
    }

    let slug = existing.slug;
    if (input.slug && input.slug !== existing.slug) {
      slug = slugify(input.slug);
      const conflict = await prisma.project.findUnique({ where: { slug } });
      if (conflict && conflict.id !== id) {
        throw new AppError('A project with this slug already exists', 409, 'CONFLICT_ERROR');
      }
    }

    const shortDescription =
      input.shortDescription !== undefined
        ? input.shortDescription
        : input.description !== undefined
          ? input.description
          : existing.shortDescription;
    const fullDescription =
      input.fullDescription !== undefined
        ? input.fullDescription
        : input.content !== undefined
          ? input.content
          : existing.fullDescription;
    const thumbnailUrl =
      input.thumbnailUrl !== undefined
        ? input.thumbnailUrl
        : input.featuredImage !== undefined
          ? input.featuredImage
          : existing.thumbnailUrl;
    const liveUrl =
      input.liveUrl !== undefined
        ? input.liveUrl
        : input.liveDemoUrl !== undefined
          ? input.liveDemoUrl
          : existing.liveUrl;
    const publishedAt =
      input.publishedAt !== undefined
        ? input.publishedAt
          ? new Date(input.publishedAt)
          : null
        : undefined;

    try {
      return await prisma.project.update({
        where: { id },
        data: {
          ...(input.title !== undefined && { title: input.title }),
          slug,
          ...(shortDescription !== undefined && { shortDescription }),
          ...(fullDescription !== undefined && { fullDescription }),
          ...(thumbnailUrl !== undefined && { thumbnailUrl }),
          ...(input.images !== undefined && { images: JSON.stringify(input.images) }),
          ...(input.techStack !== undefined && { techStack: JSON.stringify(input.techStack) }),
          ...(liveUrl !== undefined && { liveUrl }),
          ...(input.githubUrl !== undefined && { githubUrl: input.githubUrl }),
          ...(input.categoryId !== undefined && { categoryId: input.categoryId }),
          ...(input.order !== undefined && { order: input.order }),
          ...(input.isFeatured !== undefined && { isFeatured: input.isFeatured }),
          ...(input.status !== undefined && { status: input.status }),
          ...(publishedAt !== undefined && { publishedAt }),
        },
        select: {
          id: true,
          title: true,
          slug: true,
          shortDescription: true,
          fullDescription: true,
          thumbnailUrl: true,
          images: true,
          techStack: true,
          liveUrl: true,
          githubUrl: true,
          categoryId: true,
          isFeatured: true,
          order: true,
          status: true,
          publishedAt: true,
          createdAt: true,
          updatedAt: true,
          category: {
            select: { id: true, name: true, slug: true },
          },
          _count: {
            select: { clicks: true },
          },
        },
      });
    } catch (error: any) {
      if (error?.code === 'P2002') {
        throw new AppError('A project with this slug already exists', 409, 'CONFLICT_ERROR');
      }
      logger.error({ error, id }, 'Failed to update project');
      captureServerError(error, { service: 'ProjectService.updateProject', id });
      throw error;
    }
  }

  async deleteProject(id: string, soft = true) {
    try {
      if (soft) {
        return await prisma.project.update({
          where: { id },
          data: { deletedAt: new Date() },
        });
      }
      return await prisma.project.delete({ where: { id } });
    } catch (error: any) {
      if (error?.code === 'P2025') {
        throw new AppError('Project not found', 404, 'NOT_FOUND');
      }
      logger.error({ error, id }, 'Failed to delete project');
      captureServerError(error, { service: 'ProjectService.deleteProject', id });
      throw error;
    }
  }
}

export const projectService = new ProjectService();
export default projectService;
