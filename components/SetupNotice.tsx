export function SetupNotice() {
  return (
    <section className="mx-auto max-w-2xl rounded-xl border border-amber-300 bg-amber-50 p-6 text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100">
      <h2 className="text-lg font-semibold">Supabase is not configured yet</h2>
      <p className="mt-2 text-sm leading-relaxed">
        This app ships without credentials so the repo stays clean. To run it:
      </p>
      <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm leading-relaxed">
        <li>
          Create a project at <span className="font-mono">supabase.com</span>.
        </li>
        <li>
          Run <span className="font-mono">supabase/schema.sql</span> in the SQL editor.
        </li>
        <li>
          Copy <span className="font-mono">.env.local.example</span> to{" "}
          <span className="font-mono">.env.local</span> and paste the project URL
          and publishable key.
        </li>
        <li>Restart the dev server.</li>
      </ol>
    </section>
  );
}
