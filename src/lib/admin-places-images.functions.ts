import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { z } from "zod";
import { fetchUniversityPlaceImagery } from "@/lib/google-places-images.server";
import { fetchUniversityWikipediaLogo } from "@/lib/wikipedia-logo.server";
import { isWeakLogoUrl } from "@/lib/logo-url";

const Input = z.object({
  key: z.string().min(1).max(256),
  offset: z.number().int().min(0).max(20000),
  limit: z.number().int().min(1).max(10),
  force: z.boolean().optional(),
});

export const fixPlaceImagesBatch = createServerFn({ method: "POST" })
  .inputValidator((d) => Input.parse(d))
  .handler(async ({ data }) => {
    if (data.key !== process.env.ADMIN_SECRET) throw new Error("Unauthorized");

    let query = supabaseAdmin
      .from("universities_detail")
      .select("slug, name, country, official_url, campus_image_url, logo_url", { count: "exact" })
      .order("slug")
      .range(data.offset, data.offset + data.limit - 1);

    if (!data.force) {
      query = query.or("logo_url.is.null,campus_image_url.is.null,campus_image_url.ilike.%unsplash%");
    }

    const { data: rows, error, count } = await query;
    if (error) {
      // PostgREST returns 416 "Requested range not satisfiable" when offset >= total.
      if ((error as any).code === "PGRST103" || /range not satisfiable/i.test(error.message)) {
        return { total: count ?? 0, batch: 0, offset: data.offset, campusUpdated: 0, logosUpdated: 0, skipped: 0, failed: 0, done: true };
      }
      throw new Error(error.message);
    }

    let campusUpdated = 0, logosUpdated = 0, failed = 0, skipped = 0;

    for (const u of rows ?? []) {
      const imagery = await fetchUniversityPlaceImagery(u.name, u.country);
      const update: { campus_image_url?: string; logo_url?: string } = {};

      if (imagery.photoUrl && (data.force || !u.campus_image_url || u.campus_image_url.includes("unsplash"))) {
        update.campus_image_url = imagery.photoUrl;
      }

      if (data.force || isWeakLogoUrl(u.logo_url)) {
        const wikiLogo = await fetchUniversityWikipediaLogo(u.name);
        if (wikiLogo) update.logo_url = wikiLogo;
      }

      if (Object.keys(update).length === 0) { skipped++; continue; }

      const { error: upErr } = await supabaseAdmin
        .from("universities_detail")
        .update(update)
        .eq("slug", u.slug);
      if (upErr) { failed++; continue; }
      if (update.campus_image_url) campusUpdated++;
      if (update.logo_url) logosUpdated++;
    }

    const batch = rows?.length ?? 0;
    return {
      total: count ?? 0,
      batch,
      offset: data.offset,
      campusUpdated,
      logosUpdated,
      skipped,
      failed,
      done: batch === 0,
    };
  });
