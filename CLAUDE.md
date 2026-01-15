# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server with Turbopack (http://localhost:3000)
npm run build        # Production build
npm run lint         # ESLint
npm run start        # Start production server
npm run format       # Format code with Prettier
```

## Architecture

This is a Next.js 15 (App Router) + Supabase + Tailwind CSS app for coordinating group bike rides.

### Directory Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (app)/             # App layout group
│   ├── rides/             # Ride pages (list, detail, new)
│   ├── settings/          # User settings
│   ├── login/, signup/    # Auth pages
│   └── api/               # API routes
├── components/            # React components
│   ├── ui/               # Radix-based UI primitives (shadcn/ui)
│   ├── ride-card.tsx     # Ride display card
│   ├── create-ride-form.tsx
│   ├── profile-menu.tsx
│   └── community-menu.tsx
├── contexts/              # React context providers
│   └── UserContext.tsx   # Current user state
├── lib/
│   ├── supabase/         # Supabase clients
│   │   ├── client.ts     # Browser client
│   │   ├── server.ts     # Server client
│   │   └── types.ts      # Database types
│   └── utils.ts          # Utility functions
└── middleware.ts         # Auth middleware
```

### Path Alias

`@/*` → `./src/*`

### Database Tables

- `users` - User profiles (id, name, email, avatar_url, is_admin)
- `groups` - Ride groups
- `user_group` - User-group membership
- `rides` - Ride events (ride_time, distance, pace, bike_type, created_by)
- `ride_participants` - Participation with status (pending/accepted/declined)

### Key Patterns

**Supabase Clients**: Use `createClient()` from `@/lib/supabase/client` in client components, `@/lib/supabase/server` in server components.

**User Context**: `UserContext` provides current user state. Use `useUser()` hook.

**Real-time**: Rides and participants use Supabase real-time subscriptions for live updates.

**RLS**: Row Level Security policies protect all tables. Users can only modify their own data.

## Supabase

```bash
npx supabase link --project-ref fuisrstmdpqhvtlcswox
npx supabase db push         # Push migrations
npx supabase db pull         # Pull remote schema
npx supabase gen types ts    # Generate TypeScript types
```

Migrations are in `supabase/migrations/`.
