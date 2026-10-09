// src/lib/use-campus-photo.ts  (v2)
// Finds a real photo of a university campus (or, failing that, a landmark of the
// host country). Photos come from Wikimedia Commons: free, no API key, reusable
// commercially as long as the photographer is credited (the hook returns the credit).
import { useQuery } from "@tanstack/react-query";

export type CampusPhoto = {
  url: string;
  credit: string;
  pageUrl: string;
  kind: "campus" | "country";
};

const COMMONS = "https://commons.wikimedia.org/w/api.php";
const WIKI = "https://en.wikipedia.org/w/api.php";

// Filenames that are NOT a real photo of a place
const BAD =
  /\b(logos?|seals?|crests?|emblems?|coat of arms|flags?|maps?|diagrams?|charts?|signatures?|portraits?|plaques?|posters?|banners?|icons?|stamps?|certificates?|diplomas?|covers?|screenshots?|scans?|sketch(es)?|drawings?|paintings?|postcards?|pdf)\b/i;
// Photos of people / indoors are allowed but ranked lower
const PEOPLE =
  /\b(students?|people|crowd|ceremony|protest|festival|lecture|classroom|interior|inside|meeting|conference|team|president|professor)\b/i;
// Filenames that usually are a nice campus shot
const GOOD =
  /campus|building|hall|library|quad|gate|tower|aerial|panorama|view|entrance|courtyard|facade|main|university|college|institute/i;
const STOP = new Set([
  "university", "universities", "college", "institute", "school", "the", "and", "for", "of", "national", "state",
]);
// Only look for a campus when the provider actually looks like an institution
const INSTITUTION = /univers|college|institut|polytechnic|academy|hochschule|ecole|école|escuela|school of/i;
const COUNTRY_ALIAS: Record<string, string> = {
  uk: "united kingdom", usa: "united states", us: "united states", uae: "united arab emirates",
};
const INFO = {
  prop: "imageinfo",
  iiprop: "url|size|mime|extmetadata",
  iiurlwidth: "1600",
  iiextmetadatafilter: "Artist|LicenseShortName|ImageDescription|Categories",
};

export function tokens(s: string, minLen = 4): string[] {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= minLen && !STOP.has(t));
}

// Pick the best landscape JPEG from a MediaWiki "imageinfo" response.
// `need`: words that must appear in the file name/categories/description (may be empty).
// `order`: optional list of file titles in article order (earlier = better).
export function pickBest(
  json: any,
  need: string[],
  kind: CampusPhoto["kind"],
  order?: string[],
): CampusPhoto | null {
  const pages: any[] = Object.values(json?.query?.pages ?? {});
  let best: { score: number; photo: CampusPhoto } | null = null;

  for (const p of pages) {
    const ii = p?.imageinfo?.[0];
    if (!ii || ii.mime !== "image/jpeg") continue;
    const w = Number(ii.width), h = Number(ii.height);
    if (!(w >= 900 && h > 0)) continue;
    const ratio = w / h;
    if (ratio < 1.3 || ratio > 2.6) continue;

    const title = String(p.title ?? "").replace(/^File:/, "");
    if (BAD.test(title)) continue;

    const meta = ii.extmetadata ?? {};
    const haystack = `${title} ${meta.Categories?.value ?? ""} ${meta.ImageDescription?.value ?? ""}`.toLowerCase();
    const hits = need.filter((t) => haystack.includes(t)).length;
    if (hits < Math.min(2, need.length)) continue;

    const rank = order ? Math.max(0, order.indexOf(String(p.title))) : (p.index ?? 0);
    let score = hits * 10 + Math.min(w, 4000) / 400 - rank * 0.4;
    if (GOOD.test(title)) score += 6;
    if (PEOPLE.test(title)) score -= 8;

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

async function api(base: string, params: Record<string, string>): Promise<any | null> {
  const qs = new URLSearchParams({ action: "query", format: "json", origin: "*", ...params });
  const res = await fetch(`${base}?${qs}`);
  return res.ok ? res.json() : null;
}

// Plain Commons search ("KAIST campus", "south korea skyline", ...)
async function commonsSearch(query: string, kind: CampusPhoto["kind"]) {
  const json = await api(COMMONS, {
    generator: "search",
    gsrnamespace: "6",
    gsrlimit: "25",
    gsrsearch: `${query} filetype:bitmap`,
    ...INFO,
  });
  return json ? pickBest(json, [], kind) : null;
}

// Best route for universities: take the photos used in the university's Wikipedia
// article, then keep only the free ones hosted on Commons.
async function wikiArticlePhoto(name: string, need: string[]) {
  const a = await api(WIKI, { generator: "search", gsrsearch: name, gsrlimit: "1", prop: "images", imlimit: "60" });
  const page: any = Object.values(a?.query?.pages ?? {})[0];
  if (!page) return null;
  const title = String(page.title ?? "").toLowerCase();
  if (!need.some((t) => title.includes(t))) return null; // wrong article
  const files: string[] = (page.images ?? [])
    .map((i: any) => String(i.title))
    .filter((t: string) => /\.jpe?g$/i.test(t) && !BAD.test(t))
    .slice(0, 40);
  if (!files.length) return null;
  const b = await api(COMMONS, { titles: files.join("|"), ...INFO });
  return b ? pickBest(b, [], "campus", files) : null;
}

export async function findPhoto(provider: string, country: string): Promise<CampusPhoto | null> {
  try {
    if (provider && INSTITUTION.test(provider)) {
      const acronym = provider.match(/\(([A-Za-z]{2,8})\)/)?.[1];
      const clean = provider.replace(/\([^)]*\)/g, "").replace(/\s+/g, " ").trim();
      const need = tokens(provider);
      const hit =
        (need.length ? await wikiArticlePhoto(clean, need) : null) ??
        (acronym ? await commonsSearch(`${acronym} campus`, "campus") : null) ??
        (await commonsSearch(`${clean} campus`, "campus"));
      if (hit) return hit;
    }
    const name = COUNTRY_ALIAS[country.toLowerCase()] ?? country.toLowerCase();
    if (name && name !== "unknown") {
      return (await commonsSearch(`${name} skyline`, "country")) ?? (await commonsSearch(`${name} landmark`, "country"));
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
    queryFn: async () => {
      const r = await findPhoto(p, c);
      console.info("[campus-photo]", p || "(no provider)", "|", c, "→", r ? `${r.kind}: ${r.url}` : "no photo found");
      return r;
    },
  });
}
