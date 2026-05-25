import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { z } from "zod";

const FALLBACKS = {
  UK: "https://images.unsplash.com/photo-1526958097901-5e6d742d3371?w=1200&q=80",
  US: "https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?w=1200&q=80",
  DE: "https://images.unsplash.com/photo-1560969184-10fe8719e047?w=1200&q=80",
  ASIA: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=1200&q=80",
  DEFAULT: "https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?w=1200&q=80",
};

const UK = new Set(["United Kingdom", "UK", "England", "Scotland", "Wales", "Northern Ireland"]);
const US = new Set(["United States", "USA", "United States of America"]);
const DE = new Set(["Germany"]);
const ASIA = new Set([
  "China", "India", "Japan", "South Korea", "Korea", "Singapore", "Hong Kong",
  "Taiwan", "Malaysia", "Thailand", "Indonesia", "Vietnam", "Philippines",
  "Pakistan", "Bangladesh", "Sri Lanka", "Nepal", "Kazakhstan",
]);

function fallbackFor(country: string | null | undefined): string {
  if (!country) return FALLBACKS.DEFAULT;
  if (UK.has(country)) return FALLBACKS.UK;
  if (US.has(country)) return FALLBACKS.US;
  if (DE.has(country)) return FALLBACKS.DE;
  if (ASIA.has(country)) return FALLBACKS.ASIA;
  return FALLBACKS.DEFAULT;
}

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
    // Upscale wiki thumb to ~1200px width if it's the standard /thumb/ URL
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
      .select("slug, name, country", { count: "exact" })
      .order("slug")
      .range(data.offset, data.offset + data.limit - 1);

    if (error) throw new Error(error.message);

    let wiki = 0, fallback = 0, failed = 0;
    for (const u of rows ?? []) {
      let url = await wikiThumb(u.name);
      if (url) wiki++;
      else { url = fallbackFor(u.country); fallback++; }
      const { error: upErr } = await supabaseAdmin
        .from("universities_detail")
        .update({ campus_image_url: url })
        .eq("slug", u.slug);
      if (upErr) failed++;
    }

    const total = count ?? 0;
    const processed = data.offset + (rows?.length ?? 0);
    return { total, processed, batch: rows?.length ?? 0, wiki, fallback, failed, done: processed >= total };
  });
