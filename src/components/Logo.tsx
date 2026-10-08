import { Link } from "@tanstack/react-router";

export function Logo({ className = "" }: { className?: string; showWord?: boolean }) {
  return (
    <Link to="/" className={`group inline-flex items-center gap-2.5 ${className}`}>
      <span
        aria-hidden
        className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-grad text-[11px] font-bold tracking-tight text-white shadow-[0_2px_8px_-2px_rgba(0,60,40,0.4)] transition-transform duration-500 group-hover:rotate-[8deg]"
        style={{ background: "var(--gradient-emerald)" }}
      >
        <span className="gold-text font-heading italic">B</span>
      </span>
      <span className="font-heading text-[1.4rem] font-bold leading-none tracking-tight text-foreground">
        Find<span className="italic font-medium gradient-text">Further</span>
      </span>
    </Link>
  );
}

export function LogoMark({ className = "" }: { className?: string }) {
  return (
    <span className={`font-heading font-bold italic text-foreground ${className}`} aria-label="FindFurther">FF</span>
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
