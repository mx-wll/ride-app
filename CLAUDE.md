# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server with Turbopack (http://localhost:3000)
npm run build        # Production build
npm run lint         # ESLint
npm run start        # Start production server
```

## Architecture

This is a Next.js 15 (App Router) + Supabase + Tailwind CSS app for coordinating group bike rides.

### Directory Structure

- `src/app/` - Next.js App Router pages and API routes
  - `(app)/` - App layout group (authenticated pages)
  - `rides/` - Ride listing, detail, and creation pages
  - `settings/` - User settings
  - `login/`, `signup/` - Auth pages
  - `api/rides/` - API routes
- `src/components/` - React components
  - `ui/` - Radix-based UI primitives (shadcn/ui style)
- `src/lib/supabase/` - Supabase client setup (client.ts, server.ts, middleware.ts, types.ts)
- `src/contexts/` - React context providers (UserContext)
- `supabase/migrations/` - Database migrations

### Path Alias

```
@/* -> ./src/*
```

### Database Tables

- `users` - User profiles (id, name, email, avatar_url, is_admin)
- `groups` - Ride groups
- `user_group` - User-group membership (many-to-many)
- `rides` - Ride events (ride_time, distance, avg_speed, created_by, group_id)
- `ride_participants` - Ride participation with status (pending/accepted/declined)

Types are defined in `src/lib/supabase/types.ts`.

### Key Patterns

**Supabase Clients**: Use `createClient()` from `@/lib/supabase/client` in client components, `@/lib/supabase/server` in server components.

**User Context**: `UserContext` provides current user state across the app.

**Auth Flow**: Middleware handles session refresh. Login/signup pages use Supabase Auth.

## Supabase Local Development

```bash
npx supabase start      # Start local Supabase
npx supabase db reset   # Reset and run all migrations
npx supabase stop       # Stop local Supabase
```

Migrations are in `supabase/migrations/` with format `YYYYMMDDHHMMSS_description.sql`.
