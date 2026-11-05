export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

export const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "";

/**
 * The app boots without credentials on purpose: `npm run build` and the
 * landing page work out of the box, so the setup step is obvious instead of
 * being a white screen.
 */
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_KEY);
