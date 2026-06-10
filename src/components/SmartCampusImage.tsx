import { useState, useEffect, useRef, CSSProperties } from "react";

/**
 * SmartCampusImage — dynamic campus/hero photo with an elegant
 * letter-derived gradient fallback when no image URL is available.
 *
 * Renders an absolutely positioned <img> with object-cover sizing — drop it
 * inside a positioned parent (relative + a defined height) and it will fill it.
 */

function firstLetter(name: string): string {
  const t = (name || "").trim();
  const m = t.match(/[A-Za-z]/);
  return (m?.[0] ?? "A").toUpperCase();
}

function initialsForName(name: string): string {
  const parts = (name || "")
    .split(/\s+/)
    .map((part) => part.replace(/[^A-Za-z0-9]/g, ""))
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) return firstLetter(name);
  return parts.map((part) => part[0]!.toUpperCase()).join("");
}

function hashName(name: string): number {
  let hash = 0;
  for (const char of name) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  return hash;
}

/**
 * Return a deterministic premium gradient based on the full school name,
 * so fallbacks feel distinct even when many schools share the same first letter.
 */
export function gradientForName(name: string): string {
  const palettes = [
    "linear-gradient(135deg, #06121a 0%, #003b24 52%, #006039 100%)",
    "linear-gradient(135deg, #0b0b0b 0%, #0e2b1d 46%, #a37e2c 100%)",
    "linear-gradient(135deg, #09131b 0%, #123227 42%, #2b6b52 100%)",
    "linear-gradient(135deg, #0d1117 0%, #1a2a24 50%, #7b6527 100%)",
    "linear-gradient(135deg, #081018 0%, #16382a 48%, #0f6b45 100%)",
    "linear-gradient(135deg, #101010 0%, #23352b 45%, #8f6f29 100%)",
  ];

  return palettes[hashName(name) % palettes.length]!;
}

export interface SmartCampusImageProps {
  src?: string | null;
  name: string;
  alt?: string;
  className?: string;
  style?: CSSProperties;
  inline?: boolean;
  noOverlay?: boolean;
  loading?: "lazy" | "eager";
}

export function SmartCampusImage({
  src,
  name,
  alt,
  className = "",
  style,
  inline = false,
  noOverlay = false,
  loading = "lazy",
}: SmartCampusImageProps) {
  const normalizedSrc = src?.trim() || null;
  const blockedSource = normalizedSrc
    ? /(^https?:\/\/)?images\.unsplash\.com\//i.test(normalizedSrc)
    : false;
  const initial = normalizedSrc && !blockedSource ? normalizedSrc : null;
  const [currentSrc, setCurrentSrc] = useState<string | null>(initial);
  const [loaded, setLoaded] = useState(false);
  const imageRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    setCurrentSrc(normalizedSrc && !blockedSource ? normalizedSrc : null);
    setLoaded(false);
  }, [normalizedSrc, blockedSource]);

  useEffect(() => {
    const image = imageRef.current;
    if (image && image.complete && image.naturalWidth > 0) {
      setLoaded(true);
    }
  }, [currentSrc]);

  const positionClass = inline ? "block h-full w-full" : "absolute inset-0 h-full w-full";

  // Deterministic zero-key fallback when no image is available.
  if (!currentSrc) {
    const hash = hashName(name);
    const monogram = initialsForName(name);
    const gradient = gradientForName(name);
    const glowX = 18 + (hash % 54);
    const glowY = 10 + ((hash >> 4) % 28);
    const arcRotation = (hash % 24) - 12;
    return (
      <>
        <div
          aria-label={alt ?? `${name} background`}
          role="img"
          className={`${positionClass} overflow-hidden ${className}`}
          style={{
            backgroundImage: `${gradient}, radial-gradient(circle at top right, rgba(255,255,255,0.18), transparent 32%), linear-gradient(180deg, rgba(255,255,255,0.10), rgba(0,0,0,0.18))`,
            ...style,
          }}
        >
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background: `radial-gradient(circle at ${glowX}% ${glowY}%, rgba(255,255,255,0.18), transparent 24%), radial-gradient(circle at 82% 78%, rgba(163,126,44,0.26), transparent 28%)`,
            }}
          />
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              backgroundImage: "linear-gradient(135deg, rgba(255,255,255,0.08) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.08) 75%, transparent 75%, transparent)",
              backgroundSize: "34px 34px",
              opacity: 0.18,
              mixBlendMode: "soft-light",
            }}
          />
          <div
            aria-hidden
            className="absolute -right-10 top-3 h-28 w-28 rounded-full border border-white/20"
            style={{ transform: `rotate(${arcRotation}deg)` }}
          />
          <div
            aria-hidden
            className="absolute -right-2 top-10 h-20 w-20 rounded-full border border-white/10"
            style={{ transform: `rotate(${-arcRotation}deg)` }}
          />
          <div
            aria-hidden
            className="absolute bottom-3 left-3 rounded-md border border-white/25 bg-white/5 px-3 py-1.5 font-semibold tracking-[0.22em] text-white/75 backdrop-blur-[2px]"
            style={{ fontSize: "0.72rem", lineHeight: 1 }}
          >
            {monogram}
          </div>
          <div
            aria-hidden
            className="absolute -bottom-4 right-3 select-none text-white/12"
            style={{ fontSize: "5.5rem", fontWeight: 700, lineHeight: 1 }}
          >
            {monogram}
          </div>
        </div>
        {!noOverlay && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{ background: "linear-gradient(to top, rgba(5,10,18,0.82), rgba(5,10,18,0.45), transparent)" }}
          />
        )}
      </>
    );
  }


  return (
    <>
      {/* Shimmer skeleton — visible until the optimized WebP downloads. */}
      {!loaded && (
        <div
          aria-hidden
          className={`${positionClass} animate-pulse bg-gray-200 dark:bg-gray-800`}
          style={style}
        />
      )}
      <img
        ref={imageRef}
        src={currentSrc}
        alt={alt ?? `${name} campus`}
        loading={loading}
        decoding="async"
        onLoad={() => setLoaded(true)}
        className={`${positionClass} object-cover transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0"} ${className}`}
        style={style}
        onError={() => setCurrentSrc(null)}
      />
      {!noOverlay && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ backgroundColor: "rgba(255,255,255,0.05)" }}
        />
      )}
    </>
  );
}

/** Back-compat shim kept for any older imports. Returns null now — callers
 *  should rely on the gradient fallback baked into SmartCampusImage. */
export function pickFallbackCampus(_name: string): string | null {
  return null;
}

export default SmartCampusImage;
