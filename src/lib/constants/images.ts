// Deterministic country → hero image map. Pre-optimized Unsplash WebP URLs.
// Use getCountryImage(country) so common aliases (USA/UK/etc.) resolve
// correctly to canonical keys.

export const COUNTRY_IMAGE_MAP: Record<string, string> = {
  "United Kingdom": "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?fm=webp&w=1600&q=80",
  "United States": "https://images.unsplash.com/photo-1501504905252-473c47e087f8?fm=webp&w=1600&q=80",
  Germany: "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?fm=webp&w=1600&q=80",
  Japan: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?fm=webp&w=1600&q=80",
  China: "https://images.unsplash.com/photo-1508804185872-d7badad00f7d?fm=webp&w=1600&q=80",
  Australia: "https://images.unsplash.com/photo-1523482580672-f109ba8cb9be?fm=webp&w=1600&q=80",
  Canada: "https://images.unsplash.com/photo-1503614472-8c93d56e92ce?fm=webp&w=1600&q=80",
  Netherlands: "https://images.unsplash.com/photo-1512470876302-972faa2aa9a4?fm=webp&w=1600&q=80",
  Sweden: "https://images.unsplash.com/photo-1509356843151-3e7d96241e11?fm=webp&w=1600&q=80",
  "South Korea": "https://images.unsplash.com/photo-1517154421773-0529f29ea451?fm=webp&w=1600&q=80",
  France: "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?fm=webp&w=1600&q=80",
  "European Union": "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?fm=webp&w=1600&q=80",
  "Multiple Countries": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?fm=webp&w=1600&q=80",
  DEFAULT: "https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?fm=webp&w=1600&q=80",
};

const ALIASES: Record<string, string> = {
  uk: "United Kingdom",
  "u.k.": "United Kingdom",
  britain: "United Kingdom",
  "great britain": "United Kingdom",
  england: "United Kingdom",
  usa: "United States",
  "u.s.": "United States",
  "u.s.a.": "United States",
  us: "United States",
  america: "United States",
  korea: "South Korea",
  "republic of korea": "South Korea",
  holland: "Netherlands",
  eu: "European Union",
  "eu (multi)": "European Union",
  europe: "European Union",
  multi: "Multiple Countries",
  multiple: "Multiple Countries",
  global: "Multiple Countries",
  worldwide: "Multiple Countries",
};

export function getCountryImage(country?: string | null): string {
  if (!country) return COUNTRY_IMAGE_MAP.DEFAULT;
  const direct = COUNTRY_IMAGE_MAP[country];
  if (direct) return direct;
  const key = country.trim().toLowerCase();
  const canonical = ALIASES[key];
  if (canonical && COUNTRY_IMAGE_MAP[canonical]) return COUNTRY_IMAGE_MAP[canonical];
  return COUNTRY_IMAGE_MAP.DEFAULT;
}
