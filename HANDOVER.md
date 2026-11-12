# Handover

Procedures for transferring the site between committees. Execute two months before the
outgoing committee graduates.

## Recovery model

The application can be rebuilt from three artefacts:

1. The repository, containing the application code.
2. `supabase/schema.sql`, containing the tables, policies and triggers.
3. The most recent dump in `chess-club-backups`, containing the data.

Hosting and database providers are replaceable. Estimated rebuild time from these three
artefacts: one evening.

## Accounts and ownership

| Service | Purpose | Current owner | Successor access |
|---|---|---|---|
| GitHub `chess-club` | Source code | Project author | Public repository; transferable |
| GitHub `chess-club-backups` | Weekly database dumps | Project author | Two collaborators, minimum |
| Vercel | Hosting and deployment | Project author | Project transfer, or account credentials |
| Supabase | Database, authentication, storage | Project author | Organisation owner, or account credentials |
| Domain registrar | Custom domain, if purchased | Project author | Account credentials |

Vercel's free plan does not support team members, so access is granted either by
transferring the project or by handing over credentials.

## Security requirements

- Two-factor authentication must use an authenticator application. A personal phone number
  cannot be used, because the number leaves the institution with the person.
- Backup codes are stored with the credentials, not in a messaging application.
- The Supabase service role key is never placed in the repository, in client code, or in
  any environment variable prefixed `NEXT_PUBLIC_`.
- No single person holds sole access to the database, the backups, and the hosting account.

## Handover schedule

| When | Action | Confirmation |
|---|---|---|
| Two months before | Add the incoming president and secretary as `super_admin` through `/admin/people` | Both accounts sign in and reach `/admin` |
| One month before | Add the incoming president as a collaborator on `chess-club-backups` | A scheduled run completes and appears in the repository |
| Two weeks before | Transfer the Vercel project and Supabase organisation, or hand over credentials | New owner opens both dashboards independently |
| One week before | Incoming team changes every account password; outgoing owner is removed | Each account is opened by the new owner alone |
| Final week | Remove the outgoing owner's personal access; retain their email as a recovery contact only if requested | Access list reviewed |

## Rebuild procedure

1. Clone the repository.
2. Create a Supabase project and run `supabase/schema.sql`.
3. Restore the most recent dump from `chess-club-backups`.
4. Deploy to any host that runs Next.js and set the environment variables listed in
   `README.md`.
5. Verify sign-in, the tournament list and the general chat.

## Data coverage

A dump contains all rows present at the time it runs: profiles, tournaments, registrations,
rounds, matches, posts, events, puzzles, solves, conversations and messages.

Not recoverable after a dump: messages sent, photos uploaded and results entered after that
point. Weekly dumps limit the loss to seven days.

## Outstanding items

- A custom domain has not been purchased.
- The club email address has not been created.
