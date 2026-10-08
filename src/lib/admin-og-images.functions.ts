import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { z } from "zod";

async function fetchOgImage(url: string): Promise<string | null> {
  try {
    const r = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; FindFurtherBot/1.0)",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) return null;
    const html = (await r.text()).slice(0, 200_000);

    const patterns = [
      /<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image(?::secure_url)?["']/i,
      /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i,
    ];
    for (const p of patterns) {
      const m = html.match(p);
      if (m?.[1]) {
        let img = m[1].trim();
        if (img.startsWith("//")) img = "https:" + img;
        else if (img.startsWith("/")) {
          const u = new URL(url);
          img = `${u.origin}${img}`;
        }
        if (/^https?:\/\//i.test(img)) return img;
      }
    }
    return null;
  } catch {
    return null;
  }
}

const Input = z.object({
  key: z.string().min(1).max(256),
  offset: z.number().int().min(0).max(10000),
  limit: z.number().int().min(1).max(25),
});

export const fixOgImagesBatch = createServerFn({ method: "POST" })
  .inputValidator((d) => Input.parse(d))
  .handler(async ({ data }) => {
    if (data.key !== process.env.ADMIN_SECRET) throw new Error("Unauthorized");

    const { data: rows, error, count } = await supabaseAdmin
      .from("universities_detail")
      .select("slug, name, official_url, campus_image_url", { count: "exact" })
      .or("campus_image_url.is.null,campus_image_url.ilike.%unsplash%")
      .not("official_url", "is", null)
      .order("slug")
      .range(data.offset, data.offset + data.limit - 1);

    if (error) throw new Error(error.message);

    let updated = 0, skipped = 0, failed = 0;
    for (const u of rows ?? []) {
      if (!u.official_url) { skipped++; continue; }
      const img = await fetchOgImage(u.official_url);
      if (!img) { skipped++; continue; }
      const { error: upErr } = await supabaseAdmin
        .from("universities_detail")
        .update({ campus_image_url: img })
        .eq("slug", u.slug);
      if (upErr) failed++;
      else updated++;
    }

    const total = count ?? 0;
    const processed = data.offset + (rows?.length ?? 0);
    return { total, processed, batch: rows?.length ?? 0, updated, skipped, failed, done: processed >= total || (rows?.length ?? 0) === 0 };
  });
