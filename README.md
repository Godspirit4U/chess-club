# Chess Club Website

Web platform for the university chess club. Tournaments with Swiss, round-robin, knockout
and group-stage pairings; live points tables; match pages with PGN replay; daily puzzles; a
blog; and a members-only community with realtime chat.

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14, App Router, TypeScript |
| Database | Supabase Postgres |
| Authentication | Supabase Auth, email and password |
| File storage | Supabase Storage |
| Realtime | Supabase Realtime, used for chat |
| Hosting | Vercel |

## Getting started

Requirements: Node 20 or later, and a Supabase project.

```bash
git clone https://github.com/Godspirit4U/chess-club.git
cd chess-club
npm install
cp .env.example .env.local
npm run dev
```

The site runs at `http://localhost:3000`.

## Environment variables

| Name | Where it comes from | Exposed to the browser |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase, Project settings, API | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase, Project settings, API | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase, Project settings, API | **No. Server only** |
| `NEXT_PUBLIC_SITE_URL` | The deployed URL | Yes |

The service role key bypasses row level security. It must never appear in client code or
in the repository.

## Database

Run `supabase/schema.sql` once in the Supabase SQL editor. It creates eleven tables, the
row level security policies, the profile trigger, and enables realtime on `messages`.

## First administrator

1. Sign up through the site with your own email.
2. Run this once in the SQL editor:

```sql
update profiles set role = 'super_admin' where email = 'your-email@example.com';
```

Further administrators are promoted from `/admin/people` by email.

## Project structure

```
app/
  page.tsx              home
  tournaments/          list, single tournament, match pages
  blog/                 post list and single post
  puzzles/              daily puzzle and archive
  events/               all club events
  community/            directory, general room, direct messages
  profile/              the signed-in member
  admin/                admin area, behind login
  layout.tsx            shell, metadata
  globals.css           design tokens and base styles
components/             shared UI
lib/supabase/           browser and server clients
supabase/
  schema.sql            tables, policies, triggers
```

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |

## Deployment

Vercel builds from `main` on every push. Set the two public environment variables in the
Vercel project settings before the first deploy.

## Related repositories and documents

- `Godspirit4U/chess-club-backups` — weekly database dumps, private. Contains the scheduled
  workflow at `.github/workflows/backup.yml`.
- `HANDOVER.md` — accounts, access and the transfer checklist between committees.
- `supabase/schema.sql` — the data model, readable as the specification.
