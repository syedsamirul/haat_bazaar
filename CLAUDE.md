# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Bazaarly** (formerly Haat Bazaar) is an f-commerce (Facebook-commerce) aggregator platform for Instagram-based small businesses in Bangladesh. Vendors connect their Instagram pages to showcase products, and buyers browse, search, and discover sellers directly from the platform.

### Core Features
- Vendor discovery and browsing (by name, category, verification status)
- Product catalog per vendor
- Search and filtering across vendors
- Vendor profile pages with products
- Vendor registration flow

### Architecture

**Frontend:** Next.js 15+ with TypeScript and Tailwind CSS (App Router)
**Backend:** Supabase (PostgreSQL + Auth)
**Authentication:** Supabase Auth (vendor registration & login)
**Database:** PostgreSQL via Supabase

### Project Structure

```
haat-bazaar/
├── app/
│   ├── (auth)/              # Auth-related pages (login, register)
│   ├── vendors/             # Main vendor browsing & listing
│   │   ├── page.tsx         # Vendor directory
│   │   ├── [id]/            # Individual vendor detail
│   │   └── new/             # Vendor registration form
│   ├── api/                 # API routes (Supabase operations)
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Home page
├── components/
│   ├── VendorCard.tsx       # Vendor card component
│   ├── SearchBar.tsx        # Search & filter controls
│   ├── ProductCard.tsx      # Product display
│   └── Navigation.tsx       # Top navigation
├── lib/
│   ├── supabase.ts          # Supabase client init
│   ├── types.ts             # TypeScript types (Vendor, Product, etc.)
│   └── utils.ts             # Helper functions
├── .env.local               # Local environment variables (Supabase keys)
├── tailwind.config.ts       # Tailwind configuration
└── tsconfig.json            # TypeScript configuration
```

## Common Commands

### Development
```bash
npm run dev
```
Starts the dev server at http://localhost:3000

### Build
```bash
npm run build
```
Builds the project for production

### Start Production Server
```bash
npm start
```
Runs the production build locally

### Linting & Type Checking
```bash
npm run lint
```
Runs ESLint to check code quality

### Running Tests
```bash
npm test
```
Run test suite (configure as needed)

## Database Schema

Key Supabase tables:

### `vendors` table
- `id` (UUID, primary key)
- `instagram_handle` (text, unique)
- `shop_name` (text)
- `description` (text)
- `profile_image_url` (text)
- `follower_count` (integer)
- `category` (text enum: clothing, accessories, beauty, crafts, food, other)
- `verified` (boolean)
- `created_at` (timestamp)
- `updated_at` (timestamp)

### `products` table
- `id` (UUID, primary key)
- `vendor_id` (UUID, foreign key → vendors)
- `name` (text)
- `description` (text)
- `price` (decimal)
- `image_url` (text)
- `category` (text)
- `in_stock` (boolean)
- `created_at` (timestamp)
- `updated_at` (timestamp)

### `users` (Supabase Auth)
- Auto-managed by Supabase Auth
- Linked to vendor profiles via `auth.uid`

## Environment Setup

Create `.env.local` in the project root:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Get these from your Supabase project settings (Project Settings → API).

## Development Notes

### Supabase Client Usage

The Supabase client is initialized in `lib/supabase.ts` and exported for use throughout the app:

```typescript
import { supabase } from '@/lib/supabase'

// Fetch vendors
const { data, error } = await supabase
  .from('vendors')
  .select('*')
  .eq('verified', true)
```

### Data Types

TypeScript types are defined in `lib/types.ts`. Use these when fetching data:

```typescript
import { Vendor, Product, SearchFilters } from '@/lib/types'
```

### Component Patterns

- Use `'use client'` at the top of components that need interactivity (state, hooks, events)
- Server components by default for better performance
- Tailwind classes for styling (no separate CSS files needed)

### Search & Filtering

The `SearchBar` component handles vendor filtering by:
- Search term (vendor name or description)
- Category
- Verification status

Filters are passed to the `VendorsPage` via callback and applied with `.ilike()` queries.

### Styling

- Tailwind CSS with default Next.js config
- Color palette: Amber/orange for primary branding
- Responsive breakpoints: `sm:`, `md:`, `lg:`

## Deployment

Deploy to Vercel:

1. Push to GitHub
2. Import project in Vercel
3. Set environment variables in Vercel project settings
4. Deploy automatically on push to main

For other platforms, ensure Node.js environment and set the same environment variables.

## Key Dependencies

- `next`: Full-stack React framework
- `@supabase/supabase-js`: Supabase client library
- `tailwindcss`: Utility-first CSS framework
- `typescript`: Type safety
- `eslint`: Code linting

## Conventions

- Use TypeScript for all code (`.ts` / `.tsx`)
- Component files: PascalCase (e.g., `VendorCard.tsx`)
- Page routes: lowercase (e.g., `vendors/page.tsx`)
- Folder structure follows Next.js App Router conventions
- Import aliases: Use `@/` prefix for absolute imports (configured in `tsconfig.json`)
