const WIKIPEDIA_SUMMARY = "https://en.wikipedia.org/api/rest_v1/page/summary";
const WIKIDATA_ENTITY = "https://www.wikidata.org/wiki/Special:EntityData";
const COMMONS_FILE = "https://commons.wikimedia.org/wiki/Special:FilePath";

type WikidataClaims = Record<string, Array<{
  mainsnak?: {
    datavalue?: {
      value?: unknown;
    };
  };
}>>;

type WikidataEntityResponse = {
  entities?: Record<string, {
    claims?: WikidataClaims;
  }>;
};

function withUserAgent() {
  return { "User-Agent": "BeyondBorder/1.0 (logo resolver)" };
}

function filePathUrl(fileName: string): string {
  return `${COMMONS_FILE}/${encodeURIComponent(fileName)}`;
}

function extractFileName(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function isLikelyRealLogo(url: string | null): boolean {
  if (!url) return false;
  return /upload\.wikimedia\.org|commons\.wikimedia\.org/i.test(url)
    && /(logo|seal|crest|shield|arms|wordmark|emblem|coa|symbol|badge|svg)/i.test(url);
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const response = await fetch(url, {
      headers: withUserAgent(),
      redirect: "follow",
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

function pickCommonsAsset(claims?: WikidataClaims): string | null {
  if (!claims) return null;

  const preferredProps = ["P158", "P94", "P154"];
  for (const prop of preferredProps) {
    const values = claims[prop] ?? [];
    for (const claim of values) {
      const fileName = extractFileName(claim?.mainsnak?.datavalue?.value);
      if (fileName) return filePathUrl(fileName);
    }
  }

  return null;
}

export async function fetchUniversityWikipediaLogo(name: string): Promise<string | null> {
  const normalizedName = name.trim();
  if (!normalizedName) return null;

  const summary = await fetchJson<{ wikibase_item?: string; originalimage?: { source?: string }; thumbnail?: { source?: string } }>(
    `${WIKIPEDIA_SUMMARY}/${encodeURIComponent(normalizedName.replace(/\s+/g, "_"))}`,
  );

  const wikibaseItem = summary?.wikibase_item?.trim();
  if (wikibaseItem) {
    const entity = await fetchJson<WikidataEntityResponse>(`${WIKIDATA_ENTITY}/${wikibaseItem}.json`);
    const logoUrl = pickCommonsAsset(entity?.entities?.[wikibaseItem]?.claims);
    if (logoUrl) return logoUrl;
  }

  const fallbackImage = summary?.originalimage?.source ?? summary?.thumbnail?.source ?? null;
  return isLikelyRealLogo(fallbackImage) ? fallbackImage : null;
}