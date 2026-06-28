# ThuisZorgHub - Project Setup & Architecture

## Overview

ThuisZorgHub is a production-ready SaaS application for homecare agencies in the Netherlands. This document describes the project structure, configuration, and setup.

## Technology Stack

### Core Framework

- **Next.js 15** - React framework for production
- **React 19** - UI library
- **TypeScript** - Type safety and development experience

### UI & Styling

- **Tailwind CSS v4** - Utility-first CSS framework
- **shadcn/ui** - High-quality React components (ready for installation)
- **Lucide React** - Icon library
- **Tailwind Animate** - CSS animations for Tailwind

### State Management & Data Fetching

- **TanStack Query** - Server state management
- **React Hook Form** - Efficient form handling
- **Zod** - Schema validation

### Backend & Database

- **Supabase** - PostgreSQL database with auth
- **Next.js API Routes** - Serverless functions

### Internationalization

- **next-intl** - Multi-language support (English & Dutch)

### Development Tools

- **TypeScript** - Static type checking
- **ESLint** - Code quality
- **Prettier** - Code formatting
- **Husky** - Git hooks
- **lint-staged** - Pre-commit linting

## Folder Structure

```
thuiszorghub/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API routes (future)
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Home page
│   │   └── globals.css        # Global styles
│   │
│   ├── components/            # Reusable React components
│   │   ├── ui/               # Shadcn/ui components (auto-generated)
│   │   └── layout/           # Layout components (Header, Sidebar, etc.)
│   │
│   ├── features/             # Feature-specific modules
│   │   ├── auth/            # Authentication module
│   │   ├── organizations/   # Organization management
│   │   ├── branches/        # Branch management
│   │   ├── users/           # User management
│   │   ├── roles/           # Role & permission management
│   │   ├── dashboard/       # Dashboard module
│   │   └── ...              # Other feature modules
│   │
│   ├── hooks/               # Custom React hooks
│   │   └── useXxx.ts
│   │
│   ├── lib/                 # Utilities and helpers
│   │   ├── supabase.ts      # Supabase client
│   │   ├── api.ts           # API utilities
│   │   └── utils.ts         # Helper functions
│   │
│   ├── services/            # Business logic services
│   │   ├── auth.ts
│   │   ├── organizations.ts
│   │   └── ...
│   │
│   ├── types/               # TypeScript type definitions
│   │   └── index.ts
│   │
│   ├── utils/               # Utility functions
│   │   ├── cn.ts           # Class name utilities
│   │   ├── date.ts         # Date utilities
│   │   └── ...
│   │
│   ├── config/              # Configuration files
│   │   └── i18n.ts         # Internationalization config
│   │
│   ├── middleware.ts        # Next.js middleware
│   │
│   └── i18n/               # Translation files
│       ├── nl.json         # Dutch translations
│       └── en.json         # English translations
│
├── config/                  # Configuration directories
│   └── supabase/           # Supabase migrations (future)
│
├── public/                 # Static assets
│   └── images/            # Image files
│
├── docs/                   # Project documentation
│   ├── ThuisZorgHub - Master Software Specification v1.0.md
│   └── Sprint-01-Foundation.md
│
├── .husky/                 # Git hooks
│   └── pre-commit         # Pre-commit hook (linting)
│
├── .env.example           # Environment variables template
├── .env.local             # Local environment variables (gitignored)
├── .eslintrc.mjs          # ESLint configuration
├── .prettierrc             # Prettier configuration
├── .prettierignore         # Prettier ignore rules
├── .gitignore             # Git ignore rules
├── next.config.ts         # Next.js configuration
├── tsconfig.json          # TypeScript configuration
├── tailwind.config.ts     # Tailwind CSS configuration
├── postcss.config.mjs     # PostCSS configuration
├── package.json           # Dependencies and scripts
└── README.md              # Project README

```

## Key Folders Explained

### `/src/app`

Next.js App Router directory. Contains all page routes and layouts.

### `/src/components`

Reusable React components used throughout the application.

- `ui/` - Auto-generated shadcn/ui components
- `layout/` - Layout components like Header, Sidebar, Footer

### `/src/features`

Feature-specific business logic, organized by module.
Each feature folder contains its own components, hooks, and services.

### `/src/hooks`

Custom React hooks for shared functionality.

### `/src/lib`

Low-level utilities:

- Database clients (Supabase)
- API client configurations
- Common helper functions

### `/src/services`

Business logic layer between components and API.

### `/src/types`

TypeScript type definitions and interfaces.

### `/src/utils`

Helper functions:

- `cn.ts` - Class name utility (clsx + tailwind-merge)
- Date/time formatting
- String formatting
- Validation helpers

### `/src/config`

Application configuration:

- Internationalization setup
- Feature flags (future)
- Constants

### `/src/middleware.ts`

Next.js middleware for:

- Authentication checks
- Localization routing
- Request logging

### `/src/i18n`

Translation files (JSON):

- `nl.json` - Dutch translations
- `en.json` - English translations

## Dependencies Explained

### Core Dependencies

| Package      | Purpose         | Version |
| ------------ | --------------- | ------- |
| `next`       | React framework | 16.2.9  |
| `react`      | UI library      | 19.2.4  |
| `react-dom`  | React DOM       | 19.2.4  |
| `typescript` | Type safety     | ^5      |

### UI & Styling

| Package                    | Purpose                      |
| -------------------------- | ---------------------------- |
| `tailwindcss`              | CSS framework                |
| `tailwindcss-animate`      | Animation utilities          |
| `lucide-react`             | Icon library                 |
| `clsx`                     | Class name utility           |
| `class-variance-authority` | Component variant system     |
| `tailwind-merge`           | Smart Tailwind class merging |

### State & Forms

| Package                 | Purpose                  |
| ----------------------- | ------------------------ |
| `@tanstack/react-query` | Server state management  |
| `react-hook-form`       | Form state management    |
| `@hookform/resolvers`   | Form validation adapters |
| `zod`                   | Schema validation        |

### Backend & Data

| Package                 | Purpose         |
| ----------------------- | --------------- |
| `@supabase/supabase-js` | Supabase client |

### Internationalization

| Package     | Purpose                |
| ----------- | ---------------------- |
| `next-intl` | Multi-language support |

### Development Tools

| Package                            | Purpose                  |
| ---------------------------------- | ------------------------ |
| `eslint`                           | Code linting             |
| `prettier`                         | Code formatting          |
| `husky`                            | Git hooks                |
| `lint-staged`                      | Pre-commit linting       |
| `@typescript-eslint/parser`        | TypeScript ESLint parser |
| `@typescript-eslint/eslint-plugin` | TypeScript ESLint rules  |

## Configuration Files

### `next.config.ts`

Next.js configuration with:

- Internationalization settings
- Image optimization
- Compiler options

### `tailwind.config.ts`

Tailwind CSS configuration with:

- Design system colors
- Typography
- Custom utilities

### `tsconfig.json`

TypeScript configuration with:

- Strict mode enabled
- Path aliases (@/*)
- Module resolution

### `.eslintrc.mjs`

ESLint rules for:

- Next.js best practices
- TypeScript linting
- Code quality

### `.prettierrc`

Code formatting rules:

- 2-space indentation
- Single quotes for strings
- Semicolons enabled
- 100-character line width

### `package.json`

Scripts:

- `npm run dev` - Development server
- `npm run build` - Production build
- `npm run start` - Production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix linting issues
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check formatting
- `npm run type-check` - Type checking

## Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Getting Started

1. Install dependencies: `npm install`
2. Set up environment variables: `cp .env.example .env.local`
3. Start development server: `npm run dev`
4. Open http://localhost:3000

## Code Quality

The project uses:

- **Pre-commit hooks** via Husky to run linting and formatting
- **lint-staged** to only lint changed files
- **ESLint** for code quality
- **Prettier** for code formatting
- **TypeScript** for type safety

Run before committing:

```bash
npm run lint:fix
npm run format
npm run type-check
```

## Design System

Colors (defined in `/src/app/globals.css`):

- Primary: #2563EB (Blue)
- Success: #16A34A (Green)
- Warning: #F59E0B (Amber)
- Danger: #DC2626 (Red)
- Background Light: #F8FAFC
- Border: #E5E7EB

Typography:

- Font: Inter
- Headings: Bold, SemiBold
- Body: 16px Regular
- Captions: 14px Regular

## Next Steps

1. Review the Master Software Specification in `/docs`
2. Review Sprint 01 Foundation requirements in `/docs/Sprint-01-Foundation.md`
3. Begin implementing authentication module
4. Set up Supabase database
5. Create database migrations

## Support

For architecture decisions and development standards, refer to:

- Master Software Specification: `/docs/ThuisZorgHub - Master Software Specification v1.0.md`
- Sprint 01 Plan: `/docs/Sprint-01-Foundation.md`
