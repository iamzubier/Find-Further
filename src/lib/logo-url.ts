export function normalizeLogoUrl(url?: string | null): string | null {
  const value = url?.trim();
  return value ? value : null;
}

export function isWeakLogoUrl(url?: string | null): boolean {
  const value = normalizeLogoUrl(url);
  if (!value) return true;

  return [
    /(^https?:\/\/)?logo\.clearbit\.com\//i,
    /(^https?:\/\/)?www\.google\.com\/s2\/favicons/i,
  ].some((pattern) => pattern.test(value));
}