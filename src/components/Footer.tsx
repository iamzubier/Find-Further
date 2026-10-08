import { Link } from "@tanstack/react-router";
import { Logo } from "@/components/Logo";

export function Footer() {
  return (
    <footer className="mt-24 relative overflow-hidden" style={{ background: "var(--gradient-hero)" }}>
      {/* Top gold hairline */}
      <div className="hairline-gold" />
      {/* Subtle radial highlight */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{ background: "radial-gradient(ellipse 60% 60% at 50% -10%, oklch(0.74 0.10 85 / 0.18), transparent 70%)" }}
      />

      <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-16 md:grid-cols-4 lg:px-6">
        <div className="md:col-span-1">
          <div className="[&_*]:!text-white">
            <Logo />
          </div>
          <p className="mt-4 text-sm leading-relaxed text-white/70">
            The atlas for students with ambition. <span className="serif-italic gold-text">No borders. No commissions.</span>
          </p>
          <div className="mt-6 hairline-gold w-16" />
        </div>

        <FooterCol title="Explore" links={[
          { to: "/universities", label: "Universities" },
          { to: "/scholarships", label: "Scholarships" },
          { to: "/evaluate", label: "Evaluate my profile" },
          { to: "/compare", label: "Compare" },
        ]} />

        <FooterCol title="For Students" links={[
          { to: "/auth", label: "Create account", search: { tab: "signup" } },
          { to: "/profile", label: "Build profile" },
          { to: "/ask-ai", label: "Ask Aria AI" },
          { to: "/shortlist", label: "Saved" },
        ]} />

        <div>
          <h4 className="mb-4 font-heading text-xs font-bold uppercase tracking-[0.18em] text-white/50">Global</h4>
          <p className="text-sm leading-relaxed text-white/70">
            Built for students from any country, applying to any university worldwide.
            <span className="block mt-3 serif-italic gold-text text-base">Free. Forever.</span>
          </p>
        </div>
      </div>

      <div className="relative border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-6 text-xs text-white/50 sm:flex-row lg:px-6">
          <span>© {new Date().getFullYear()} FindFurther — crafted for the next generation of scholars.</span>
          <span className="serif-italic gold-text tracking-wider">Ad · Astra</span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: Array<{ to: string; label: string; search?: any }> }) {
  return (
    <div>
      <h4 className="mb-4 font-heading text-xs font-bold uppercase tracking-[0.18em] text-white/50">{title}</h4>
      <ul className="space-y-2.5 text-sm">
        {links.map((l) => (
          <li key={l.to + l.label}>
            <Link
              to={l.to}
              search={l.search}
              className="text-white/75 transition-colors duration-300 hover:text-white story-link"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
