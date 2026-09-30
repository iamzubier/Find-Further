import { createFileRoute } from "@tanstack/react-router";

/**
 * Daily data-refresh endpoint, called by pg_cron.
 * - Rolls expired scholarship deadlines forward to the next annual cycle
 * - Flips cycle_status based on deadline proximity
 * - Marks stale rows so JIT hydration re-researches them on next view
 */
export const Route = createFileRoute("/api/public/refresh-data")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = request.headers.get("x-refresh-key") ?? "";
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        // Accept either the admin secret or the rotating cron key stored in the DB
        const adminSecret = process.env["ADMIN_SECRET"];
        const { data: cronRow } = await (supabaseAdmin as unknown as {
          schema: (s: string) => {
            from: (t: string) => {
              select: (c: string) => {
                eq: (k: string, v: string) => {
                  maybeSingle: () => Promise<{ data: { value?: string } | null }>;
                };
              };
            };
          };
        })
          .schema("private")
          .from("cron_config")
          .select("value")
          .eq("key", "refresh_key")
          .maybeSingle();
        const cronKey = cronRow?.value;
        const ok = (adminSecret && key === adminSecret) || (cronKey && key === cronKey);
        if (!ok) {
          return new Response("Unauthorized", { status: 401 });
        }
        const now = new Date();
        const results: Record<string, number> = { deadlines_rolled: 0, marked_stale: 0, status_flipped: 0 };

        // 1. Roll expired deadlines forward one year (annual cycles)
        const { data: expired } = await supabaseAdmin
          .from("scholarships")
          .select("id, deadline")
          .not("deadline", "is", null)
          .lt("deadline", now.toISOString().slice(0, 10));

        for (const row of expired ?? []) {
          const d = new Date(row.deadline as string);
          d.setFullYear(d.getFullYear() + 1);
          // If still in the past (multi-year gap), keep rolling
          while (d < now) d.setFullYear(d.getFullYear() + 1);
          const { error } = await supabaseAdmin
            .from("scholarships")
            .update({ deadline: d.toISOString().slice(0, 10), cycle_status: "closed_prep_mode" })
            .eq("id", row.id);
          if (!error) results.deadlines_rolled++;
        }

        // 2. Flip cycle_status for scholarships opening within 90 days
        const soon = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
        const { data: opening } = await supabaseAdmin
          .from("scholarships")
          .select("id")
          .eq("cycle_status", "closed_prep_mode")
          .not("deadline", "is", null)
          .lte("deadline", soon)
          .gte("deadline", now.toISOString().slice(0, 10));

        for (const row of opening ?? []) {
          const { error } = await supabaseAdmin
            .from("scholarships")
            .update({ cycle_status: "active_open" })
            .eq("id", row.id);
          if (!error) results.status_flipped++;
        }

        // 3. Mark scholarships not hydrated in 30+ days as stale (null hydrated_at
        //    makes the detail page re-research them on next view)
        const staleCutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const { count } = await supabaseAdmin
          .from("scholarships")
          .update({ hydrated_at: null }, { count: "exact" })
          .lt("hydrated_at", staleCutoff);
        results.marked_stale = count ?? 0;

        return Response.json({ ok: true, at: now.toISOString(), ...results });
      },
    },
  },
});
