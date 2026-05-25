// Server-only image fetcher.
//
// We no longer call any third-party image API (Unsplash etc.). Primary image
// URLs are returned directly by the Lovable AI Gateway as part of the
// hydration tool call. This module only provides a free, no-key Wikipedia
// fallback used by the backfill job and as a last resort if the AI omits
// the field.

const WIKI_ENDPOINT = "https://en.wikipedia.org/w/api.php";

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

/** Fetch a campus / building photo for a university (Wikipedia fallback). */
export async function fetchUniversityCampusImage(name: string): Promise<string | null> {
  if (!name) return null;
  return await fetchWikipediaPageImage(name);
}

/** Fetch a landmark / landscape photo of a country (Wikipedia fallback). */
export async function fetchCountryBannerImage(country: string): Promise<string | null> {
  if (!country) return null;
  return await fetchWikipediaPageImage(country);
}
