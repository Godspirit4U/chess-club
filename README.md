# Chess club website

Tournaments, pairings, puzzles, blog and a members-only community for a student chess club.

## Stack

- **Next.js** (App Router, TypeScript), deployed on Vercel
- **Supabase** for database, authentication, file storage and realtime chat
- Plain CSS with design tokens in `app/globals.css`. No CSS framework, no component library.

## Setup

1. Create a Supabase project, then run `supabase/schema.sql` in the SQL editor.
2. Copy `.env.example` to `.env.local` and fill in the URL and anon key.
3. `npm install && npm run dev`

## First admin

Sign up through the site with your own email, then run this once in the SQL editor:

```sql
update profiles set role = 'super_admin' where email = 'your-email@example.com';
```

Everyone else is promoted from `/admin/people` by typing their college email.

## Structure

```
app/                  pages (App Router)
  admin/              admin area, behind login
  tournaments/        list, single tournament, match pages
  blog/ puzzles/ events/ community/ about/ contact/ profile/
components/           shared UI
lib/supabase/         browser and server clients
supabase/schema.sql   tables, row level security, triggers
```

## Rules this project holds itself to

- No lorem ipsum. A section without real copy does not ship.
- No gradients, glass cards, glowing orbs, dot grids or hover animations.
- One accent colour. Status is carried by a label, never by colour alone.
- Phone first: every page is designed at 375px wide before desktop.
- Images: 1600px longest edge for blog and hero, 512px square for avatars, WebP, quality 80.
