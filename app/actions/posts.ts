"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";

/** Appends the error to an existing query string without breaking it. */
function fail(path: string, message: string): never {
  const [base, query] = path.split("?");
  const params = new URLSearchParams(query ?? "");
  params.set("error", message);
  redirect(`${base}?${params.toString()}`);
}

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  return { supabase, user };
}

export async function createPost(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();

  if (!isSupabaseConfigured) fail("/posts/new", "Supabase is not configured yet.");
  if (title.length < 3 || title.length > 120)
    fail("/posts/new", "Title must be 3–120 characters.");
  if (!body) fail("/posts/new", "Post body cannot be empty.");

  const { supabase, user } = await requireUser();

  const { data, error } = await supabase
    .from("posts")
    .insert({ author_id: user.id, title, body })
    .select("id")
    .single();

  if (error) fail("/posts/new", error.message);

  revalidatePath("/");
  redirect(`/posts/${data.id}`);
}

export async function addComment(formData: FormData) {
  const postId = String(formData.get("post_id") ?? "");
  const body = String(formData.get("body") ?? "").trim();

  if (!postId) fail("/", "Missing post.");
  if (!body) fail(`/posts/${postId}`, "Comment cannot be empty.");

  const { supabase, user } = await requireUser();

  const { error } = await supabase
    .from("comments")
    .insert({ post_id: postId, author_id: user.id, body });

  if (error) fail(`/posts/${postId}`, error.message);

  revalidatePath(`/posts/${postId}`);
  redirect(`/posts/${postId}`);
}

export async function deletePost(formData: FormData) {
  const postId = String(formData.get("post_id") ?? "");
  if (!postId) fail("/", "Missing post.");

  const { supabase } = await requireUser();

  // No ownership check in application code on purpose: the delete policy in
  // schema.sql rejects anything that is not the author's row.
  const { error } = await supabase.from("posts").delete().eq("id", postId);

  if (error) fail(`/posts/${postId}`, error.message);

  revalidatePath("/");
  redirect("/");
}
