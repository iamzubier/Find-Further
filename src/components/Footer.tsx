import { Link } from "@tanstack/react-router";
import { Logo } from "@/components/Logo";
import { Twitter, Instagram, Linkedin, Facebook } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-24 relative overflow-hidden border-t border-border" style={{ background: "#1D3B46" }}>
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
          <div className="[&_*]:!text-heading">
            <Logo />
          </div>
          <p className="mt-4 text-sm leading-relaxed text-heading/70">
            The atlas for students with ambition. <span className="serif-italic gold-text">No borders. No commissions.</span>
<div className="flex items-center gap-4 mt-4">
  {/* X (Twitter) */}
  <a href="https://x.com/FindFurther" target="_blank" rel="noopener noreferrer" className="text-heading/60 hover:text-[#FF8C00] transition-colors">
    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" /></svg>
  </a>
  {/* Facebook */}
  <a href="https://facebook.com/findfurther" target="_blank" rel="noopener noreferrer" className="text-heading/60 hover:text-[#FF8C00] transition-colors">
    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
  </a>
  {/* LinkedIn */}
  <a href="https://linkedin.com/company/FindFurther" target="_blank" rel="noopener noreferrer" className="text-heading/60 hover:text-[#FF8C00] transition-colors">
    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
  </a>
  {/* Pinterest */}
  <a href="https://www.pinterest.com/findfurther/" target="_blank" rel="noopener noreferrer" className="text-heading/60 hover:text-[#FF8C00] transition-colors">
    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.951-7.252 4.168 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.367 18.633 0 12.017 0z" /></svg>
  </a>
  {/* TikTok */}
  <a href="https://www.tiktok.com/@find_further" target="_blank" rel="noopener noreferrer" className="text-heading/60 hover:text-[#FF8C00] transition-colors">
    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.12-3.44-3.17-3.8-5.46-.4-2.52.47-5.18 2.36-6.87 1.63-1.47 3.93-2.11 6.06-1.74.02 1.45-.02 2.89.02 4.34-1.26-.35-2.65-.21-3.77.5-1.18.75-1.92 2.1-2 3.5-.09 1.34.46 2.73 1.44 3.63 1.11.99 2.79 1.25 4.17.65 1.56-.67 2.53-2.34 2.59-4.07.08-5.83.02-11.66.04-17.5z" /></svg>
  </a>
  {/* YouTube */}
  <a href="https://www.youtube.com/@Find_Further" target="_blank" rel="noopener noreferrer" className="text-heading/60 hover:text-[#FF8C00] transition-colors">
    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
  </a>
  {/* Instagram */}
  <a href="https://www.instagram.com/findfurther/" target="_blank" rel="noopener noreferrer" className="text-heading/60 hover:text-[#FF8C00] transition-colors">
    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" /></svg>
  </a>
</div>
          
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
          <h4 className="mb-4 font-heading text-xs font-bold uppercase tracking-[0.18em] text-heading/50">Global</h4>
          <p className="text-sm leading-relaxed text-heading/70">
            Built for students from any country, applying to any university worldwide.
            <span className="block mt-3 serif-italic gold-text text-base">Free. Forever.</span>
          </p>
        </div>
      </div>

      <div className="relative border-t border-heading/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-6 text-xs text-heading/50 sm:flex-row lg:px-6">
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
      <h4 className="mb-4 font-heading text-xs font-bold uppercase tracking-[0.18em] text-heading/50">{title}</h4>
      <ul className="space-y-2.5 text-sm">
        {links.map((l) => (
          <li key={l.to + l.label}>
            <Link
              to={l.to}
              search={l.search}
              className="text-heading/75 transition-colors duration-300 hover:text-heading story-link"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
