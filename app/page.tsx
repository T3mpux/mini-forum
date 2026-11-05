import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { SetupNotice } from "@/components/SetupNotice";
import { excerpt, timeAgo, usernameOf } from "@/lib/format";

type PostRow = {
  id: string;
  title: string;
  body: string;
  created_at: string;
  profiles: { username: string } | { username: string }[] | null;
};

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  if (!isSupabaseConfigured) {
    return (
      <div className="space-y-6">
        <PageIntro />
        <SetupNotice />
      </div>
    );
  }

  const { notice } = await searchParams;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("posts")
    .select("id, title, body, created_at, profiles(username)")
    .order("created_at", { ascending: false })
    .limit(50);

  const posts = (data ?? []) as unknown as PostRow[];

  return (
    <div className="space-y-6">
      <PageIntro />

      {notice ? (
        <p className="rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-100">
          {notice}
        </p>
      ) : null}

      {error ? (
        <p className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-700 dark:bg-red-950/40 dark:text-red-100">
          {error.message}
        </p>
      ) : null}

      {posts.length === 0 && !error ? (
        <p className="rounded-xl border border-dashed border-black/15 px-6 py-10 text-center text-sm text-black/60 dark:border-white/20 dark:text-white/60">
          No posts yet.{" "}
          <Link href="/posts/new" className="underline underline-offset-4">
            Write the first one
          </Link>
          .
        </p>
      ) : null}

      <ul className="divide-y divide-black/10 dark:divide-white/15">
        {posts.map((post) => (
          <li key={post.id} className="py-4">
            <Link href={`/posts/${post.id}`} className="group block">
              <h2 className="text-lg font-semibold group-hover:underline">
                {post.title}
              </h2>
              <p className="mt-1 text-sm text-black/70 dark:text-white/70">
                {excerpt(post.body)}
              </p>
              <p className="mt-2 text-xs text-black/50 dark:text-white/50">
                @{usernameOf(post.profiles)} · {timeAgo(post.created_at)}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PageIntro() {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Recent posts</h1>
      <p className="mt-1 text-sm text-black/60 dark:text-white/60">
        Anyone can read. Signed-in users can post and comment. Authors can only
        edit or delete their own content — enforced in Postgres, not just in the
        UI.
      </p>
    </div>
  );
}
