import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { z } from "zod";
import { fetchUniversityWikipediaLogo } from "@/lib/wikipedia-logo.server";
import { isWeakLogoUrl } from "@/lib/logo-url";

const UNSPLASH_FALLBACKS = [
  "https://images.unsplash.com/photo-1562774053-701939374585?w=1600&q=80", // campus quad
  "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1600&q=80", // library
  "https://images.unsplash.com/photo-1607237138185-eedd9c632b0b?w=1600&q=80", // university building
  "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1600&q=80", // graduation campus
  "https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?w=1600&q=80", // ivy hall
];

function fallbackFor(slug: string): string {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  return UNSPLASH_FALLBACKS[h % UNSPLASH_FALLBACKS.length];
}

async function headOk(url: string): Promise<boolean> {
  try {
    const r = await fetch(url, { method: "HEAD", redirect: "follow", signal: AbortSignal.timeout(5000) });
    return r.ok;
  } catch { return false; }
}

async function wikiThumb(name: string): Promise<string | null> {
  const title = encodeURIComponent(name.replace(/\s+/g, "_"));
  try {
    const r = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${title}`, {
      headers: { "User-Agent": "FindFurther/1.0 (admin)" },
      signal: AbortSignal.timeout(7000),
    });
    if (!r.ok) return null;
    const j: any = await r.json();
    const src: string | undefined = j?.originalimage?.source ?? j?.thumbnail?.source;
    if (!src) return null;
    return src.replace(/\/(\d+)px-/, "/1200px-");
  } catch { return null; }
}

async function fetchOgImage(url: string): Promise<string | null> {
  try {
    const r = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; FindFurtherBot/1.0)", Accept: "text/html" },
      redirect: "follow",
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) return null;
    const html = (await r.text()).slice(0, 200_000);
    const patterns = [
      /<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image(?::secure_url)?["']/i,
      /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i,
    ];
    for (const p of patterns) {
      const m = html.match(p);
      if (m?.[1]) {
        let img = m[1].trim();
        if (img.startsWith("//")) img = "https:" + img;
        else if (img.startsWith("/")) { const u = new URL(url); img = `${u.origin}${img}`; }
        if (/^https?:\/\//i.test(img)) return img;
      }
    }
    return null;
  } catch { return null; }
}

const Input = z.object({
  key: z.string().min(1).max(256),
  offset: z.number().int().min(0).max(20000),
  limit: z.number().int().min(1).max(15),
});

export const fixAllImagesBatch = createServerFn({ method: "POST" })
  .inputValidator((d) => Input.parse(d))
  .handler(async ({ data }) => {
    const { data: cronRow } = await supabaseAdmin
      .from("cron_config")
      .select("value")
      .eq("key", "refresh_key")
      .maybeSingle();
    const isAuthorized = data.key === process.env.ADMIN_SECRET || data.key === cronRow?.value;
    if (!isAuthorized) throw new Error("Unauthorized");

    // Inspect every row in small batches: existing URLs can be stale, blocked,
    // or generic placeholders even when they are not null.
    const { data: rows, error, count } = await supabaseAdmin
      .from("universities_detail")
      .select("slug, name, official_url, campus_image_url, logo_url", { count: "exact" })
      .order("slug")
      .range(data.offset, data.offset + data.limit - 1);
    if (error) throw new Error(error.message);

    let logosUpdated = 0, campusUpdated = 0, fallbackUsed = 0, failed = 0;

    for (const u of rows ?? []) {
      const update: { logo_url?: string; campus_image_url?: string } = {};

      const logoNeedsRefresh = isWeakLogoUrl(u.logo_url) || !(await headOk(u.logo_url ?? ""));
      if (logoNeedsRefresh) {
        const logo = await fetchUniversityWikipediaLogo(u.name);
        if (logo && (await headOk(logo))) {
          update.logo_url = logo;
          logosUpdated++;
        }
      }

      const campusNeedsRefresh =
        !u.campus_image_url ||
        /images\.unsplash\.com|source\.unsplash\.com/i.test(u.campus_image_url) ||
        !(await headOk(u.campus_image_url));
      if (campusNeedsRefresh) {
        let img: string | null = await wikiThumb(u.name);
        if (!img && u.official_url) img = await fetchOgImage(u.official_url);
        if (!img) { img = fallbackFor(u.slug); fallbackUsed++; }
        if (img !== u.campus_image_url) {
          update.campus_image_url = img;
          campusUpdated++;
        }
      }

      if (Object.keys(update).length === 0) continue;
      const { error: upErr } = await supabaseAdmin
        .from("universities_detail")
        .update(update)
        .eq("slug", u.slug);
      if (upErr) failed++;
    }

    const total = count ?? 0;
    const batch = rows?.length ?? 0;
    return {
      total,
      batch,
      logosUpdated,
      campusUpdated,
      fallbackUsed,
      failed,
      done: batch === 0,
    };
  });
