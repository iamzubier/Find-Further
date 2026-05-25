import { useState, useEffect } from "react";

/**
 * SmartLogo — bulletproof university/scholarship logo.
 *
 * Order of preference:
 *   1. Explicit `logoUrl` prop (e.g. a stored logo_url from the DB)
 *   2. Google Favicon API derived from `domain` (or `website`)
 *   3. Navy-blue letter badge with the first letter of `name`
 *
 * If any image fails (onError), we automatically fall through to the next
 * option, ending with the typographic badge so we NEVER render a broken image.
 */

function domainFromWebsite(website?: string | null): string | null {
  if (!website) return null;
  try {
    const url = website.startsWith("http") ? website : `https://${website}`;
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

function firstLetter(name: string): string {
  const trimmed = (name || "").trim();
  if (!trimmed) return "?";
  // Prefer uppercase first letter of first significant word
  const m = trimmed.match(/[A-Za-z0-9]/);
  return (m?.[0] ?? trimmed.charAt(0)).toUpperCase();
}

export interface SmartLogoProps {
  name: string;
  /** Direct logo URL (e.g. stored logo_url) */
  logoUrl?: string | null;
  /** Domain like "harvard.edu" — used to build Google favicon URL */
  domain?: string | null;
  /** Full website URL (e.g. "https://www.harvard.edu") — domain auto-derived */
  website?: string | null;
  /** Rendered square size in px. Defaults to 48. */
  size?: number;
  className?: string;
}

export function SmartLogo({
  name,
  logoUrl,
  domain,
  website,
  size = 48,
  className = "",
}: SmartLogoProps) {
  const resolvedDomain = domain || domainFromWebsite(website);
  const faviconSize = Math.max(64, Math.min(256, size * 2));
  const faviconUrl = resolvedDomain
    ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(resolvedDomain)}&sz=${faviconSize}`
    : null;

  // stage 0 = try logoUrl, 1 = try favicon, 2 = letter badge
  const initialStage = logoUrl ? 0 : faviconUrl ? 1 : 2;
  const [stage, setStage] = useState<number>(initialStage);

  // Reset if any of the source inputs change between renders
  useEffect(() => {
    setStage(logoUrl ? 0 : faviconUrl ? 1 : 2);
  }, [logoUrl, faviconUrl]);

  const letter = firstLetter(name);

  if (stage === 2) {
    return (
      <div
        className={`flex flex-none items-center justify-center rounded-full font-heading font-bold text-white ${className}`}
        style={{
          width: size,
          height: size,
          backgroundColor: "#1E3A8A",
          fontSize: Math.round(size * 0.46),
          lineHeight: 1,
        }}
        aria-label={`${name} logo`}
      >
        {letter}
      </div>
    );
  }

  const src = stage === 0 ? (logoUrl as string) : (faviconUrl as string);

  return (
    <div
      className={`flex flex-none items-center justify-center overflow-hidden rounded-md border border-border bg-white ${className}`}
      style={{ width: size, height: size }}
    >
      <img
        src={src}
        alt={`${name} logo`}
        loading="lazy"
        className="max-h-full max-w-full object-contain p-1"
        onError={() => setStage((s) => s + 1)}
      />
    </div>
  );
}

export default SmartLogo;
