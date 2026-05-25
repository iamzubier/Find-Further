import { useState, useEffect, CSSProperties } from "react";

/**
 * SmartCampusImage — bulletproof campus/hero photo.
 *
 * If `src` is missing or fails to load, we fall back to a deterministic pick
 * from a curated set of reliable Unsplash photo IDs (selected by the length of
 * `name` so the same university always shows the same fallback).
 *
 * Renders an absolutely positioned <img> with object-cover sizing — drop it
 * inside a positioned parent (relative + a defined height) and it will fill it.
 * A faint white overlay keeps the bright premium-directory aesthetic.
 */

const FALLBACKS = [
  "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1200&q=80",
  "https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?w=1200&q=80",
  "https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=1200&q=80",
  "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1200&q=80",
];

export function pickFallbackCampus(name: string): string {
  const len = (name || "").length;
  return FALLBACKS[len % FALLBACKS.length];
}

export interface SmartCampusImageProps {
  /** Campus image URL — typically from the universities_detail.campus_image_url field */
  src?: string | null;
  /** University name — used to pick a deterministic fallback */
  name: string;
  /** Alt text. Defaults to "<name> campus". */
  alt?: string;
  className?: string;
  style?: CSSProperties;
  /** If true, render as a plain block image (not absolutely positioned). */
  inline?: boolean;
  /** If true, omit the subtle light overlay (e.g. when parent has its own dark gradient). */
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
  const fallback = pickFallbackCampus(name);
  const [currentSrc, setCurrentSrc] = useState<string>(src && src.trim() ? src : fallback);

  useEffect(() => {
    setCurrentSrc(src && src.trim() ? src : fallback);
  }, [src, fallback]);

  const baseImgClass = inline
    ? `block h-full w-full object-cover ${className}`
    : `absolute inset-0 h-full w-full object-cover ${className}`;

  return (
    <>
      <img
        src={currentSrc}
        alt={alt ?? `${name} campus`}
        loading={loading}
        className={baseImgClass}
        style={style}
        onError={() => {
          if (currentSrc !== fallback) setCurrentSrc(fallback);
        }}
      />
      {!noOverlay && (
        <div
          aria-hidden
          className={inline ? "pointer-events-none absolute inset-0" : "pointer-events-none absolute inset-0"}
          style={{ backgroundColor: "rgba(255,255,255,0.05)" }}
        />
      )}
    </>
  );
}

export default SmartCampusImage;
