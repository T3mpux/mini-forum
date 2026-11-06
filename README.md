# Mini Forum

A small forum — posts, comments, accounts — built to exercise the parts of a
full stack that matter: **authentication, Postgres queries and row level
security**.

Live demo: **https://mini-forum-mu.vercel.app**

## Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, React 19, TypeScript) |
| Styling | Tailwind CSS 4 |
| Auth | Supabase Auth — email + password, cookie-based sessions via `@supabase/ssr` |
| Database | Supabase Postgres with row level security |
| Runtime | Node.js — Server Actions for writes, one Route Handler for the JSON feed |

## What it does

- **Accounts** — sign up with a username, sign in, sign out. Sessions are stored
  in cookies, refreshed by `proxy.ts` on every request, and readable on both the
  server and the client.
- **Posts** — create, read, delete. Anyone can read; only signed-in users can
  write; only the author can delete.
- **Comments** — one level deep, same ownership rules.
- **JSON feed** — `GET /api/posts?limit=10` returns the latest posts.

## Security model

Every table has row level security enabled, so the authorisation lives in
Postgres rather than in the UI:

```sql
create policy "authors delete their own posts"
  on public.posts for delete
  to authenticated
  using (auth.uid() = author_id);
```

`deletePost()` in `app/actions/posts.ts` does **no** ownership check in
application code — the delete policy rejects anything that is not the caller's
row. The UI only hides the button; the database is the guard.

The public key shipped to the browser can therefore only do what the policies
allow. See [`supabase/schema.sql`](supabase/schema.sql) for the full schema,
the policies and the trigger that creates a profile row for every new auth user.

## Run it locally

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor**, paste the contents of `supabase/schema.sql`, run it.
3. In **Authentication → Sign In / Providers → Email**, turn **Confirm email**
   off (so the demo works without a mail server).
4. Copy the env file and fill in the two values from **Project Settings → API**:

   ```bash
   cp .env.local.example .env.local
   ```

5. Install and run:

   ```bash
   npm install
   npm run dev
   ```

The app boots without credentials too — it shows a setup card instead of
crashing, so `npm run build` is green on a fresh clone.

## Deploy

Push to GitHub, import the repo on [Vercel](https://vercel.com), add the same
two environment variables, deploy. No other configuration.

## Project layout

```
app/
  actions/          server actions: auth, posts, comments
  api/posts/        route handler — JSON feed
  login/            sign in / sign up
  posts/new/        create a post
  posts/[id]/       post + comments
components/         header, setup notice
lib/supabase/       browser client, server client, session refresh
proxy.ts            refreshes the auth session on every request
supabase/schema.sql tables, indexes, policies, trigger
```

## Notes and next steps

- Comments are one level deep on purpose — threading is a bigger data model.
- Rate limiting and moderation are out of scope; this is a reference
  implementation, not a production forum.
- Next: optimistic UI for comments, and a profile page.
