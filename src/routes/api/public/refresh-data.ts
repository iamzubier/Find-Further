import { createFileRoute } from "@tanstack/react-router";
import { fixAllImagesBatch } from "@/lib/admin-fix-all-images.functions";

/**
 * Daily data-refresh endpoint, called by pg_cron.
 * - Rolls expired scholarship deadlines forward to the next annual cycle
 * - Flips cycle_status based on deadline proximity
 * - Marks stale rows so JIT hydration re-researches them on next view
 */
type ExternalUniversity = {
  id?: string;
  slug?: string;
  name?: string;
  country?: string;
  region?: string;
  website?: string;
  state_province?: string;
  qs_rank?: number | null;
};

async function syncExternalUniversities(supabaseAdmin: any) {
  const sourceUrl = process.env["UNIVERSITY_DATA_URL"] ?? process.env["QS_DATA_URL"];
  if (!sourceUrl) return 0;

  const headers: Record<string, string> = { accept: "application/json" };
  const token = process.env["UNIVERSITY_DATA_TOKEN"] ?? process.env["QS_DATA_TOKEN"];
  if (token) headers.authorization = `Bearer ${token}`;
  const response = await fetch(sourceUrl, { headers });
  if (!response.ok) throw new Error(`University source returned ${response.status}`);

  const payload = (await response.json()) as ExternalUniversity[] | { universities?: ExternalUniversity[] };
  const rows = Array.isArray(payload) ? payload : payload.universities ?? [];
  const valid = rows
    .filter((row) => typeof row.name === "string" && row.name.trim())
    .map((row) => {
      const slug = (row.slug ?? row.id ?? row.name!)
        .toLowerCase()
        .normalize("NFKD")
        .replace(/[\\u0300-\\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 80);
      return {
        id: slug,
        slug,
        name: row.name!.trim(),
        country: row.country?.trim() || "Unknown",
        region: row.region || "OTHER",
        website: row.website || null,
        state_province: row.state_province || null,
        qs_rank: Number.isInteger(row.qs_rank) ? row.qs_rank : null,
        updated_at: new Date().toISOString(),
      };
    });
  if (!valid.length) return 0;

  const { error } = await supabaseAdmin
    .from("universities_catalog")
    .upsert(valid, { onConflict: "slug" });
  if (error) throw new Error(`University import failed: ${error.message}`);
  return valid.length;
}

export const Route = createFileRoute("/api/public/refresh-data")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = request.headers.get("x-refresh-key") ?? "";
        const supabaseAdmin: any = (await import("@/integrations/supabase/client.server")).supabaseAdmin;

        // Accept either the admin secret or the rotating cron key stored in the DB
        const adminSecret = process.env["ADMIN_SECRET"];
        const { data: cronRow } = await supabaseAdmin
          .from("cron_config")
          .select("value")
          .eq("key", "refresh_key")
          .maybeSingle();
        const { data: imageOffsetRow } = await supabaseAdmin
          .from("cron_config")
          .select("value")
          .eq("key", "image_refresh_offset")
          .maybeSingle();
        const cronKey = cronRow?.value;
        const imageOffset = Math.max(0, Number.parseInt(imageOffsetRow?.value ?? "0", 10) || 0);
        const ok = (adminSecret && key === adminSecret) || (cronKey && key === cronKey);
        if (!ok) {
          return new Response("Unauthorized", { status: 401 });
        }
        const now = new Date();
        const results: Record<string, number> = {
          deadlines_rolled: 0,
          marked_stale: 0,
          status_flipped: 0,
          universities_synced: 0,
          images_checked: 0,
          logos_updated: 0,
          campus_images_updated: 0,
        };

        try {
          results.universities_synced = await syncExternalUniversities(supabaseAdmin);
        } catch (error) {
          console.error("[refresh-data] university sync failed", error);
        }

        // Check a small rotating batch daily so stale, broken, and placeholder
        // logos/campus images are repaired without manual commands.
        try {
          const imageRefresh = await fixAllImagesBatch({
            data: { key: adminSecret ?? cronKey ?? "", offset: imageOffset, limit: 15 },
          });
          results.images_checked = imageRefresh.batch;
          results.logos_updated = imageRefresh.logosUpdated;
          results.campus_images_updated = imageRefresh.campusUpdated;
          await supabaseAdmin.from("cron_config").upsert({
            key: "image_refresh_offset",
            value: String(imageRefresh.done ? 0 : imageOffset + imageRefresh.batch),
          });
        } catch (error) {
          console.error("[refresh-data] image refresh failed", error);
        }

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
