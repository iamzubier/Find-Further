
// src/lib/use-campus-photo.ts
// Finds a real photo of a university campus (or, failing that, a landmark of the
// host country) from Wikimedia Commons. Free, no API key, safe to reuse commercially
// as long as the photographer is credited (the hook returns the credit text).
import { useQuery } from "@tanstack/react-query";

export type CampusPhoto = {
  url: string;
  credit: string;
  pageUrl: string;
  kind: "campus" | "country";
};

const COMMONS = "https://commons.wikimedia.org/w/api.php";

// Filenames that are NOT a real photo of a place
const BAD =
  /logo|seal|crest|emblem|arms|flag|map|diagram|chart|signature|portrait|plaque|poster|banner|icon|stamp|certificate|diploma|cover|screenshot|scan|sketch|drawing|painting|postcard|\bpdf\b/i;
// Filenames that usually are a nice campus shot
const GOOD =
  /campus|building|hall|library|quad|gate|tower|aerial|panorama|view|entrance|courtyard|facade|main|university|college/i;
const STOP = new Set([
  "university", "universities", "college", "institute", "school", "the", "and", "for", "of", "national", "state",
]);
// Only search for a campus when the provider actually looks like an institution
const INSTITUTION = /univers|college|institut|polytechnic|academy|hochschule|ecole|école|escuela|school of/i;
const COUNTRY_ALIAS: Record<string, string> = {
  uk: "united kingdom", usa: "united states", us: "united states", uae: "united arab emirates",
};

export function tokens(s: string, minLen = 4): string[] {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= minLen && !STOP.has(t));
}

// Pick the best landscape JPEG whose name/categories/description mention the place.
export function pickBest(json: any, need: string[], kind: CampusPhoto["kind"]): CampusPhoto | null {
  const pages: any[] = Object.values(json?.query?.pages ?? {});
  let best: { score: number; photo: CampusPhoto } | null = null;

  for (const p of pages) {
    const ii = p?.imageinfo?.[0];
    if (!ii || ii.mime !== "image/jpeg") continue;
    const w = Number(ii.width), h = Number(ii.height);
    if (!(w >= 1000 && h > 0)) continue;
    const ratio = w / h;
    if (ratio < 1.3 || ratio > 2.6) continue;

    const title = String(p.title ?? "").replace(/^File:/, "");
    if (BAD.test(title)) continue;

    const meta = ii.extmetadata ?? {};
    const haystack = `${title} ${meta.Categories?.value ?? ""} ${meta.ImageDescription?.value ?? ""}`.toLowerCase();
    const hits = need.filter((t) => haystack.includes(t)).length;
    if (hits < Math.min(2, need.length)) continue;

    let score = hits * 10 + Math.min(w, 4000) / 400 - (p.index ?? 0) * 0.4;
    if (GOOD.test(title)) score += 6;

    if (!best || score > best.score) {
      const artist = String(meta.Artist?.value ?? "").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim().slice(0, 40);
      const license = String(meta.LicenseShortName?.value ?? "").trim();
      best = {
        score,
        photo: {
          url: String(ii.thumburl ?? ii.url),
          credit: [artist || "Wikimedia Commons", license].filter(Boolean).join(" · "),
          pageUrl: String(ii.descriptionurl ?? "https://commons.wikimedia.org"),
          kind,
        },
      };
    }
  }
  return best ? best.photo : null;
}

async function searchCommons(query: string, need: string[], kind: CampusPhoto["kind"]) {
  const qs = new URLSearchParams({
    action: "query",
    format: "json",
    origin: "*",
    generator: "search",
    gsrnamespace: "6",
    gsrlimit: "20",
    gsrsearch: `${query} filetype:bitmap`,
    prop: "imageinfo",
    iiprop: "url|size|mime|extmetadata",
    iiurlwidth: "1600",
    iiextmetadatafilter: "Artist|LicenseShortName|ImageDescription|Categories",
  });
  const res = await fetch(`${COMMONS}?${qs}`);
  if (!res.ok) return null;
  return pickBest(await res.json(), need, kind);
}

export async function findPhoto(provider: string, country: string): Promise<CampusPhoto | null> {
  try {
    if (provider && INSTITUTION.test(provider)) {
      const need = tokens(provider);
      if (need.length) {
        const hit =
          (await searchCommons(`${provider} campus`, need, "campus")) ??
          (await searchCommons(provider, need, "campus"));
        if (hit) return hit;
      }
    }
    const name = COUNTRY_ALIAS[country.toLowerCase()] ?? country.toLowerCase();
    if (name && name !== "unknown") {
      const need = tokens(name, 3);
      if (need.length) return await searchCommons(`${name} (skyline OR cityscape OR landmark)`, need, "country");
    }
  } catch {
    // offline or blocked: fall through to the placeholder
  }
  return null;
}

export function useCampusPhoto({
  provider,
  country,
  enabled = true,
}: {
  provider?: string;
  country?: string;
  enabled?: boolean;
}) {
  const p = (provider ?? "").trim();
  const c = (country ?? "").trim();
  return useQuery({
    queryKey: ["campus-photo", p, c],
    enabled: enabled && (!!p || !!c),
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60 * 24,
    retry: 1,
    queryFn: () => findPhoto(p, c),
  });
}
