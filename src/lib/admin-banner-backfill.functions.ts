import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { fetchCountryBannerImage, fetchUniversityCampusImage } from "@/lib/image-fetch.server";

const Input = z.object({
  key: z.string().min(1).max(256),
  limit: z.number().int().min(1).max(20).default(10),
});

/** Backfill scholarship banner_image_url for rows that don't have one yet. */
export const backfillScholarshipBanners = createServerFn({ method: "POST" })
  .inputValidator((d) => Input.parse(d))
  .handler(async ({ data }) => {
    if (data.key !== process.env.ADMIN_SECRET) throw new Error("Unauthorized");

    const { data: rows, error } = await supabaseAdmin
      .from("scholarships")
      .select("slug, host_country, banner_image_url")
      .or("banner_image_url.is.null,banner_image_url.eq.")
      .limit(data.limit);
    if (error) throw new Error(error.message);

    let updated = 0;
    let skipped = 0;
    for (const r of rows ?? []) {
      const country = (r as any).host_country as string | null;
      if (!country) { skipped++; continue; }
      const url = await fetchCountryBannerImage(country);
      if (!url) { skipped++; continue; }
      const { error: upErr } = await supabaseAdmin
        .from("scholarships")
        .update({ banner_image_url: url })
        .eq("slug", (r as any).slug);
      if (upErr) skipped++;
      else updated++;
    }

    const { count } = await supabaseAdmin
      .from("scholarships")
      .select("slug", { count: "exact", head: true })
      .or("banner_image_url.is.null,banner_image_url.eq.");

    return { batch: rows?.length ?? 0, updated, skipped, remaining: count ?? 0 };
  });

/** Backfill universities_detail.campus_image_url for rows that don't have one. */
export const backfillUniversityCampusImages = createServerFn({ method: "POST" })
  .inputValidator((d) => Input.parse(d))
  .handler(async ({ data }) => {
    if (data.key !== process.env.ADMIN_SECRET) throw new Error("Unauthorized");

    const { data: rows, error } = await supabaseAdmin
      .from("universities_detail")
      .select("slug, name, campus_image_url")
      .or("campus_image_url.is.null,campus_image_url.eq.")
      .limit(data.limit);
    if (error) throw new Error(error.message);

    let updated = 0;
    let skipped = 0;
    for (const r of rows ?? []) {
      const url = await fetchUniversityCampusImage((r as any).name);
      if (!url) { skipped++; continue; }
      const { error: upErr } = await supabaseAdmin
        .from("universities_detail")
        .update({ campus_image_url: url })
        .eq("slug", (r as any).slug);
      if (upErr) skipped++;
      else updated++;
    }

    const { count } = await supabaseAdmin
      .from("universities_detail")
      .select("slug", { count: "exact", head: true })
      .or("campus_image_url.is.null,campus_image_url.eq.");

    return { batch: rows?.length ?? 0, updated, skipped, remaining: count ?? 0 };
  });
