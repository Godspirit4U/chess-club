# Handover

Everything the next committee needs when this one graduates. Read it before your final
semester, not during it.

## The principle

The site is not the thing that must survive. The **code, the schema and the backups** must
survive. With those three, the site can be rebuilt on any host in an afternoon. Hosting is
rented; the repository is owned.

## The accounts

| What | Where it lives | Who else must have access |
|---|---|---|
| Code | GitHub repo `chess-club` (public) | Anyone: it is public, so the code cannot be lost |
| Hosting | Vercel project | The club account, plus one successor as project owner |
| Database and storage | Supabase project `chess-club` | The club account, plus one successor as organisation owner |
| Backups | Private repo `chess-club-backups` | Two collaborators, always |
| Domain, if bought | Registrar | The club account, plus one successor |

## Two-factor authentication

Never attach 2FA to a personal phone number. When that person leaves, the account is
locked and nobody can recover it.

Use an authenticator app instead, and store the backup codes in the sealed handover
envelope, not in a chat message. If a platform insists on a phone number, use one the club
controls.

## The handover, in order

1. **Two months out.** Add the incoming president and secretary to the site as
   `super_admin` through `/admin/people`. Both accounts must work before you leave.
2. **One month out.** Add the incoming president as a collaborator on the backups repo.
   Confirm a backup runs and lands with their name on it.
3. **Two weeks out.** Transfer ownership, or hand over credentials through the sealed
   envelope: Vercel project, Supabase organisation, domain registrar. Not by WhatsApp.
4. **One week out.** The incoming team changes the password on every account while you
   watch, and you are removed as an owner. If they cannot do it without you, the handover
   has failed.
5. **On the day.** Delete your personal access. Leave your email as a recovery contact on
the club account only if the new committee asks.

## If a platform disappears

Free tiers change. If Vercel or Supabase ever withdraws its free plan, or the project is
lost:

1. `git clone` the public repo. That is the whole application.
2. Restore the database from the newest file in `chess-club-backups`.
3. Deploy the repo to any host that runs Next.js. Change two environment variables.

Budget: one evening. That is the insurance policy, and it is why the backup repo matters
more than the hosting choice.

## What is not recoverable

Chat history older than the last backup, and profile photos uploaded since then. Everything
else — members, tournaments, results, points tables, blog posts, puzzles — is in the dump.

## The one rule

No single person should be able to destroy the club's records. If one account, one phone
number or one password stands between the club and its history, fix that before the
semester ends.
