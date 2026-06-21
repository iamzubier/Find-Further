import { useQuery } from "@tanstack/react-query";

/**
 * Fetch a Wikipedia page thumbnail for a university name.
 * Uses the public REST API (CORS enabled, no key required).
 * Returns null if no page / no image is available.
 */
const INSTITUTION_HINT = /\b(university|college|institute|academy|polytechnic|school|conservatory|foundation|trust|scholarship|fellowship|programme|program|ministry|council|commission|corporation)\b/i;
const BAD_CONTEXT_HINT = /\b(attack|war|bombing|shooting|massacre|accident|province|district|governor|politician|election|murder|assassination|terrorist|riot)\b/i;
const BAD_IMAGE_HINT = /\b(logo|seal|crest|coat(?:_|\s|%20)?of(?:_|\s|%20)?arms|emblem|flag|wordmark|portrait|headshot|signature|gage[_\s]skidmore|official[_\s]photo|white[_\s]?house)\b/i;

function normalizeName(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[“”"']/g, "")
    .replace(/[()]/g, " ")
    .replace(/[–—/,-]/g, " ")
    .replace(/&/g, " and ")
    .replace(/\s+/g, " ")
    .trim();
}

function titleize(name: string): string {
  return encodeURIComponent(normalizeName(name).replace(/\s+/g, "_"));
}

function cleanWikiImage(src?: string | null, meta = ""): string | null {
  if (!src) return null;
  const decoded = decodeURIComponent(`${src} ${meta}`).toLowerCase();
  if (BAD_IMAGE_HINT.test(decoded) || /\.svg(\.png)?($|\?)/i.test(src)) return null;
  return src.replace(/\/\d+px-/, "/1200px-");
}

async function fetchSummaryThumb(name: string): Promise<string | null> {
  const r = await fetch(
    `https://en.wikipedia.org/api/rest_v1/page/summary/${titleize(name)}?redirect=true`,
    { headers: { Accept: "application/json" } },
  );
  if (!r.ok) return null;
  const j: any = await r.json();
  if (BAD_CONTEXT_HINT.test(`${j?.title ?? ""} ${j?.description ?? ""}`)) return null;
  return cleanWikiImage(j?.originalimage?.source ?? j?.thumbnail?.source, `${j?.title ?? ""} ${j?.description ?? ""}`);
}

function scoreSearchPage(page: any, query: string): number {
  const title = normalizeName(page?.title ?? "").toLowerCase();
  const normalizedQuery = normalizeName(query).toLowerCase();
  const tokens = normalizedQuery.split(" ").filter((token) => token.length > 2);
  let score = 0;
  if (title === normalizedQuery) score += 120;
  if (title.includes(normalizedQuery)) score += 60;
  score += tokens.filter((token) => title.includes(token)).length * 8;
  if (INSTITUTION_HINT.test(title)) score += 30;
  if (BAD_CONTEXT_HINT.test(title)) score -= 80;
  return score;
}

async function searchWikiThumb(name: string): Promise<string | null> {
  const query = normalizeName(name);
  const url = new URL("https://en.wikipedia.org/w/api.php");
  url.searchParams.set("action", "query");
  url.searchParams.set("generator", "search");
  url.searchParams.set("gsrsearch", query);
  url.searchParams.set("gsrlimit", "6");
  url.searchParams.set("prop", "pageimages|info");
  url.searchParams.set("piprop", "original|thumbnail");
  url.searchParams.set("pithumbsize", "1200");
  url.searchParams.set("inprop", "url");
  url.searchParams.set("format", "json");
  url.searchParams.set("origin", "*");

  const r = await fetch(url.toString());
  if (!r.ok) return null;
  const j: any = await r.json();
  const pages = Object.values(j?.query?.pages ?? {}) as any[];
  return pages
    .sort((a, b) => scoreSearchPage(b, query) - scoreSearchPage(a, query))
    .map((page) => {
      const image = page?.original?.source ?? page?.thumbnail?.source ?? null;
      return cleanWikiImage(image, page?.title ?? "");
    })
    .find(Boolean) ?? null;
}

async function fetchWikiThumb(name: string): Promise<string | null> {
  if (!name) return null;
  try {
    const exact = await fetchSummaryThumb(name);
    if (exact) return exact;
    return await searchWikiThumb(name);
  } catch {
    return null;
  }
}

export function useWikiImage(name: string, enabled = true) {
  return useQuery({
    queryKey: ["wiki-img-v2", name],
    queryFn: () => fetchWikiThumb(name),
    enabled: enabled && !!name,
    staleTime: 24 * 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    retry: 0,
  });
}
