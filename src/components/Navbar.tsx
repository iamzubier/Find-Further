import { Link, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Menu, X, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { Logo } from "@/components/Logo";

export function Navbar({ profileStrength }: { profileStrength?: number }) {
  const { user, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { location } = useRouterState();
  const pathname = location.pathname;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { to: "/universities", label: "Universities" },
    { to: "/scholarships", label: "Scholarships" },
    { to: "/compare", label: "Compare" },
  ] as const;

  const authedLinks = user
    ? [
        { to: "/dashboard", label: "Dashboard" },
        { to: "/ask-ai", label: "Ask Aria" },
        { to: "/shortlist", label: "Saved" },
      ]
    : [];

  const NavLink = ({ to, label }: { to: string; label: string }) => {
    const active = pathname === to || pathname.startsWith(to + "/");
    return (
      <Link
        to={to}
        className={`relative text-[13px] font-medium tracking-wide transition-colors ${
          active ? "text-foreground" : "text-foreground/65 hover:text-foreground"
        }`}
      >
        {label}
        <span
          aria-hidden
          className={`absolute -bottom-1.5 left-0 h-[1.5px] w-full origin-left transition-transform duration-500 ${
            active ? "scale-x-100" : "scale-x-0"
          }`}
          style={{ background: "var(--gradient-gold)" }}
        />
      </Link>
    );
  };

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-500 ${
        scrolled
          ? "border-b border-border bg-[#FAF3E8]/95 backdrop-blur-xl shadow-[0_1px_0_rgba(101,31,43,.16)]"
          : "border-b border-transparent bg-[#FAF3E8]/90 backdrop-blur-md"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:grid md:grid-cols-[1fr_auto_1fr] md:gap-6 lg:px-6">
        <Logo />

        <nav className="hidden items-center justify-self-center gap-8 md:flex">
          {links.map((l) => <NavLink key={l.to} {...l} />)}
          {authedLinks.map((l) => <NavLink key={l.to} {...l} />)}
        </nav>

        <div className="hidden items-center justify-self-end gap-3 md:flex">
          {typeof profileStrength === "number" && user && (
            <div
              className="flex items-center gap-2 rounded-full border px-3 py-1 text-[11px]"
              style={{
                borderColor: "oklch(0.74 0.10 85 / 0.45)",
                background: "linear-gradient(135deg, oklch(0.74 0.10 85 / 0.08), transparent)",
              }}
            >
              <Sparkles className="h-3 w-3 text-gold" />
              <span className="text-muted-foreground uppercase tracking-wider">Profile</span>
              <span className="font-semibold text-foreground">{profileStrength}%</span>
            </div>
          )}
          {loading ? null : user ? (
            <>
              <Button asChild variant="ghost" size="sm" className="text-[13px] font-medium">
                <Link to="/profile">Profile</Link>
              </Button>
              <Button size="sm" variant="outline" onClick={() => supabase.auth.signOut()} className="text-[13px] font-medium">
                Log out
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="text-[13px] font-medium">
                <Link to="/auth" search={{ tab: "login" }}>Login</Link>
              </Button>
              <Button
                asChild
                size="sm"
                className="gold-sheen text-[13px] font-semibold text-primary-foreground shadow-[0_4px_14px_-4px_rgba(0,60,40,0.45)] transition-all hover:shadow-[0_6px_20px_-4px_rgba(0,60,40,0.55)]"
                style={{ background: "var(--gradient-emerald)" }}
              >
                <Link to="/auth" search={{ tab: "signup" }}>Sign up</Link>
              </Button>
            </>
          )}
        </div>

        <button className="md:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* hairline gold accent under the bar */}
      <div className="hairline-gold pointer-events-none" />

      {open && (
        <div className="border-t border-border bg-background md:hidden animate-fade-in">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4">
            {[...links, ...authedLinks].map((l) => (
              <Link key={l.to} to={l.to} className="text-sm text-foreground/80 hover:text-primary" onClick={() => setOpen(false)}>
                {l.label}
              </Link>
            ))}
            <div className="flex gap-2 pt-2">
              {user ? (
                <Button size="sm" variant="outline" onClick={() => supabase.auth.signOut()}>Log out</Button>
              ) : (
                <>
                  <Button asChild variant="outline" size="sm" className="flex-1"><Link to="/auth" search={{ tab: "login" }}>Login</Link></Button>
                  <Button asChild size="sm" className="flex-1 text-primary-foreground" style={{ background: "var(--gradient-emerald)" }}>
                    <Link to="/auth" search={{ tab: "signup" }}>Sign up</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
