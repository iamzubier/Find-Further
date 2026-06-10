import { useQuery } from "@tanstack/react-query";

/**
 * Fetch a Wikipedia page thumbnail for a university name.
 * Uses the public REST API (CORS enabled, no key required).
 * Returns null if no page / no image is available.
 */
async function fetchWikiThumb(name: string): Promise<string | null> {
  if (!name) return null;
  const title = encodeURIComponent(name.replace(/\s+/g, "_"));
  try {
    const r = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${title}?redirect=true`,
      { headers: { Accept: "application/json" } },
    );
    if (!r.ok) return null;
    const j: any = await r.json();
    const src: string | undefined =
      j?.originalimage?.source ?? j?.thumbnail?.source;
    if (!src) return null;
    // Upgrade thumb size when possible.
    return src.replace(/\/\d+px-/, "/1200px-");
  } catch {
    return null;
  }
}

export function useWikiImage(name: string, enabled = true) {
  return useQuery({
    queryKey: ["wiki-img", name],
    queryFn: () => fetchWikiThumb(name),
    enabled: enabled && !!name,
    staleTime: 24 * 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    retry: 0,
  });
}
