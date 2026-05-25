import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { z } from "zod";

const KeySchema = z.object({ key: z.string().min(1).max(256) });

export const getUniStats = createServerFn({ method: "POST" })
  .inputValidator((d) => KeySchema.parse(d))
  .handler(async ({ data }) => {
    if (data.key !== process.env.ADMIN_SECRET) throw new Error("Unauthorized");

    const { data: rows, error } = await supabaseAdmin
      .from("universities_detail")
      .select("campus_image_url, logo_url, qs_rank, tuition, country");
    if (error) throw new Error(error.message);

    const total = rows?.length ?? 0;
    let has_image = 0, has_logo = 0, has_ranking = 0, has_tuition = 0;
    const byCountry = new Map<string, number>();
    for (const r of rows ?? []) {
      if (r.campus_image_url && r.campus_image_url !== "") has_image++;
      if (r.logo_url && r.logo_url !== "") has_logo++;
      if (r.qs_rank != null) has_ranking++;
      if (r.tuition && JSON.stringify(r.tuition) !== "{}") has_tuition++;
      if (r.country) byCountry.set(r.country, (byCountry.get(r.country) ?? 0) + 1);
    }
    const countries = [...byCountry.entries()]
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    return { stats: { total, has_image, has_logo, has_ranking, has_tuition }, countries };
  });
