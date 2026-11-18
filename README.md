# Khalid Portfolio

Full-stack portfolio website and content management system built with Astro 7, TypeScript, Tailwind CSS, Prisma, and Cloudflare Workers backed by Cloudflare D1.

All visitor-facing content (hero copy, portrait, social profiles, services, work showcases, press articles, and footer metadata) is stored in Cloudflare D1 and managed through an authenticated admin dashboard at `/admin`.

## Architecture

- **Runtime**: Server-side rendered Astro 7 application deployed on Cloudflare Workers using `@astrojs/cloudflare` and Workers Static Assets.
- **Database**: Cloudflare D1 (SQLite) accessed through Prisma ORM with `@prisma/adapter-d1`.
- **Authentication**: Stateful HTTP-only session cookies with PBKDF2-SHA256 password hashing (Web Crypto API), brute-force lockout protection, CSRF origin checks, and sliding-window rate limiting.
- **Motion Engine**: Lenis smooth scrolling paired with GSAP ScrollTrigger pinned panels, respecting `prefers-reduced-motion`.
- **Admin Dashboard**: React 19 interactive islands under `/admin` for managing settings, services, sections, works, press posts, skills, media uploads, and contact inquiries.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | Astro 7 (SSR) |
| UI Islands | React 19, Tailwind CSS v4 |
| Language | TypeScript (strict) |
| Motion | GSAP, ScrollTrigger, Lenis |
| Database | Cloudflare D1 (SQLite) |
| ORM | Prisma 6 (`@prisma/adapter-d1`) |
| Validation | Zod |
| Hosting | Cloudflare Workers + Static Assets |
| Testing | Playwright, Vitest, Axe Core |

## Project Structure

```text
.
├── migrations/              # SQLite / Cloudflare D1 SQL migrations
├── prisma/                  # Prisma schema and seed utilities
├── public/                  # Static assets served via Workers Static Assets
│   ├── images/
│   └── uploads/
├── src/
│   ├── components/          # Astro UI components and React admin islands
│   ├── layouts/             # Base and admin layouts
│   ├── lib/                 # D1 Prisma client, Web Crypto auth, validation, rate limiting
│   ├── middleware/          # Auth guard, CSRF checks, security headers, rate limiter
│   ├── pages/               # Public routes, /admin views, and REST API endpoints
│   ├── scripts/             # Client-side Lenis and GSAP scroll orchestration
│   ├── services/            # Domain service layer
│   └── styles/              # Global CSS tokens and utility styles
├── tests/                   # Unit and Playwright E2E suites
├── astro.config.mjs         # Astro + Cloudflare adapter configuration
└── wrangler.jsonc           # Cloudflare Workers and D1 binding configuration
```

## Local Development

### Prerequisites

- Node.js 20+
- npm 10+

### Setup

1. Install dependencies:

```bash
npm install
```

2. Create a local environment file from the template:

```bash
cp .env.example .env
```

3. Generate the Prisma client and Cloudflare Worker types:

```bash
npm run db:generate
npm run cf-typegen
```

4. Apply the D1 database migrations locally:

```bash
npm run db:migrate:local
```

5. Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:4321`.

## Database Workflow

Schema definitions live in `prisma/schema.prisma`. To generate a new SQL migration for Cloudflare D1:

```bash
npx prisma migrate diff \
  --from-empty \
  --to-schema-datamodel prisma/schema.prisma \
  --script > migrations/0001_init.sql
```

Apply migrations locally or to the remote D1 database:

```bash
npm run db:migrate:local
npm run db:migrate:remote
```

## Deployment

Production builds target Cloudflare Workers with a `DB` D1 binding configured in `wrangler.jsonc`.

1. Verify the production build locally against the Workers runtime:

```bash
npm run preview
```

2. Configure required runtime secrets in Cloudflare:

```bash
npx wrangler secret put SESSION_SECRET
npx wrangler secret put ADMIN_EMAIL
npx wrangler secret put ADMIN_PASSWORD
```

3. Apply remote D1 migrations and deploy:

```bash
npm run db:migrate:remote
npm run deploy
```

## Quality Checks

```bash
npm run typecheck
npm run build
npm run test:e2e
```

## License

MIT
