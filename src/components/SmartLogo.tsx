import { useState, useEffect } from "react";
import { isWeakLogoUrl } from "@/lib/logo-url";

/**
 * SmartLogo — resilient university/scholarship logo.
 *
 * Order of preference:
 *   1. Explicit `logoUrl` prop when it's a real image URL
 *   2. Premium monogram — first letter on a dark slate square
 *
 * Weak favicon/Clearbit sources are intentionally skipped because they caused
 * the blurry/broken university marks the user reported.
 */

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
  size = 48,
  className = "",
}: SmartLogoProps) {
  const normalizedLogoUrl = logoUrl?.trim() || null;
  const weakPrimary = isWeakLogoUrl(normalizedLogoUrl);

  const sources = [
    normalizedLogoUrl && !weakPrimary ? normalizedLogoUrl : null,
  ].filter((value, index, arr): value is string => Boolean(value) && arr.indexOf(value) === index);

  const [stage, setStage] = useState<number>(0);

  useEffect(() => {
    setStage(0);
  }, [normalizedLogoUrl]);

  const advance = () => {
    setStage((s) => s + 1);
  };

  // Premium monogram — final fallback.
  if (stage >= sources.length) {
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

  const src = sources[stage];

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
