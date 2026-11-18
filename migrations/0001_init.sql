-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT,
    "role" TEXT NOT NULL DEFAULT 'ADMIN',
    "lastLoginAt" DATETIME,
    "failedLoginCount" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "ipHash" TEXT,
    "userAgent" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "shortDescription" TEXT NOT NULL,
    "fullDescription" TEXT,
    "thumbnailUrl" TEXT,
    "images" TEXT NOT NULL DEFAULT '[]',
    "techStack" TEXT NOT NULL DEFAULT '[]',
    "liveUrl" TEXT,
    "githubUrl" TEXT,
    "categoryId" TEXT,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "publishedAt" DATETIME,
    "deletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "projects_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tags" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "blog_posts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "coverImageUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "publishedAt" DATETIME,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "readingTime" INTEGER NOT NULL DEFAULT 1,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "deletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "skills" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 80,
    "category" TEXT NOT NULL,
    "icon" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "services" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "sectionId" TEXT,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "icon" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "services_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "portfolio_sections" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "experiences" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "location" TEXT,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME,
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "educations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "degree" TEXT NOT NULL,
    "institute" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "testimonials" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientName" TEXT NOT NULL,
    "clientRole" TEXT NOT NULL,
    "company" TEXT,
    "message" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "rating" INTEGER NOT NULL DEFAULT 5,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "contact_messages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "ipHash" TEXT,
    "userAgent" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "media" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "url" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'IMAGE',
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "alt" TEXT,
    "folder" TEXT DEFAULT 'portfolio',
    "data" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "site_settings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "heroTitle" TEXT NOT NULL DEFAULT 'AI Engineer & Creative Technologist',
    "heroSubtitle" TEXT,
    "bio" TEXT,
    "email" TEXT NOT NULL DEFAULT 'contact@khalid.dev',
    "phone" TEXT,
    "location" TEXT DEFAULT 'Dhaka, Bangladesh',
    "socialLinks" JSONB,
    "resumeUrl" TEXT,
    "defaultSeoTitle" TEXT NOT NULL DEFAULT 'Khalid | AI Engineer & Full Stack Developer',
    "defaultSeoDescription" TEXT NOT NULL DEFAULT 'Personal portfolio, creative motion works, and technical articles by Khalid.',
    "defaultOgImage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "page_views" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "path" TEXT NOT NULL,
    "referrer" TEXT,
    "country" TEXT,
    "device" TEXT,
    "visitorHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "project_clicks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "project_clicks_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "resume_downloads" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "visitorHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "portfolio_sections" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "works" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sectionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "tags" TEXT NOT NULL DEFAULT '[]',
    "mediaType" TEXT NOT NULL DEFAULT 'IMAGE',
    "mediaUrl" TEXT,
    "posterUrl" TEXT,
    "fallbackColorA" TEXT NOT NULL DEFAULT '#181824',
    "fallbackColorB" TEXT NOT NULL DEFAULT '#252538',
    "focalX" REAL NOT NULL DEFAULT 50,
    "focalY" REAL NOT NULL DEFAULT 50,
    "altText" TEXT,
    "linkLabel" TEXT NOT NULL DEFAULT 'View',
    "linkUrl" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "isPinned" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "works_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "portfolio_sections" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "site_settings_v2" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "heroGreeting" TEXT NOT NULL DEFAULT 'Hello',
    "heroIntro" TEXT NOT NULL DEFAULT 'My name is Khalid. I work as an AI Engineer, AI Automation Expert and Full Stack Developer, building software apps, backend systems, AI platforms and personal AI agents.',
    "heroPhotoUrl" TEXT,
    "ownerName" TEXT NOT NULL DEFAULT 'Khalid',
    "aboutTitle" TEXT NOT NULL DEFAULT 'About Khalid',
    "aboutBio" TEXT,
    "aboutBioParagraph1" TEXT NOT NULL DEFAULT 'I am Khalid, an AI Engineer, Creative Motion Technologist, and Full Stack Developer. Over the past several years, I have worked across the convergence of engineering rigour and cinematic media production—building intelligent software systems, resilient backend architectures, and high-retention digital media for modern brands and platforms worldwide.',
    "aboutBioParagraph2" TEXT NOT NULL DEFAULT 'My work centres on turning complex creative visions into seamless, high-performance digital experiences. Whether architecting autonomous AI agent pipelines, engineering buttery 60fps interactive web portfolios, or directing commercial video edits and brand identities, I treat every project with extreme precision, narrative rhythm, and uncompromising craft.',
    "aboutBioParagraph3" TEXT NOT NULL DEFAULT 'I believe technology should elevate human storytelling, not distract from it. From raw system design to the final rendered frame, my focus is always on delivering measurable business impact and memorable visual delight.',
    "socialProfiles" JSONB,
    "aboutYoutubeUrl" TEXT NOT NULL DEFAULT 'https://youtube.com',
    "aboutFacebookUrl" TEXT NOT NULL DEFAULT 'https://facebook.com',
    "aboutLinkedinUrl" TEXT NOT NULL DEFAULT 'https://linkedin.com',
    "aboutGithubUrl" TEXT NOT NULL DEFAULT 'https://github.com',
    "aboutXUrl" TEXT NOT NULL DEFAULT 'https://x.com',
    "footerHeadline" TEXT NOT NULL DEFAULT 'Connect with us',
    "footerSubline" TEXT NOT NULL DEFAULT 'Have a project in mind? Let''s make it happen.',
    "contactButtonLabel" TEXT NOT NULL DEFAULT 'Contact Us ->',
    "contactUrl" TEXT NOT NULL DEFAULT 'mailto:contact@khalid.dev',
    "footerCopyright" TEXT NOT NULL DEFAULT '© 2026 Khalid. All rights reserved.',
    "seoTitle" TEXT NOT NULL DEFAULT 'Khalid | AI Engineer & Full Stack Developer',
    "seoDescription" TEXT NOT NULL DEFAULT 'Personal portfolio of Khalid - AI Engineer, AI Automation Expert and Full Stack Developer.',
    "ogImageUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "admin_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "_BlogPostToTag" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_BlogPostToTag_A_fkey" FOREIGN KEY ("A") REFERENCES "blog_posts" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_BlogPostToTag_B_fkey" FOREIGN KEY ("B") REFERENCES "tags" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_tokenHash_key" ON "sessions"("tokenHash");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

-- CreateIndex
CREATE INDEX "sessions_expiresAt_idx" ON "sessions"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "projects_slug_key" ON "projects"("slug");

-- CreateIndex
CREATE INDEX "projects_slug_idx" ON "projects"("slug");

-- CreateIndex
CREATE INDEX "projects_status_idx" ON "projects"("status");

-- CreateIndex
CREATE INDEX "projects_isFeatured_idx" ON "projects"("isFeatured");

-- CreateIndex
CREATE INDEX "projects_order_idx" ON "projects"("order");

-- CreateIndex
CREATE INDEX "projects_categoryId_idx" ON "projects"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "tags_name_key" ON "tags"("name");

-- CreateIndex
CREATE UNIQUE INDEX "tags_slug_key" ON "tags"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "blog_posts_slug_key" ON "blog_posts"("slug");

-- CreateIndex
CREATE INDEX "blog_posts_slug_idx" ON "blog_posts"("slug");

-- CreateIndex
CREATE INDEX "blog_posts_status_idx" ON "blog_posts"("status");

-- CreateIndex
CREATE INDEX "blog_posts_publishedAt_idx" ON "blog_posts"("publishedAt");

-- CreateIndex
CREATE INDEX "skills_category_idx" ON "skills"("category");

-- CreateIndex
CREATE INDEX "skills_order_idx" ON "skills"("order");

-- CreateIndex
CREATE INDEX "services_order_idx" ON "services"("order");

-- CreateIndex
CREATE INDEX "services_sectionId_idx" ON "services"("sectionId");

-- CreateIndex
CREATE INDEX "experiences_order_idx" ON "experiences"("order");

-- CreateIndex
CREATE INDEX "educations_order_idx" ON "educations"("order");

-- CreateIndex
CREATE INDEX "testimonials_isApproved_idx" ON "testimonials"("isApproved");

-- CreateIndex
CREATE INDEX "testimonials_order_idx" ON "testimonials"("order");

-- CreateIndex
CREATE INDEX "contact_messages_status_idx" ON "contact_messages"("status");

-- CreateIndex
CREATE INDEX "contact_messages_createdAt_idx" ON "contact_messages"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "media_publicId_key" ON "media"("publicId");

-- CreateIndex
CREATE INDEX "media_publicId_idx" ON "media"("publicId");

-- CreateIndex
CREATE INDEX "media_type_idx" ON "media"("type");

-- CreateIndex
CREATE INDEX "page_views_createdAt_idx" ON "page_views"("createdAt");

-- CreateIndex
CREATE INDEX "page_views_path_createdAt_idx" ON "page_views"("path", "createdAt");

-- CreateIndex
CREATE INDEX "project_clicks_projectId_idx" ON "project_clicks"("projectId");

-- CreateIndex
CREATE INDEX "project_clicks_createdAt_idx" ON "project_clicks"("createdAt");

-- CreateIndex
CREATE INDEX "resume_downloads_createdAt_idx" ON "resume_downloads"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "portfolio_sections_slug_key" ON "portfolio_sections"("slug");

-- CreateIndex
CREATE INDEX "portfolio_sections_order_idx" ON "portfolio_sections"("order");

-- CreateIndex
CREATE INDEX "portfolio_sections_slug_idx" ON "portfolio_sections"("slug");

-- CreateIndex
CREATE INDEX "works_sectionId_idx" ON "works"("sectionId");

-- CreateIndex
CREATE INDEX "works_order_idx" ON "works"("order");

-- CreateIndex
CREATE INDEX "works_isPublished_idx" ON "works"("isPublished");

-- CreateIndex
CREATE INDEX "works_isPinned_idx" ON "works"("isPinned");

-- CreateIndex
CREATE UNIQUE INDEX "admin_users_email_key" ON "admin_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "_BlogPostToTag_AB_unique" ON "_BlogPostToTag"("A", "B");

-- CreateIndex
CREATE INDEX "_BlogPostToTag_B_index" ON "_BlogPostToTag"("B");

