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

/**
 * Return a deterministic gradient based on the first letter of the name.
 * A–G → deep navy, H–P → slate, Q–Z → forest green.
 */
export function gradientForName(name: string): string {
  const l = firstLetter(name);
  if (l >= "A" && l <= "G") {
    return "linear-gradient(135deg,#0c2340 0%,#1e3a5f 55%,#3b6fa0 100%)";
  }
  if (l >= "H" && l <= "P") {
    return "linear-gradient(135deg,#1e293b 0%,#334155 55%,#64748b 100%)";
  }
  return "linear-gradient(135deg,#064e3b 0%,#0d7a5f 55%,#166534 100%)";
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
    return (
      <>
        <div
          aria-label={alt ?? `${name} background`}
          role="img"
          className={`${positionClass} bg-slate-950 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(30,58,138,0.3),rgba(255,255,255,0))] ${className}`}
          style={style}
        />
        {!noOverlay && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent"
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
