import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { addComment, deletePost } from "@/app/actions/posts";
import { timeAgo, usernameOf } from "@/lib/format";

type Post = {
  id: string;
  title: string;
  body: string;
  created_at: string;
  author_id: string;
  profiles: { username: string } | { username: string }[] | null;
};

type Comment = {
  id: string;
  body: string;
  created_at: string;
  profiles: { username: string } | { username: string }[] | null;
};

export default async function PostPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  if (!isSupabaseConfigured) notFound();

  const { id } = await params;
  const { error } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: postData } = await supabase
    .from("posts")
    .select("id, title, body, created_at, author_id, profiles(username)")
    .eq("id", id)
    .maybeSingle();

  if (!postData) notFound();

  const post = postData as unknown as Post;

  const { data: commentData } = await supabase
    .from("comments")
    .select("id, body, created_at, profiles(username)")
    .eq("post_id", id)
    .order("created_at", { ascending: true });

  const comments = (commentData ?? []) as unknown as Comment[];
  const isAuthor = user?.id === post.author_id;

  return (
    <article className="mx-auto max-w-2xl space-y-8">
      <header className="space-y-2">
        <Link
          href="/"
          className="text-xs text-black/50 underline-offset-4 hover:underline dark:text-white/50"
        >
          ← Back to posts
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">{post.title}</h1>
        <p className="text-xs text-black/50 dark:text-white/50">
          @{usernameOf(post.profiles)} · {timeAgo(post.created_at)}
        </p>
        {isAuthor ? (
          <form action={deletePost}>
            <input type="hidden" name="post_id" value={post.id} />
            <button
              type="submit"
              className="text-xs text-red-600 underline-offset-4 hover:underline dark:text-red-400"
            >
              Delete this post
            </button>
          </form>
        ) : null}
      </header>

      <p className="whitespace-pre-wrap text-sm leading-relaxed">{post.body}</p>

      {error ? (
        <p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-700 dark:bg-red-950/40 dark:text-red-100">
          {error}
        </p>
      ) : null}

      <section className="space-y-4 border-t border-black/10 pt-6 dark:border-white/15">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-black/60 dark:text-white/60">
          {comments.length} {comments.length === 1 ? "comment" : "comments"}
        </h2>

        <ul className="space-y-4">
          {comments.map((comment) => (
            <li
              key={comment.id}
              className="rounded-lg border border-black/10 px-4 py-3 dark:border-white/15"
            >
              <p className="text-xs text-black/50 dark:text-white/50">
                @{usernameOf(comment.profiles)} ·{" "}
                {timeAgo(comment.created_at)}
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">
                {comment.body}
              </p>
            </li>
          ))}
        </ul>

        {user ? (
          <form action={addComment} className="space-y-3">
            <input type="hidden" name="post_id" value={post.id} />
            <textarea
              name="body"
              required
              rows={3}
              placeholder="Write a comment…"
              className="w-full rounded-md border border-black/15 bg-white px-3 py-2 text-sm outline-none focus:border-black/40 dark:border-white/20 dark:bg-black dark:focus:border-white/50"
            />
            <button
              type="submit"
              className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-black"
            >
              Post comment
            </button>
          </form>
        ) : (
          <p className="text-sm text-black/60 dark:text-white/60">
            <Link href="/login" className="underline underline-offset-4">
              Sign in
            </Link>{" "}
            to comment.
          </p>
        )}
      </section>
    </article>
  );
}
