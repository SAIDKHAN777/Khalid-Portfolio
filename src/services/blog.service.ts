import prisma from '@/lib/db';
import { slugify } from '@/lib/slug';
import { calculateReadingTime, renderAndSanitizeMarkdown } from '@/lib/markdown';
import type { BlogQuery, CreateBlogPostInput, UpdateBlogPostInput } from '@/lib/validators/blog';
import type { Prisma } from '@prisma/client';
import { logger } from '@/lib/logger';
import { captureServerError } from '@/lib/sentry';
import { AppError } from '@/lib/errorHandler';

export class BlogService {
  async listPosts(query: BlogQuery, isAdmin = false) {
    const { page, limit, search, tag, status, includeDrafts } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.BlogPostWhereInput = {
      deletedAt: null,
    };

    if (!isAdmin && !includeDrafts) {
      where.status = 'PUBLISHED';
    } else if (status) {
      where.status = status;
    }

    if (tag) {
      where.tags = {
        some: {
          OR: [{ slug: tag }, { name: { equals: tag } }],
        },
      };
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { excerpt: { contains: search } },
      ];
    }

    try {
      const [posts, total] = await Promise.all([
        prisma.blogPost.findMany({
          where,
          skip,
          take: limit,
          orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
          select: {
            id: true,
            title: true,
            slug: true,
            excerpt: true,
            coverImageUrl: true,
            status: true,
            publishedAt: true,
            seoTitle: true,
            seoDescription: true,
            readingTime: true,
            viewCount: true,
            createdAt: true,
            updatedAt: true,
            tags: {
              select: { id: true, name: true, slug: true },
            },
          },
        }),
        prisma.blogPost.count({ where }),
      ]);

      return {
        posts,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error({ error, query }, 'Failed to list blog posts');
      captureServerError(error, { service: 'BlogService.listPosts' });
      throw error;
    }
  }

  async getPostBySlug(slug: string, isAdmin = false, renderHtml = false) {
    const where: Prisma.BlogPostWhereInput = {
      slug,
      deletedAt: null,
    };

    if (!isAdmin) {
      where.status = 'PUBLISHED';
    }

    try {
      const post = await prisma.blogPost.findFirst({
        where,
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          content: true,
          coverImageUrl: true,
          status: true,
          publishedAt: true,
          seoTitle: true,
          seoDescription: true,
          readingTime: true,
          viewCount: true,
          createdAt: true,
          updatedAt: true,
          tags: {
            select: { id: true, name: true, slug: true },
          },
        },
      });

      if (!post) return null;

      // Increment view count for public visitors asynchronously
      if (!isAdmin) {
        prisma.blogPost
          .update({
            where: { id: post.id },
            data: { viewCount: { increment: 1 } },
          })
          .catch(() => {});
      }

      if (renderHtml) {
        const sanitizedHtml = await renderAndSanitizeMarkdown(post.content);
        return {
          ...post,
          htmlContent: sanitizedHtml,
        };
      }

      return post;
    } catch (error) {
      logger.error({ error, slug }, 'Failed to get post by slug');
      captureServerError(error, { service: 'BlogService.getPostBySlug', slug });
      throw error;
    }
  }

  async getPostById(id: string) {
    try {
      const post = await prisma.blogPost.findUnique({
        where: { id },
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          content: true,
          coverImageUrl: true,
          status: true,
          publishedAt: true,
          seoTitle: true,
          seoDescription: true,
          readingTime: true,
          viewCount: true,
          createdAt: true,
          updatedAt: true,
          tags: {
            select: { id: true, name: true, slug: true },
          },
        },
      });

      if (!post) {
        throw new AppError('Blog post not found', 404, 'NOT_FOUND');
      }

      return post;
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      logger.error({ error, id }, 'Failed to get post by id');
      captureServerError(error, { service: 'BlogService.getPostById', id });
      throw error;
    }
  }

  async createPost(input: CreateBlogPostInput) {
    const { tags = [], ...data } = input;

    const baseSlug = data.slug ? slugify(data.slug) : slugify(data.title);
    let finalSlug = baseSlug;
    let counter = 1;

    while (await prisma.blogPost.findUnique({ where: { slug: finalSlug } })) {
      finalSlug = `${baseSlug}-${counter}`;
      counter++;
    }

    const excerpt = data.excerpt || data.summary || '';
    const coverImageUrl =
      data.coverImageUrl !== undefined ? data.coverImageUrl : data.featuredImage || null;
    const readingTime = data.readingTime || calculateReadingTime(data.content);
    const publishedAt =
      data.status === 'PUBLISHED'
        ? data.publishedAt
          ? new Date(data.publishedAt)
          : new Date()
        : data.publishedAt
          ? new Date(data.publishedAt)
          : null;

    const tagConnectOrCreate = tags.map((tagName) => {
      const tagSlug = slugify(tagName);
      return {
        where: { slug: tagSlug },
        create: { name: tagName, slug: tagSlug },
      };
    });

    try {
      return await prisma.blogPost.create({
        data: {
          title: data.title,
          slug: finalSlug,
          excerpt,
          content: data.content,
          coverImageUrl,
          status: data.status || 'DRAFT',
          publishedAt,
          seoTitle: data.seoTitle || null,
          seoDescription: data.seoDescription || null,
          readingTime,
          tags: {
            connectOrCreate: tagConnectOrCreate,
          },
        },
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          coverImageUrl: true,
          status: true,
          publishedAt: true,
          seoTitle: true,
          seoDescription: true,
          readingTime: true,
          viewCount: true,
          createdAt: true,
          updatedAt: true,
          tags: {
            select: { id: true, name: true, slug: true },
          },
        },
      });
    } catch (error: any) {
      if (error?.code === 'P2002') {
        throw new AppError('A post with this slug already exists', 409, 'CONFLICT_ERROR');
      }
      logger.error({ error, title: data.title }, 'Failed to create blog post');
      captureServerError(error, { service: 'BlogService.createPost' });
      throw error;
    }
  }

  async updatePost(id: string, input: UpdateBlogPostInput) {
    const existing = await prisma.blogPost.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Blog post not found', 404, 'NOT_FOUND');
    }

    const { tags, ...data } = input;

    let slug = existing.slug;
    if (data.slug && data.slug !== existing.slug) {
      slug = slugify(data.slug);
      const conflict = await prisma.blogPost.findUnique({ where: { slug } });
      if (conflict && conflict.id !== id) {
        throw new AppError('A post with this slug already exists', 409, 'CONFLICT_ERROR');
      }
    }

    const excerpt =
      data.excerpt !== undefined
        ? data.excerpt
        : data.summary !== undefined
          ? data.summary
          : existing.excerpt;
    const coverImageUrl =
      data.coverImageUrl !== undefined
        ? data.coverImageUrl
        : data.featuredImage !== undefined
          ? data.featuredImage
          : existing.coverImageUrl;
    const readingTime =
      data.readingTime !== undefined
        ? data.readingTime
        : data.content
          ? calculateReadingTime(data.content)
          : existing.readingTime;
    const publishedAt =
      data.status === 'PUBLISHED' && !existing.publishedAt
        ? new Date()
        : data.publishedAt !== undefined
          ? data.publishedAt
            ? new Date(data.publishedAt)
            : null
          : existing.publishedAt;

    const tagUpdate: Prisma.BlogPostUpdateInput['tags'] = tags
      ? {
          set: [],
          connectOrCreate: tags.map((tagName) => {
            const tagSlug = slugify(tagName);
            return {
              where: { slug: tagSlug },
              create: { name: tagName, slug: tagSlug },
            };
          }),
        }
      : undefined;

    try {
      return await prisma.blogPost.update({
        where: { id },
        data: {
          ...(data.title !== undefined && { title: data.title }),
          slug,
          excerpt,
          ...(data.content !== undefined && { content: data.content }),
          coverImageUrl,
          ...(data.status !== undefined && { status: data.status }),
          publishedAt,
          ...(data.seoTitle !== undefined && { seoTitle: data.seoTitle }),
          ...(data.seoDescription !== undefined && { seoDescription: data.seoDescription }),
          readingTime,
          tags: tagUpdate,
        },
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          coverImageUrl: true,
          status: true,
          publishedAt: true,
          seoTitle: true,
          seoDescription: true,
          readingTime: true,
          viewCount: true,
          createdAt: true,
          updatedAt: true,
          tags: {
            select: { id: true, name: true, slug: true },
          },
        },
      });
    } catch (error: any) {
      if (error?.code === 'P2002') {
        throw new AppError('A post with this slug already exists', 409, 'CONFLICT_ERROR');
      }
      logger.error({ error, id }, 'Failed to update blog post');
      captureServerError(error, { service: 'BlogService.updatePost', id });
      throw error;
    }
  }

  async deletePost(id: string, soft = true) {
    try {
      if (soft) {
        return await prisma.blogPost.update({
          where: { id },
          data: { deletedAt: new Date() },
        });
      }
      return await prisma.blogPost.delete({ where: { id } });
    } catch (error: any) {
      if (error?.code === 'P2025') {
        throw new AppError('Blog post not found', 404, 'NOT_FOUND');
      }
      logger.error({ error, id }, 'Failed to delete blog post');
      captureServerError(error, { service: 'BlogService.deletePost', id });
      throw error;
    }
  }

  // ==================== TAGS ====================
  async listTags() {
    try {
      return await prisma.tag.findMany({
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          slug: true,
          _count: {
            select: { posts: true },
          },
        },
      });
    } catch (error) {
      logger.error({ error }, 'Failed to list tags');
      captureServerError(error, { service: 'BlogService.listTags' });
      throw error;
    }
  }

  async createTag(name: string, customSlug?: string) {
    const slug = customSlug ? slugify(customSlug) : slugify(name);
    try {
      return await prisma.tag.upsert({
        where: { slug },
        update: { name },
        create: { name, slug },
        select: { id: true, name: true, slug: true },
      });
    } catch (error) {
      logger.error({ error, name, slug }, 'Failed to upsert tag');
      captureServerError(error, { service: 'BlogService.createTag' });
      throw error;
    }
  }

  async deleteTag(id: string) {
    try {
      return await prisma.tag.delete({ where: { id } });
    } catch (error: any) {
      if (error?.code === 'P2025') {
        throw new AppError('Tag not found', 404, 'NOT_FOUND');
      }
      logger.error({ error, id }, 'Failed to delete tag');
      captureServerError(error, { service: 'BlogService.deleteTag', id });
      throw error;
    }
  }
}

export const blogService = new BlogService();
export default blogService;
