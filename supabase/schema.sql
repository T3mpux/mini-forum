-- Mini Forum — database schema, row level security and triggers.
-- Run once in the Supabase SQL editor (Dashboard → SQL Editor → New query → Run).

-- ─────────────────────────────────────────────────────────────────────────────
-- Tables
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  username   text not null unique check (username ~ '^[a-z0-9_]{3,20}$'),
  created_at timestamptz not null default now()
);

create table if not exists public.posts (
  id         uuid primary key default gen_random_uuid(),
  author_id  uuid not null references public.profiles (id) on delete cascade,
  title      text not null check (char_length(title) between 3 and 120),
  body       text not null check (char_length(body) between 1 and 5000),
  created_at timestamptz not null default now()
);

create table if not exists public.comments (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.posts (id) on delete cascade,
  author_id  uuid not null references public.profiles (id) on delete cascade,
  body       text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index if not exists posts_created_at_idx on public.posts (created_at desc);
create index if not exists comments_post_id_idx on public.comments (post_id, created_at);

-- ─────────────────────────────────────────────────────────────────────────────
-- Row level security
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.profiles enable row level security;
alter table public.posts    enable row level security;
alter table public.comments enable row level security;

-- Profiles: public to read, editable only by their owner.
drop policy if exists "profiles are public" on public.profiles;
create policy "profiles are public"
  on public.profiles for select
  using (true);

drop policy if exists "users update their own profile" on public.profiles;
create policy "users update their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Posts: readable by anyone (including anonymous visitors), writable only by
-- the signed-in author. RLS is the real guard here — the UI check is cosmetic.
drop policy if exists "posts are public" on public.posts;
create policy "posts are public"
  on public.posts for select
  using (true);

drop policy if exists "authors insert their own posts" on public.posts;
create policy "authors insert their own posts"
  on public.posts for insert
  to authenticated
  with check (auth.uid() = author_id);

drop policy if exists "authors update their own posts" on public.posts;
create policy "authors update their own posts"
  on public.posts for update
  to authenticated
  using (auth.uid() = author_id)
  with check (auth.uid() = author_id);

drop policy if exists "authors delete their own posts" on public.posts;
create policy "authors delete their own posts"
  on public.posts for delete
  to authenticated
  using (auth.uid() = author_id);

-- Comments: same rules, one level deeper.
drop policy if exists "comments are public" on public.comments;
create policy "comments are public"
  on public.comments for select
  using (true);

drop policy if exists "authors insert their own comments" on public.comments;
create policy "authors insert their own comments"
  on public.comments for insert
  to authenticated
  with check (auth.uid() = author_id);

drop policy if exists "authors delete their own comments" on public.comments;
create policy "authors delete their own comments"
  on public.comments for delete
  to authenticated
  using (auth.uid() = author_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- Profile bootstrap: every new auth user gets a profile row.
-- security definer is required because the inserting role cannot read
-- auth.users directly.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  desired text;
begin
  desired := lower(coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1)));
  -- Keep it inside the check constraint even if the signup payload is odd
  -- (phone-only signups have no email and no metadata).
  desired := regexp_replace(coalesce(desired, ''), '[^a-z0-9_]', '', 'g');

  if char_length(desired) < 3 then
    desired := 'user_' || substr(replace(new.id::text, '-', ''), 1, 8);
  end if;

  if char_length(desired) > 20 then
    desired := substr(desired, 1, 20);
  end if;

  insert into public.profiles (id, username)
  values (new.id, desired)
  on conflict (id) do nothing;

  return new;
exception
  when unique_violation then
    -- Someone already took the name: fall back to a unique suffix.
    insert into public.profiles (id, username)
    values (new.id, desired || '_' || substr(replace(new.id::text, '-', ''), 1, 4))
    on conflict (id) do nothing;
    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
