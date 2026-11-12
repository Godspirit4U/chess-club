-- Chess club website: database schema
-- Run against a fresh Supabase project in the SQL editor, in one pass.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- types
create type user_role          as enum ('member', 'admin', 'super_admin');
create type tournament_format  as enum ('swiss', 'round_robin', 'knockout', 'groups_knockout', 'custom');
create type tournament_status  as enum ('draft', 'open', 'running', 'completed');
create type match_result       as enum ('white', 'black', 'draw', 'bye', 'forfeit_white', 'forfeit_black', 'unplayed');
create type event_kind         as enum ('tournament', 'training', 'casual', 'other');
create type room_type          as enum ('general', 'admin', 'dm');

-- ---------------------------------------------------------------- people
create table profiles (
  id             uuid primary key references auth.users on delete cascade,
  email          text not null unique,
  full_name      text not null,
  avatar_path    text,
  chess_username text,
  year           int,
  department     text,
  role           user_role not null default 'member',
  created_at     timestamptz not null default now()
);

create index profiles_role_idx on profiles (role);

create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from profiles p
    where p.id = auth.uid() and p.role in ('admin', 'super_admin')
  );
$$;

create or replace function is_super_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from profiles p
    where p.id = auth.uid() and p.role = 'super_admin'
  );
$$;

-- A profile is created the moment someone signs up.
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(coalesce(new.email, 'member'), '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ---------------------------------------------------------------- tournaments
create table tournaments (
  id                    uuid primary key default gen_random_uuid(),
  slug                  text not null unique,
  name                  text not null,
  description           text,
  format                tournament_format not null default 'swiss',
  rounds                int  not null default 5,
  time_control          text not null default '10+5',
  rules                 text,
  structure             text,
  starts_at             timestamptz,
  ends_at               timestamptz,
  registration_deadline timestamptz,
  status                tournament_status not null default 'draft',
  points_win            numeric(3,1) not null default 1,
  points_draw           numeric(3,1) not null default 0.5,
  points_loss           numeric(3,1) not null default 0,
  created_by            uuid references profiles (id),
  created_at            timestamptz not null default now()
);

create index tournaments_status_idx on tournaments (status, starts_at desc);

create table tournament_players (
  id            uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references tournaments (id) on delete cascade,
  profile_id    uuid not null references profiles (id) on delete cascade,
  seed          int,
  registered_at timestamptz not null default now(),
  withdrawn_at  timestamptz,
  unique (tournament_id, profile_id)
);

create index tournament_players_tid_idx on tournament_players (tournament_id);

create table rounds (
  id            uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references tournaments (id) on delete cascade,
  number        int  not null,
  published_at  timestamptz,
  unique (tournament_id, number)
);

create table matches (
  id            uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references tournaments (id) on delete cascade,
  round_id      uuid not null references rounds (id) on delete cascade,
  board         int  not null,
  white_id      uuid references profiles (id),
  black_id      uuid references profiles (id),
  result        match_result not null default 'unplayed',
  pgn           text,
  ended_at      timestamptz,
  note          text,
  unique (round_id, board)
);

create index matches_tid_idx on matches (tournament_id);

-- ---------------------------------------------------------------- content
create table posts (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  title        text not null,
  excerpt      text,
  body         text not null,
  cover_path   text,
  author_id    uuid references profiles (id),
  published_at timestamptz,
  created_at   timestamptz not null default now()
);

create index posts_published_idx on posts (published_at desc nulls last);

create table events (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  title         text not null,
  description   text,
  kind          event_kind not null default 'other',
  starts_at     timestamptz not null,
  ends_at       timestamptz,
  location      text,
  tournament_id uuid references tournaments (id) on delete set null,
  created_by    uuid references profiles (id),
  created_at    timestamptz not null default now()
);

create index events_starts_idx on events (starts_at desc);

-- ---------------------------------------------------------------- puzzles
create table puzzles (
  id            uuid primary key default gen_random_uuid(),
  puzzle_date   date not null unique,
  fen           text not null,
  solution      text not null,          -- moves in SAN, space separated
  side_to_move  text not null default 'w',
  note          text,
  created_by    uuid references profiles (id),
  created_at    timestamptz not null default now()
);

create table puzzle_solves (
  id         uuid primary key default gen_random_uuid(),
  puzzle_id  uuid not null references puzzles (id) on delete cascade,
  profile_id uuid not null references profiles (id) on delete cascade,
  attempts   int  not null default 1,
  first_try  boolean not null default false,
  solved_at  timestamptz not null default now(),
  unique (puzzle_id, profile_id)
);

create index puzzle_solves_profile_idx on puzzle_solves (profile_id);

-- ---------------------------------------------------------------- community
create table conversations (
  id         uuid primary key default gen_random_uuid(),
  user_a     uuid not null references profiles (id) on delete cascade,
  user_b     uuid not null references profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_a, user_b),
  check (user_a < user_b)
);

create table messages (
  id              uuid primary key default gen_random_uuid(),
  room            room_type not null,
  conversation_id uuid references conversations (id) on delete cascade,
  sender_id       uuid not null references profiles (id) on delete cascade,
  body            text not null check (char_length(body) between 1 and 2000),
  created_at      timestamptz not null default now(),
  deleted_at      timestamptz,
  check (
    (room = 'dm'    and conversation_id is not null) or
    (room <> 'dm'   and conversation_id is null)
  )
);

create index messages_general_idx on messages (room, created_at desc);
create index messages_dm_idx      on messages (conversation_id, created_at desc);

-- ---------------------------------------------------------------- row level security
alter table profiles           enable row level security;
alter table tournaments        enable row level security;
alter table tournament_players enable row level security;
alter table rounds             enable row level security;
alter table matches            enable row level security;
alter table posts              enable row level security;
alter table events             enable row level security;
alter table puzzles            enable row level security;
alter table puzzle_solves      enable row level security;
alter table conversations      enable row level security;
alter table messages           enable row level security;

-- profiles: everyone signed in can see the directory; only you edit your own row,
-- and only a super admin can change a role.
create policy profiles_read on profiles
  for select using (auth.role() = 'authenticated');

create policy profiles_update_own on profiles
  for update using (id = auth.uid())
  with check (id = auth.uid() and role = (select role from profiles where id = auth.uid()));

create policy profiles_admin_all on profiles
  for all using (is_super_admin()) with check (is_super_admin());

-- public content: readable by anyone, writable by admins
create policy tournaments_read  on tournaments for select using (true);
create policy tournaments_write on tournaments for all    using (is_admin()) with check (is_admin());

create policy players_read  on tournament_players for select using (true);
create policy players_write on tournament_players for all    using (is_admin()) with check (is_admin());

create policy rounds_read  on rounds  for select using (true);
create policy rounds_write on rounds  for all    using (is_admin()) with check (is_admin());

create policy matches_read  on matches for select using (true);
create policy matches_write on matches for all    using (is_admin()) with check (is_admin());

create policy posts_read  on posts  for select using (true);
create policy posts_write on posts  for all    using (is_admin()) with check (is_admin());

create policy events_read  on events for select using (true);
create policy events_write on events for all    using (is_admin()) with check (is_admin());

create policy puzzles_read  on puzzles for select using (true);
create policy puzzles_write on puzzles for all    using (is_admin()) with check (is_admin());

-- puzzle solves: you see your own, admins see all, you insert your own only
create policy solves_read_own on puzzle_solves
  for select using (profile_id = auth.uid() or is_admin());

create policy solves_insert_own on puzzle_solves
  for insert with check (profile_id = auth.uid());

-- conversations: only the two people in them
create policy conversations_read on conversations
  for select using (auth.uid() in (user_a, user_b));

create policy conversations_insert on conversations
  for insert with check (auth.uid() in (user_a, user_b));

-- messages: general room for all signed-in members, admin room for admins,
-- a direct message only for its two participants
create policy messages_read on messages
  for select using (
    (room = 'general' and auth.role() = 'authenticated')
    or (room = 'admin' and is_admin())
    or (room = 'dm' and exists (
          select 1 from conversations c
          where c.id = messages.conversation_id
            and auth.uid() in (c.user_a, c.user_b)))
  );

create policy messages_insert on messages
  for insert with check (
    sender_id = auth.uid()
    and (
      (room = 'general' and auth.role() = 'authenticated')
      or (room = 'admin' and is_admin())
      or (room = 'dm' and exists (
            select 1 from conversations c
            where c.id = messages.conversation_id
              and auth.uid() in (c.user_a, c.user_b)))
    )
  );

-- authors delete their own message; admins delete anything in the general room
create policy messages_delete on messages
  for delete using (
    sender_id = auth.uid()
    or (is_admin() and room = 'general')
  );

-- ---------------------------------------------------------------- realtime
alter publication supabase_realtime add table messages;

-- ---------------------------------------------------------------- seed
-- First admin. Run this once, after signing up through the site with your own email.
-- update profiles set role = 'super_admin' where email = 'your-personal-email@example.com';
