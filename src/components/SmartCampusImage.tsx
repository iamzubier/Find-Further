import { useState, useEffect, CSSProperties } from "react";

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
  const initial = src && src.trim() ? src : null;
  const [currentSrc, setCurrentSrc] = useState<string | null>(initial);

  useEffect(() => {
    setCurrentSrc(src && src.trim() ? src : null);
  }, [src]);

  const positionClass = inline ? "block h-full w-full" : "absolute inset-0 h-full w-full";

  // Letter-based gradient fallback when no image is available.
  if (!currentSrc) {
    return (
      <>
        <div
          aria-label={alt ?? `${name} hero`}
          role="img"
          className={`${positionClass} ${className}`}
          style={{ background: gradientForName(name), ...style }}
        />
        {!noOverlay && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{ backgroundColor: "rgba(255,255,255,0.04)" }}
          />
        )}
      </>
    );
  }

  return (
    <>
      <img
        src={currentSrc}
        alt={alt ?? `${name} campus`}
        loading={loading}
        className={`${positionClass} object-cover ${className}`}
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
