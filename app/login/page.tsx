import Link from "next/link";
import { signIn, signUp } from "@/app/actions/auth";
import { isSupabaseConfigured } from "@/lib/env";
import { SetupNotice } from "@/components/SetupNotice";

const inputClass =
  "mt-1 w-full rounded-md border border-black/15 bg-white px-3 py-2 text-sm outline-none focus:border-black/40 dark:border-white/20 dark:bg-black dark:focus:border-white/50";
const labelClass = "block text-sm font-medium";
const buttonClass =
  "mt-4 w-full rounded-md bg-black px-3 py-2 text-sm font-medium text-white dark:bg-white dark:text-black";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; error?: string }>;
}) {
  if (!isSupabaseConfigured) {
    return (
      <div className="space-y-6">
        <SetupNotice />
      </div>
    );
  }

  const { mode, error } = await searchParams;
  const isSignUp = mode === "signup";

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="text-2xl font-semibold tracking-tight">
        {isSignUp ? "Create an account" : "Sign in"}
      </h1>
      <p className="mt-1 text-sm text-black/60 dark:text-white/60">
        {isSignUp
          ? "Pick a username — it is what other people will see on your posts."
          : "Use the email and password you signed up with."}
      </p>

      {error ? (
        <p className="mt-4 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-700 dark:bg-red-950/40 dark:text-red-100">
          {error}
        </p>
      ) : null}

      {isSignUp ? (
        <form action={signUp} className="mt-6 space-y-4">
          <div>
            <label className={labelClass} htmlFor="username">
              Username
            </label>
            <input
              id="username"
              name="username"
              minLength={3}
              maxLength={20}
              pattern="[a-zA-Z0-9_]+"
              required
              autoComplete="username"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="email">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="password">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              minLength={6}
              required
              autoComplete="new-password"
              className={inputClass}
            />
          </div>
          <button type="submit" className={buttonClass}>
            Create account
          </button>
        </form>
      ) : (
        <form action={signIn} className="mt-6 space-y-4">
          <div>
            <label className={labelClass} htmlFor="email">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="password">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className={inputClass}
            />
          </div>
          <button type="submit" className={buttonClass}>
            Sign in
          </button>
        </form>
      )}

      <p className="mt-6 text-sm text-black/60 dark:text-white/60">
        {isSignUp ? (
          <>
            Already have an account?{" "}
            <Link href="/login" className="underline underline-offset-4">
              Sign in
            </Link>
          </>
        ) : (
          <>
            No account yet?{" "}
            <Link
              href="/login?mode=signup"
              className="underline underline-offset-4"
            >
              Create one
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
