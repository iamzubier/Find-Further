import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { z } from "zod";

async function wikiThumb(name: string): Promise<string | null> {
  const title = encodeURIComponent(name.replace(/\s+/g, "_"));
  try {
    const r = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${title}`, {
      headers: { "User-Agent": "BeyondBorder/1.0 (admin import)" },
    });
    if (!r.ok) return null;
    const j: any = await r.json();
    const src: string | undefined = j?.thumbnail?.source ?? j?.originalimage?.source;
    if (!src) return null;
    return src.replace(/\/\d+px-/, "/1200px-");
  } catch {
    return null;
  }
}

const Input = z.object({
  key: z.string().min(1).max(256),
  offset: z.number().int().min(0).max(10000),
  limit: z.number().int().min(1).max(50),
});

export const fixCampusImagesBatch = createServerFn({ method: "POST" })
  .inputValidator((d) => Input.parse(d))
  .handler(async ({ data }) => {
    if (data.key !== process.env.ADMIN_SECRET) throw new Error("Unauthorized");

    const { data: rows, error, count } = await supabaseAdmin
      .from("universities_detail")
      .select("slug, name", { count: "exact" })
      .order("slug")
      .range(data.offset, data.offset + data.limit - 1);

    if (error) throw new Error(error.message);

    let updated = 0, skipped = 0, failed = 0;
    for (const u of rows ?? []) {
      const url = await wikiThumb(u.name);
      if (!url) { skipped++; continue; }
      const { error: upErr } = await supabaseAdmin
        .from("universities_detail")
        .update({ campus_image_url: url })
        .eq("slug", u.slug);
      if (upErr) failed++;
      else updated++;
    }

    const total = count ?? 0;
    const processed = data.offset + (rows?.length ?? 0);
    return { total, processed, batch: rows?.length ?? 0, updated, skipped, failed, done: processed >= total };
  });
