import { useState, useEffect } from "react";

/**
 * SmartLogo — bulletproof university/scholarship logo.
 *
 * Order of preference:
 *   1. Explicit `logoUrl` prop (e.g. stored logo_url from the DB)
 *   2. Clearbit logo API derived from `domain` (or `website`)
 *   3. Google favicon API derived from `domain` (or `website`)
 *   4. Premium monogram — first letter on a dark slate square
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
  const m = trimmed.match(/[A-Za-z0-9]/);
  return (m?.[0] ?? trimmed.charAt(0)).toUpperCase();
}

export interface SmartLogoProps {
  name: string;
  logoUrl?: string | null;
  domain?: string | null;
  website?: string | null;
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
  const clearbitUrl = resolvedDomain ? `https://logo.clearbit.com/${resolvedDomain}` : null;
  const faviconSize = Math.max(64, Math.min(256, size * 2));
  const faviconUrl = resolvedDomain
    ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(resolvedDomain)}&sz=${faviconSize}`
    : null;

  // Stages: 0=logoUrl, 1=clearbit, 2=favicon, 3=monogram.
  const computeInitial = () => {
    if (logoUrl) return 0;
    if (clearbitUrl) return 1;
    if (faviconUrl) return 2;
    return 3;
  };
  const [stage, setStage] = useState<number>(computeInitial);

  useEffect(() => {
    setStage(computeInitial());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logoUrl, clearbitUrl, faviconUrl]);

  const advance = () => {
    setStage((s) => {
      let next = s + 1;
      if (next === 1 && !clearbitUrl) next = 2;
      if (next === 2 && !faviconUrl) next = 3;
      return next;
    });
  };

  // Premium monogram — final fallback.
  if (stage >= 3) {
    return (
      <div
        className={`flex flex-none items-center justify-center overflow-hidden rounded-xl bg-slate-900 font-serif font-bold text-white shadow-md ${className}`}
        style={{ width: size, height: size, fontSize: Math.round(size * 0.5), lineHeight: 1 }}
        aria-label={`${name} logo`}
      >
        {firstLetter(name)}
      </div>
    );
  }

  const src = stage === 0 ? (logoUrl as string) : stage === 1 ? (clearbitUrl as string) : (faviconUrl as string);

  return (
    <div
      className={`flex flex-none items-center justify-center overflow-hidden rounded-xl border border-border bg-white shadow-md ${className}`}
      style={{ width: size, height: size }}
    >
      <img
        src={src}
        alt={`${name} logo`}
        loading="lazy"
        className="h-full w-full object-contain p-2 drop-shadow-sm"
        onError={advance}
      />
    </div>
  );
}

export default SmartLogo;
