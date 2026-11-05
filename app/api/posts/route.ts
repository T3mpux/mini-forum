import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";

/**
 * Read-only JSON feed of the latest posts.
 * Demonstrates a Route Handler (Node.js runtime) sitting next to the Server
 * Actions that mutate data.
 *
 *   GET /api/posts?limit=10
 */
export async function GET(request: Request) {
  if (!isSupabaseConfigured) {
    return NextResponse.json(
      { error: "Supabase is not configured" },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(request.url);
  const requested = Number(searchParams.get("limit") ?? "20");
  const limit = Number.isFinite(requested)
    ? Math.min(Math.max(Math.trunc(requested), 1), 50)
    : 20;

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("posts")
    .select("id, title, created_at, profiles(username)")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ count: data.length, posts: data });
}
