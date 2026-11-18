import prisma from '@/lib/db';
import { slugify } from '@/lib/slug';
import { Prisma } from '@prisma/client';
import type {
  CreateSkillInput,
  UpdateSkillInput,
  CreateServiceInput,
  UpdateServiceInput,
  CreateExperienceInput,
  UpdateExperienceInput,
  CreateEducationInput,
  UpdateEducationInput,
  CreateTestimonialInput,
  UpdateTestimonialInput,
  CreateCategoryInput,
  UpdateCategoryInput,
  UpdateSiteSettingInput,
} from '@/lib/validators/content';
import { logger } from '@/lib/logger';
import { captureServerError } from '@/lib/sentry';
import { AppError } from '@/lib/errorHandler';

export class ContentService {
  // ==================== SKILLS ====================
  async listSkills(isAdmin = false) {
    try {
      return await prisma.skill.findMany({
        where: isAdmin ? undefined : { isVisible: true },
        orderBy: [{ order: 'asc' }, { level: 'desc' }],
        select: {
          id: true,
          name: true,
          category: true,
          level: true,
          icon: true,
          order: true,
          isVisible: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    } catch (error) {
      logger.error({ error }, 'Failed to list skills');
      captureServerError(error, { service: 'ContentService.listSkills' });
      throw error;
    }
  }

  async createSkill(data: CreateSkillInput) {
    const level =
      data.level !== undefined
        ? data.level
        : data.proficiency !== undefined
          ? data.proficiency
          : 80;
    const isVisible = data.isVisible !== undefined ? data.isVisible : true;

    try {
      return await prisma.skill.create({
        data: {
          name: data.name,
          category: data.category,
          level,
          icon: data.icon || null,
          order: data.order ?? 0,
          isVisible,
        },
      });
    } catch (error) {
      logger.error({ error, name: data.name }, 'Failed to create skill');
      captureServerError(error, { service: 'ContentService.createSkill' });
      throw error;
    }
  }

  async updateSkill(id: string, data: UpdateSkillInput) {
    const level =
      data.level !== undefined
        ? data.level
        : data.proficiency !== undefined
          ? data.proficiency
          : undefined;
    const isVisible = data.isVisible !== undefined ? data.isVisible : undefined;

    try {
      return await prisma.skill.update({
        where: { id },
        data: {
          ...(data.name !== undefined && { name: data.name }),
          ...(data.category !== undefined && { category: data.category }),
          ...(level !== undefined && { level }),
          ...(data.icon !== undefined && { icon: data.icon }),
          ...(data.order !== undefined && { order: data.order }),
          ...(isVisible !== undefined && { isVisible }),
        },
      });
    } catch (error: any) {
      if (error?.code === 'P2025') {
        throw new AppError('Skill not found', 404, 'NOT_FOUND');
      }
      logger.error({ error, id }, 'Failed to update skill');
      captureServerError(error, { service: 'ContentService.updateSkill', id });
      throw error;
    }
  }

  async deleteSkill(id: string, soft = true) {
    try {
      if (soft) {
        return await prisma.skill.update({
          where: { id },
          data: { isVisible: false },
        });
      }
      return await prisma.skill.delete({ where: { id } });
    } catch (error: any) {
      if (error?.code === 'P2025') {
        throw new AppError('Skill not found', 404, 'NOT_FOUND');
      }
      logger.error({ error, id }, 'Failed to delete skill');
      captureServerError(error, { service: 'ContentService.deleteSkill', id });
      throw error;
    }
  }

  // ==================== SERVICES ====================
  async listServices(isAdmin = false) {
    try {
      return await prisma.service.findMany({
        where: isAdmin ? undefined : { isVisible: true },
        orderBy: { order: 'asc' },
        select: {
          id: true,
          title: true,
          description: true,
          icon: true,
          order: true,
          isVisible: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    } catch (error) {
      logger.error({ error }, 'Failed to list services');
      captureServerError(error, { service: 'ContentService.listServices' });
      throw error;
    }
  }

  async createService(data: CreateServiceInput) {
    try {
      return await prisma.service.create({
        data: {
          title: data.title,
          description: data.description,
          icon: data.icon || null,
          order: data.order ?? 0,
          isVisible: data.isVisible ?? true,
        },
      });
    } catch (error) {
      logger.error({ error, title: data.title }, 'Failed to create service');
      captureServerError(error, { service: 'ContentService.createService' });
      throw error;
    }
  }

  async updateService(id: string, data: UpdateServiceInput) {
    try {
      return await prisma.service.update({
        where: { id },
        data: {
          ...(data.title !== undefined && { title: data.title }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.icon !== undefined && { icon: data.icon }),
          ...(data.order !== undefined && { order: data.order }),
          ...(data.isVisible !== undefined && { isVisible: data.isVisible }),
        },
      });
    } catch (error: any) {
      if (error?.code === 'P2025') {
        throw new AppError('Service not found', 404, 'NOT_FOUND');
      }
      logger.error({ error, id }, 'Failed to update service');
      captureServerError(error, { service: 'ContentService.updateService', id });
      throw error;
    }
  }

  async deleteService(id: string, soft = true) {
    try {
      if (soft) {
        return await prisma.service.update({
          where: { id },
          data: { isVisible: false },
        });
      }
      return await prisma.service.delete({ where: { id } });
    } catch (error: any) {
      if (error?.code === 'P2025') {
        throw new AppError('Service not found', 404, 'NOT_FOUND');
      }
      logger.error({ error, id }, 'Failed to delete service');
      captureServerError(error, { service: 'ContentService.deleteService', id });
      throw error;
    }
  }

  // ==================== EXPERIENCES ====================
  async listExperiences(isAdmin?: boolean) {
    try {
      return await prisma.experience.findMany({
        orderBy: [{ isCurrent: 'desc' }, { startDate: 'desc' }],
        select: {
          id: true,
          title: true,
          company: true,
          location: true,
          startDate: true,
          endDate: true,
          isCurrent: true,
          description: true,
          order: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    } catch (error) {
      logger.error({ error }, 'Failed to list experiences');
      captureServerError(error, { service: 'ContentService.listExperiences' });
      throw error;
    }
  }

  async createExperience(data: CreateExperienceInput) {
    const title = data.title || data.position || 'Software Engineer';
    try {
      return await prisma.experience.create({
        data: {
          title,
          company: data.company,
          location: data.location || null,
          startDate: new Date(data.startDate),
          endDate: data.endDate ? new Date(data.endDate) : null,
          isCurrent: data.isCurrent ?? false,
          description: data.description,
          order: data.order ?? 0,
        },
      });
    } catch (error) {
      logger.error({ error, company: data.company }, 'Failed to create experience');
      captureServerError(error, { service: 'ContentService.createExperience' });
      throw error;
    }
  }

  async updateExperience(id: string, data: UpdateExperienceInput) {
    const title =
      data.title !== undefined
        ? data.title
        : data.position !== undefined
          ? data.position
          : undefined;
    const startDate = data.startDate !== undefined ? new Date(data.startDate) : undefined;
    const endDate =
      data.endDate !== undefined ? (data.endDate ? new Date(data.endDate) : null) : undefined;

    try {
      return await prisma.experience.update({
        where: { id },
        data: {
          ...(title !== undefined && { title }),
          ...(data.company !== undefined && { company: data.company }),
          ...(data.location !== undefined && { location: data.location }),
          ...(startDate !== undefined && { startDate }),
          ...(endDate !== undefined && { endDate }),
          ...(data.isCurrent !== undefined && { isCurrent: data.isCurrent }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.order !== undefined && { order: data.order }),
        },
      });
    } catch (error: any) {
      if (error?.code === 'P2025') {
        throw new AppError('Experience not found', 404, 'NOT_FOUND');
      }
      logger.error({ error, id }, 'Failed to update experience');
      captureServerError(error, { service: 'ContentService.updateExperience', id });
      throw error;
    }
  }

  async deleteExperience(id: string, soft = false) {
    try {
      return await prisma.experience.delete({ where: { id } });
    } catch (error: any) {
      if (error?.code === 'P2025') {
        throw new AppError('Experience not found', 404, 'NOT_FOUND');
      }
      logger.error({ error, id }, 'Failed to delete experience');
      captureServerError(error, { service: 'ContentService.deleteExperience', id });
      throw error;
    }
  }

  // ==================== EDUCATIONS ====================
  async listEducations(isAdmin?: boolean) {
    try {
      return await prisma.education.findMany({
        orderBy: [{ startDate: 'desc' }],
        select: {
          id: true,
          degree: true,
          institute: true,
          startDate: true,
          endDate: true,
          description: true,
          order: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    } catch (error) {
      logger.error({ error }, 'Failed to list educations');
      captureServerError(error, { service: 'ContentService.listEducations' });
      throw error;
    }
  }

  async createEducation(data: CreateEducationInput) {
    const institute = data.institute || data.institution || 'University';
    try {
      return await prisma.education.create({
        data: {
          degree: data.degree,
          institute,
          startDate: new Date(data.startDate),
          endDate: data.endDate ? new Date(data.endDate) : null,
          description: data.description || null,
          order: data.order ?? 0,
        },
      });
    } catch (error) {
      logger.error({ error, degree: data.degree }, 'Failed to create education');
      captureServerError(error, { service: 'ContentService.createEducation' });
      throw error;
    }
  }

  async updateEducation(id: string, data: UpdateEducationInput) {
    const institute =
      data.institute !== undefined
        ? data.institute
        : data.institution !== undefined
          ? data.institution
          : undefined;
    const startDate = data.startDate !== undefined ? new Date(data.startDate) : undefined;
    const endDate =
      data.endDate !== undefined ? (data.endDate ? new Date(data.endDate) : null) : undefined;

    try {
      return await prisma.education.update({
        where: { id },
        data: {
          ...(data.degree !== undefined && { degree: data.degree }),
          ...(institute !== undefined && { institute }),
          ...(startDate !== undefined && { startDate }),
          ...(endDate !== undefined && { endDate }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.order !== undefined && { order: data.order }),
        },
      });
    } catch (error: any) {
      if (error?.code === 'P2025') {
        throw new AppError('Education not found', 404, 'NOT_FOUND');
      }
      logger.error({ error, id }, 'Failed to update education');
      captureServerError(error, { service: 'ContentService.updateEducation', id });
      throw error;
    }
  }

  async deleteEducation(id: string, soft = false) {
    try {
      return await prisma.education.delete({ where: { id } });
    } catch (error: any) {
      if (error?.code === 'P2025') {
        throw new AppError('Education not found', 404, 'NOT_FOUND');
      }
      logger.error({ error, id }, 'Failed to delete education');
      captureServerError(error, { service: 'ContentService.deleteEducation', id });
      throw error;
    }
  }

  // ==================== TESTIMONIALS ====================
  async listTestimonials(isAdmin = false) {
    try {
      return await prisma.testimonial.findMany({
        where: isAdmin ? undefined : { isApproved: true },
        orderBy: [{ rating: 'desc' }, { createdAt: 'desc' }],
        select: {
          id: true,
          clientName: true,
          clientRole: true,
          company: true,
          message: true,
          avatarUrl: true,
          rating: true,
          isApproved: true,
          order: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    } catch (error) {
      logger.error({ error }, 'Failed to list testimonials');
      captureServerError(error, { service: 'ContentService.listTestimonials' });
      throw error;
    }
  }

  async createTestimonial(data: CreateTestimonialInput) {
    const message = data.message || data.content || '';
    try {
      return await prisma.testimonial.create({
        data: {
          clientName: data.clientName,
          clientRole: data.clientRole,
          company: data.company || null,
          message,
          avatarUrl: data.avatarUrl || null,
          rating: data.rating ?? 5,
          isApproved: data.isApproved ?? false,
          order: data.order ?? 0,
        },
      });
    } catch (error) {
      logger.error({ error, clientName: data.clientName }, 'Failed to create testimonial');
      captureServerError(error, { service: 'ContentService.createTestimonial' });
      throw error;
    }
  }

  async updateTestimonial(id: string, data: UpdateTestimonialInput) {
    const message =
      data.message !== undefined
        ? data.message
        : data.content !== undefined
          ? data.content
          : undefined;

    try {
      return await prisma.testimonial.update({
        where: { id },
        data: {
          ...(data.clientName !== undefined && { clientName: data.clientName }),
          ...(data.clientRole !== undefined && { clientRole: data.clientRole }),
          ...(data.company !== undefined && { company: data.company }),
          ...(message !== undefined && { message }),
          ...(data.avatarUrl !== undefined && { avatarUrl: data.avatarUrl }),
          ...(data.rating !== undefined && { rating: data.rating }),
          ...(data.isApproved !== undefined && { isApproved: data.isApproved }),
          ...(data.order !== undefined && { order: data.order }),
        },
      });
    } catch (error: any) {
      if (error?.code === 'P2025') {
        throw new AppError('Testimonial not found', 404, 'NOT_FOUND');
      }
      logger.error({ error, id }, 'Failed to update testimonial');
      captureServerError(error, { service: 'ContentService.updateTestimonial', id });
      throw error;
    }
  }

  async deleteTestimonial(id: string, soft = false) {
    try {
      return await prisma.testimonial.delete({ where: { id } });
    } catch (error: any) {
      if (error?.code === 'P2025') {
        throw new AppError('Testimonial not found', 404, 'NOT_FOUND');
      }
      logger.error({ error, id }, 'Failed to delete testimonial');
      captureServerError(error, { service: 'ContentService.deleteTestimonial', id });
      throw error;
    }
  }

  // ==================== CATEGORIES ====================
  async listCategories(type?: string) {
    try {
      return await prisma.category.findMany({
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          slug: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: { projects: true },
          },
        },
      });
    } catch (error) {
      logger.error({ error }, 'Failed to list categories');
      captureServerError(error, { service: 'ContentService.listCategories' });
      throw error;
    }
  }

  async createCategory(data: CreateCategoryInput) {
    const slug = data.slug ? slugify(data.slug) : slugify(data.name);
    try {
      return await prisma.category.create({
        data: {
          name: data.name,
          slug,
        },
      });
    } catch (error: any) {
      if (error?.code === 'P2002') {
        throw new AppError(
          'A category with this name or slug already exists',
          409,
          'CONFLICT_ERROR'
        );
      }
      logger.error({ error, name: data.name }, 'Failed to create category');
      captureServerError(error, { service: 'ContentService.createCategory' });
      throw error;
    }
  }

  async updateCategory(id: string, data: UpdateCategoryInput) {
    const slug = data.slug ? slugify(data.slug) : data.name ? slugify(data.name) : undefined;
    try {
      return await prisma.category.update({
        where: { id },
        data: {
          ...(data.name !== undefined && { name: data.name }),
          ...(slug !== undefined && { slug }),
        },
      });
    } catch (error: any) {
      if (error?.code === 'P2002') {
        throw new AppError(
          'A category with this name or slug already exists',
          409,
          'CONFLICT_ERROR'
        );
      }
      if (error?.code === 'P2025') {
        throw new AppError('Category not found', 404, 'NOT_FOUND');
      }
      logger.error({ error, id }, 'Failed to update category');
      captureServerError(error, { service: 'ContentService.updateCategory', id });
      throw error;
    }
  }

  async deleteCategory(id: string) {
    try {
      return await prisma.category.delete({ where: { id } });
    } catch (error: any) {
      if (error?.code === 'P2025') {
        throw new AppError('Category not found', 404, 'NOT_FOUND');
      }
      logger.error({ error, id }, 'Failed to delete category');
      captureServerError(error, { service: 'ContentService.deleteCategory', id });
      throw error;
    }
  }

  // ==================== SITE SETTINGS ====================
  async getSiteSettings() {
    try {
      return await prisma.siteSetting.findUnique({
        where: { id: 'default' },
      });
    } catch (error) {
      logger.error({ error }, 'Failed to get site settings');
      captureServerError(error, { service: 'ContentService.getSiteSettings' });
      throw error;
    }
  }

  async updateSiteSettings(data: UpdateSiteSettingInput) {
    const heroTitle = data.heroTitle || data.siteTitle || undefined;
    const heroSubtitle = data.heroSubtitle || undefined;
    const defaultSeoTitle = data.defaultSeoTitle || data.siteTitle || undefined;
    const defaultSeoDescription = data.defaultSeoDescription || data.siteDescription || undefined;
    const email = data.email || data.contactEmail || undefined;

    const socialLinks =
      data.socialLinks !== undefined
        ? data.socialLinks
          ? (data.socialLinks as Prisma.InputJsonValue)
          : Prisma.JsonNull
        : undefined;

    try {
      return await prisma.siteSetting.upsert({
        where: { id: 'default' },
        update: {
          ...(heroTitle !== undefined && { heroTitle }),
          ...(heroSubtitle !== undefined && { heroSubtitle }),
          ...(data.bio !== undefined && { bio: data.bio }),
          ...(email !== undefined && { email }),
          ...(data.phone !== undefined && { phone: data.phone }),
          ...(data.location !== undefined && { location: data.location }),
          ...(socialLinks !== undefined && { socialLinks }),
          ...(data.resumeUrl !== undefined && { resumeUrl: data.resumeUrl }),
          ...(defaultSeoTitle !== undefined && { defaultSeoTitle }),
          ...(defaultSeoDescription !== undefined && { defaultSeoDescription }),
          ...(data.defaultOgImage !== undefined && { defaultOgImage: data.defaultOgImage }),
        },
        create: {
          id: 'default',
          heroTitle: heroTitle || 'Senior Software Engineer & Systems Architect',
          heroSubtitle: heroSubtitle || null,
          bio: data.bio || null,
          email: email || 'contact@saidkhan.dev',
          phone: data.phone || null,
          location: data.location || 'Dhaka, Bangladesh',
          socialLinks: data.socialLinks
            ? (data.socialLinks as Prisma.InputJsonValue)
            : Prisma.JsonNull,
          resumeUrl: data.resumeUrl || null,
          defaultSeoTitle:
            defaultSeoTitle || 'Khalid | Senior Backend Engineer & System Architect',
          defaultSeoDescription:
            defaultSeoDescription ||
            'Personal engineering portfolio, technical articles, and project showcases.',
          defaultOgImage: data.defaultOgImage || null,
        },
      });
    } catch (error) {
      logger.error({ error }, 'Failed to update site settings');
      captureServerError(error, { service: 'ContentService.updateSiteSettings' });
      throw error;
    }
  }
}

export const contentService = new ContentService();
export default contentService;
