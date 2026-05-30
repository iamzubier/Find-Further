// Server-only helpers to fetch unique campus photos + logos from Google Maps
// Places API (New) via the Lovable connector gateway.

const GATEWAY = "https://connector-gateway.lovable.dev/google_maps";

function authHeaders() {
  const lov = process.env.LOVABLE_API_KEY;
  const gm = process.env.GOOGLE_MAPS_API_KEY;
  if (!lov) throw new Error("LOVABLE_API_KEY missing");
  if (!gm) throw new Error("GOOGLE_MAPS_API_KEY missing (connect Google Maps Platform)");
  return {
    Authorization: `Bearer ${lov}`,
    "X-Connection-Api-Key": gm,
  } as Record<string, string>;
}

export type PlaceImagery = {
  photoUrl: string | null;
  iconUrl: string | null;
  websiteUri: string | null;
  placeId: string | null;
};

/** Resolve a Google Place for the university and return a unique campus photo. */
export async function fetchUniversityPlaceImagery(
  name: string,
  country?: string | null,
): Promise<PlaceImagery> {
  if (!name) return { photoUrl: null, iconUrl: null, websiteUri: null, placeId: null };
  const textQuery = country ? `${name}, ${country}` : name;

  let search: Response;
  try {
    search = await fetch(`${GATEWAY}/places/v1/places:searchText`, {
      method: "POST",
      headers: {
        ...authHeaders(),
        "Content-Type": "application/json",
        "X-Goog-FieldMask":
          "places.id,places.displayName,places.photos,places.websiteUri,places.iconMaskBaseUri,places.types",
      },
      body: JSON.stringify({ textQuery, includedType: "university", maxResultCount: 5 }),
      signal: AbortSignal.timeout(10000),
    });
  } catch (e) {
    console.warn("[places] searchText failed", e);
    return { photoUrl: null, iconUrl: null, websiteUri: null, placeId: null };
  }
  if (!search.ok) {
    console.warn("[places] searchText status", search.status, await search.text().catch(() => ""));
    return { photoUrl: null, iconUrl: null, websiteUri: null, placeId: null };
  }
  const json: any = await search.json().catch(() => ({}));
  const place = Array.isArray(json?.places) ? json.places[0] : null;
  if (!place) return { photoUrl: null, iconUrl: null, websiteUri: null, placeId: null };

  const photoName: string | undefined = place?.photos?.[0]?.name;
  let photoUrl: string | null = null;
  if (photoName) {
    try {
      const r = await fetch(
        `${GATEWAY}/places/v1/${photoName}/media?maxWidthPx=1600&skipHttpRedirect=true`,
        { headers: authHeaders(), signal: AbortSignal.timeout(8000) },
      );
      if (r.ok) {
        const j: any = await r.json();
        if (typeof j?.photoUri === "string") photoUrl = j.photoUri;
      }
    } catch (e) {
      console.warn("[places] media failed", e);
    }
  }

  const iconMask: string | null = place?.iconMaskBaseUri ?? null;
  const iconUrl = iconMask ? `${iconMask}.png` : null;
  return {
    photoUrl,
    iconUrl,
    websiteUri: place?.websiteUri ?? null,
    placeId: place?.id ?? null,
  };
}
