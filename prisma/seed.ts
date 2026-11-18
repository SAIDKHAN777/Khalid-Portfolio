import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import { z } from 'zod';
import { hashPassword } from '../src/lib/auth';

dotenv.config();

const prisma = new PrismaClient();

const seedEnvSchema = z.object({
  ADMIN_EMAIL: z.string().email('ADMIN_EMAIL must be a valid email address'),
  ADMIN_PASSWORD: z.string().min(8, 'ADMIN_PASSWORD must be at least 8 characters long'),
});

async function main() {
  console.info('[seed] Initializing Khalid Portfolio database...');

  const envCheck = seedEnvSchema.safeParse({
    ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'admin@khalid.dev',
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'ChangeThisStrongPassword123!',
  });

  if (!envCheck.success) {
    console.error('[seed] Invalid admin credentials:', envCheck.error.issues);
    throw new Error('SEED_ABORT_INVALID_CREDENTIALS');
  }

  const { ADMIN_EMAIL, ADMIN_PASSWORD } = envCheck.data;
  const passwordHash = await hashPassword(ADMIN_PASSWORD);

  await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: { passwordHash, role: 'ADMIN', failedLoginCount: 0, lockedUntil: null },
    create: {
      email: ADMIN_EMAIL,
      passwordHash,
      name: 'Khalid',
      role: 'ADMIN',
    },
  });

  await prisma.adminUser.upsert({
    where: { email: ADMIN_EMAIL },
    update: { passwordHash },
    create: { email: ADMIN_EMAIL, passwordHash },
  });

  await prisma.siteSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      heroGreeting: 'Hello',
      heroIntro:
        'My name is Khalid. I work as an AI Engineer, AI Automation Expert and Full Stack Developer, building software apps, backend systems, AI platforms and personal AI agents.',
      heroPhotoUrl: '/images/said-cutout.png',
      ownerName: 'Khalid',
      aboutTitle: 'About Khalid',
      socialProfiles: [
        { id: '1', title: 'Facebook', url: 'https://facebook.com', logoUrl: '' },
        { id: '2', title: 'YouTube', url: 'https://youtube.com', logoUrl: '' },
        { id: '3', title: 'Behance', url: 'https://behance.net', logoUrl: '' },
        { id: '4', title: 'LinkedIn', url: 'https://linkedin.com', logoUrl: '' },
        { id: '5', title: 'X', url: 'https://x.com', logoUrl: '' },
      ],
      footerHeadline: 'Connect with us',
      footerSubline: "Have a project in mind? Let's make it happen.",
      contactButtonLabel: 'Contact Us ->',
      contactUrl: 'mailto:contact@khalid.dev',
      footerCopyright: '© 2026 Khalid. All rights reserved.',
      seoTitle: 'Khalid | AI Engineer & Full Stack Developer',
      seoDescription:
        'Personal portfolio of Khalid - AI Engineer, AI Automation Expert and Full Stack Developer.',
    },
  });

  const sections = [
    { slug: 'video-editing', title: 'Video Editing', order: 1 },
    { slug: 'graphic-design', title: 'Graphic Design', order: 2 },
    { slug: 'motion-graphics', title: 'Motion Graphics', order: 3 },
    { slug: 'digital-marketing', title: 'Digital Marketing', order: 4 },
  ];

  const sectionRecords = [];
  for (const s of sections) {
    const rec = await prisma.section.upsert({
      where: { slug: s.slug },
      update: { title: s.title, order: s.order, isVisible: true },
      create: { ...s, isVisible: true },
    });
    sectionRecords.push(rec);
  }

  const services = [
    { id: 'svc-video-editing', title: 'Video Editing', order: 1, sectionId: sectionRecords[0].id },
    { id: 'svc-graphic-design', title: 'Graphic Design', order: 2, sectionId: sectionRecords[1].id },
    { id: 'svc-motion-graphic', title: 'Motion Graphic', order: 3, sectionId: sectionRecords[2].id },
    { id: 'svc-digital-marketing', title: 'Digital Marketing', order: 4, sectionId: sectionRecords[3].id },
  ];

  for (const svc of services) {
    await prisma.service.upsert({
      where: { id: svc.id },
      update: { title: svc.title, order: svc.order, sectionId: svc.sectionId, isVisible: true },
      create: { ...svc, isVisible: true },
    });
  }

  console.info('[seed] Database seeding complete.');
}

main()
  .catch((err) => {
    console.error('[seed] Failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
