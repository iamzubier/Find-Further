// Deterministic country → hero image map. Pre-optimized Unsplash WebP URLs
// curated for premium architectural/academic feel. Supports both ISO country
// codes (US, GB, CN) and full country names.

export const COUNTRY_IMAGE_MAP: Record<string, string> = {
  // United Kingdom — Oxford spires
  UK: "https://images.unsplash.com/photo-1533929736458-ca588d08c8be?fm=webp&w=1600&q=80",
  GB: "https://images.unsplash.com/photo-1533929736458-ca588d08c8be?fm=webp&w=1600&q=80",
  "United Kingdom": "https://images.unsplash.com/photo-1533929736458-ca588d08c8be?fm=webp&w=1600&q=80",

  // United States — classical campus architecture
  US: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?fm=webp&w=1600&q=80",
  USA: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?fm=webp&w=1600&q=80",
  "United States": "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?fm=webp&w=1600&q=80",

  // China — Forbidden City / classical architecture
  CN: "https://images.unsplash.com/photo-1543097692-f3973eb7ca87?fm=webp&w=1600&q=80",
  China: "https://images.unsplash.com/photo-1543097692-f3973eb7ca87?fm=webp&w=1600&q=80",

  // Germany — Berlin Reichstag / Brandenburg
  DE: "https://images.unsplash.com/photo-1554072675-66db59dba46f?fm=webp&w=1600&q=80",
  Germany: "https://images.unsplash.com/photo-1554072675-66db59dba46f?fm=webp&w=1600&q=80",

  // Australia — Sydney Opera House / harbour
  AU: "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?fm=webp&w=1600&q=80",
  Australia: "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?fm=webp&w=1600&q=80",

  // Canada — Parliament / Ottawa
  CA: "https://images.unsplash.com/photo-1503614472-8c93d56e92ce?fm=webp&w=1600&q=80",
  Canada: "https://images.unsplash.com/photo-1503614472-8c93d56e92ce?fm=webp&w=1600&q=80",

  // Japan — temple / Kyoto
  JP: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?fm=webp&w=1600&q=80",
  Japan: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?fm=webp&w=1600&q=80",

  // Netherlands — Amsterdam canals
  NL: "https://images.unsplash.com/photo-1512470876302-972faa2aa9a4?fm=webp&w=1600&q=80",
  Netherlands: "https://images.unsplash.com/photo-1512470876302-972faa2aa9a4?fm=webp&w=1600&q=80",

  // Sweden — Stockholm
  SE: "https://images.unsplash.com/photo-1509356843151-3e7d96241e11?fm=webp&w=1600&q=80",
  Sweden: "https://images.unsplash.com/photo-1509356843151-3e7d96241e11?fm=webp&w=1600&q=80",

  // South Korea
  KR: "https://images.unsplash.com/photo-1517154421773-0529f29ea451?fm=webp&w=1600&q=80",
  "South Korea": "https://images.unsplash.com/photo-1517154421773-0529f29ea451?fm=webp&w=1600&q=80",

  // France — Sorbonne / Paris
  FR: "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?fm=webp&w=1600&q=80",
  France: "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?fm=webp&w=1600&q=80",

  EU: "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?fm=webp&w=1600&q=80",
  "European Union": "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?fm=webp&w=1600&q=80",
  "Multiple Countries": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?fm=webp&w=1600&q=80",

  // Grand university library — premium default
  DEFAULT: "https://images.unsplash.com/photo-1562774053-701939374585?fm=webp&w=1600&q=80",
};

const ALIASES: Record<string, string> = {
  "u.k.": "United Kingdom",
  britain: "United Kingdom",
  "great britain": "United Kingdom",
  england: "United Kingdom",
  "u.s.": "United States",
  "u.s.a.": "United States",
  america: "United States",
  korea: "South Korea",
  "republic of korea": "South Korea",
  holland: "Netherlands",
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
  const upper = country.trim().toUpperCase();
  if (COUNTRY_IMAGE_MAP[upper]) return COUNTRY_IMAGE_MAP[upper];
  const key = country.trim().toLowerCase();
  const canonical = ALIASES[key];
  if (canonical && COUNTRY_IMAGE_MAP[canonical]) return COUNTRY_IMAGE_MAP[canonical];
  return COUNTRY_IMAGE_MAP.DEFAULT;
}
