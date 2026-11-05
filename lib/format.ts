export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60_000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;

  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function excerpt(text: string, limit = 180): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length <= limit ? clean : `${clean.slice(0, limit).trimEnd()}…`;
}

/**
 * Supabase returns a many-to-one embed either as an object or as a
 * single-element array depending on the generated types. Handle both so the
 * UI never renders "undefined".
 */
export function usernameOf(
  embedded: { username: string } | { username: string }[] | null | undefined
): string {
  if (!embedded) return "unknown";
  if (Array.isArray(embedded)) return embedded[0]?.username ?? "unknown";
  return embedded.username ?? "unknown";
}
