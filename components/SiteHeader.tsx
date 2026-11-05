import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { signOut } from "@/app/actions/auth";

export default async function SiteHeader() {
  let label: string | null = null;

  if (isSupabaseConfigured) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    label =
      (user?.user_metadata?.username as string | undefined) ??
      user?.email ??
      null;
  }

  return (
    <header className="border-b border-black/10 dark:border-white/15">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-4">
        <Link href="/" className="text-base font-semibold tracking-tight">
          Mini Forum
        </Link>

        <nav className="flex items-center gap-3 text-sm">
          {label ? (
            <>
              <span className="text-black/60 dark:text-white/60">
                @{label}
              </span>
              <Link
                href="/posts/new"
                className="rounded-md bg-black px-3 py-1.5 font-medium text-white dark:bg-white dark:text-black"
              >
                New post
              </Link>
              <form action={signOut}>
                <button
                  type="submit"
                  className="rounded-md px-2 py-1.5 text-black/60 underline-offset-4 hover:underline dark:text-white/60"
                >
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-md bg-black px-3 py-1.5 font-medium text-white dark:bg-white dark:text-black"
            >
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
