// Server-only dynamic image fetcher.
// Pulls from Unsplash first (high-quality editorial photos), then falls back
// to Wikipedia's pageimages API for university campuses.
//
// Safe to import from createServerFn handlers ONLY.

const UNSPLASH_ENDPOINT = "https://api.unsplash.com/search/photos";
const WIKI_ENDPOINT = "https://en.wikipedia.org/w/api.php";

/**
 * Force every Unsplash image we store through their Imgix CDN with strict
 * web-optimized params. Targets ~1200px wide, q=75, WebP. Massively reduces
 * payload size vs urls.regular/raw/full defaults.
 */
function optimizeUnsplashUrl(raw: string): string {
  try {
    const u = new URL(raw);
    // Strip any pre-existing sizing params to avoid duplicates / conflicts.
    ["w", "h", "q", "fm", "auto", "fit", "crop"].forEach((p) => u.searchParams.delete(p));
    u.searchParams.set("w", "1200");
    u.searchParams.set("q", "75");
    u.searchParams.set("fm", "webp");
    u.searchParams.set("auto", "format");
    return u.toString();
  } catch {
    return raw;
  }
}

async function fetchUnsplash(query: string): Promise<string | null> {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) {
    console.warn("[image-fetch] UNSPLASH_ACCESS_KEY missing");
    return null;
  }
  try {
    const url = `${UNSPLASH_ENDPOINT}?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape&content_filter=high&client_id=${encodeURIComponent(key)}`;
    const r = await fetch(url, { headers: { "Accept-Version": "v1" } });
    if (!r.ok) {
      console.warn("[image-fetch] unsplash status", r.status, query);
      return null;
    }
    const j: any = await r.json();
    const photo = j?.results?.[0];
    // Always prefer urls.regular (pre-sized ~1080w), never raw/full.
    const regular = photo?.urls?.regular;
    if (typeof regular !== "string" || !regular) return null;
    return optimizeUnsplashUrl(regular);
  } catch (e) {
    console.warn("[image-fetch] unsplash error", e);
    return null;
  }
}

async function fetchWikipediaPageImage(title: string): Promise<string | null> {
  try {
    const params = new URLSearchParams({
      action: "query",
      format: "json",
      prop: "pageimages",
      piprop: "original",
      redirects: "1",
      titles: title,
      origin: "*",
    });
    const r = await fetch(`${WIKI_ENDPOINT}?${params.toString()}`, {
      headers: { "User-Agent": "BeyondBorder/1.0 (image fetch)" },
    });
    if (!r.ok) return null;
    const j: any = await r.json();
    const pages = j?.query?.pages ?? {};
    for (const k of Object.keys(pages)) {
      const src = pages[k]?.original?.source;
      if (typeof src === "string" && src.length > 0) return src;
    }
    return null;
  } catch (e) {
    console.warn("[image-fetch] wiki error", e);
    return null;
  }
}

/** Fetch a campus / building photo for a university. */
export async function fetchUniversityCampusImage(name: string): Promise<string | null> {
  if (!name) return null;
  const unsplash = await fetchUnsplash(`${name} campus building architecture`);
  if (unsplash) return unsplash;
  return await fetchWikipediaPageImage(name);
}

/** Fetch a stunning landmark / landscape photo of a country. */
export async function fetchCountryBannerImage(country: string): Promise<string | null> {
  if (!country) return null;
  const q = `${country} famous landmark landscape high quality`;
  const u = await fetchUnsplash(q);
  if (u) return u;
  return await fetchUnsplash(`${country} cityscape skyline`);
}
