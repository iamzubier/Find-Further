import { Link } from "@tanstack/react-router";

export function Logo({ className = "", showWord = true }: { className?: string; showWord?: boolean }) {
  return (
    <Link to="/" className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark className="h-7 w-7" />
      {showWord && (
        <span className="font-heading text-[1.35rem] leading-none tracking-tight text-foreground">
          BeyondBorder
        </span>
      )}
    </Link>
  );
}

export function LogoMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 56" className={className} fill="none" aria-label="BeyondBorder">
      {/* Shield */}
      <path
        d="M4 6 L44 6 L44 28 Q44 44 24 54 Q4 44 4 28 Z"
        fill="currentColor"
        className="text-foreground"
      />
      {/* Inner cut */}
      <path
        d="M8 10 L40 10 L40 28 Q40 41 24 49 Q8 41 8 28 Z"
        fill="var(--color-background)"
      />
      {/* Crossbar */}
      <rect x="8" y="22" width="32" height="1.5" fill="currentColor" className="text-foreground" />
      {/* BB monogram */}
      <text
        x="24"
        y="20"
        textAnchor="middle"
        fontFamily="'Playfair Display', Georgia, serif"
        fontSize="14"
        fontWeight="700"
        fontStyle="italic"
        fill="currentColor"
        className="text-foreground"
      >
        BB
      </text>
      {/* Star */}
      <circle cx="24" cy="34" r="1.6" fill="currentColor" className="text-foreground" />
      {/* Laurel hint */}
      <path d="M14 32 Q18 38 22 40" stroke="currentColor" strokeWidth="1.2" className="text-foreground" fill="none" strokeLinecap="round" />
      <path d="M34 32 Q30 38 26 40" stroke="currentColor" strokeWidth="1.2" className="text-foreground" fill="none" strokeLinecap="round" />
    </svg>
  );
}

/* Decorative large crest used as background art */
export function CrestArt({ className = "", variant = "a" }: { className?: string; variant?: "a" | "b" | "c" }) {
  if (variant === "b") {
    return (
      <svg viewBox="0 0 200 240" className={className} fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden>
        <path d="M40 24 L160 24 L160 130 Q160 184 100 220 Q40 184 40 130 Z" />
        <path d="M100 24 V220" />
        <path d="M40 84 H160" />
        <circle cx="100" cy="96" r="14" />
        <path d="M70 140 Q100 170 130 140" />
        <text x="100" y="200" textAnchor="middle" fontSize="9" letterSpacing="2" fontFamily="serif">SCIENTIA · LUX</text>
      </svg>
    );
  }
  if (variant === "c") {
    return (
      <svg viewBox="0 0 200 200" className={className} fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden>
        <circle cx="100" cy="100" r="86" />
        <circle cx="100" cy="100" r="68" />
        <path d="M100 32 V168 M32 100 H168" />
        <text x="100" y="22" textAnchor="middle" fontSize="8" letterSpacing="3" fontFamily="serif">UNIVERSITAS · MUNDI</text>
        <path d="M70 100 L100 130 L160 70" strokeWidth="1.5" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 200 240" className={className} fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden>
      <path d="M30 30 L170 30 L170 140 Q170 188 100 220 Q30 188 30 140 Z" />
      <path d="M30 90 H170" />
      <path d="M100 30 V220" />
      <path d="M60 60 L80 80 M140 60 L120 80" />
      <circle cx="100" cy="60" r="10" />
      <path d="M60 130 L80 130 M120 130 L140 130" />
      <path d="M60 160 L80 160 M120 160 L140 160" />
      <text x="100" y="200" textAnchor="middle" fontSize="9" letterSpacing="2" fontFamily="serif">AD · ASTRA</text>
    </svg>
  );
}
