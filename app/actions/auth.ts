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

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) fail("/login", "Email and password are required.");
  if (!isSupabaseConfigured) fail("/login", "Supabase is not configured yet.");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) fail("/login", error.message);

  revalidatePath("/", "layout");
  redirect("/");
}

export async function signUp(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const username = String(formData.get("username") ?? "").trim().toLowerCase();

  if (!/^[a-z0-9_]{3,20}$/.test(username))
    fail("/login?mode=signup", "Username: 3–20 characters, a–z, 0–9 and _ only.");
  if (!email) fail("/login?mode=signup", "Email is required.");
  if (password.length < 6)
    fail("/login?mode=signup", "Password must be at least 6 characters.");
  if (!isSupabaseConfigured) fail("/login", "Supabase is not configured yet.");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { username } },
  });

  if (error) {
    const message = /already registered|already exists/i.test(error.message)
      ? "That email is already registered — try signing in."
      : error.message;
    fail("/login?mode=signup", message);
  }

  // If email confirmation is disabled in the Supabase dashboard, signup returns
  // a session and we can drop the user straight into the forum.
  if (data.session) {
    revalidatePath("/", "layout");
    redirect("/");
  }

  fail(
    "/login",
    "Account created. Confirm your email, then sign in."
  );
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
