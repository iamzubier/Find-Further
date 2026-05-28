import { Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Menu, X, Sparkles } from "lucide-react";
import { useState } from "react";
import { Logo } from "@/components/Logo";

export function Navbar({ profileStrength }: { profileStrength?: number }) {
  const { user, loading } = useAuth();
  const [open, setOpen] = useState(false);

  const linkClass = "text-sm text-foreground/80 hover:text-primary transition-colors";

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Logo />


        <nav className="hidden items-center gap-7 md:flex">
          <Link to="/universities" className={linkClass}>Universities</Link>
          <Link to="/scholarships" className={linkClass}>Scholarships</Link>
          <Link to="/compare" className={linkClass}>Compare</Link>

          {user && <Link to="/dashboard" className={linkClass}>Dashboard</Link>}
          {user && <Link to="/ask-ai" className={linkClass}>Ask Aria</Link>}
          {user && <Link to="/shortlist" className={linkClass}>Saved</Link>}
        </nav>


        <div className="hidden items-center gap-4 ml-auto md:flex">
          <Link
            to="/evaluate"
            className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full font-semibold whitespace-nowrap hover:bg-emerald-100 transition-colors"
          >
            ✨ Evaluate My Profile
          </Link>
          {typeof profileStrength === "number" && user && (
            <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs">
              <Sparkles className="h-3 w-3 text-primary" />
              <span className="text-muted-foreground">Profile</span>
              <span className="font-semibold text-foreground">{profileStrength}%</span>
            </div>
          )}
          {loading ? null : user ? (
            <>
              <Button asChild variant="ghost" size="sm"><Link to="/profile">Profile</Link></Button>
              <Button size="sm" variant="outline" onClick={() => supabase.auth.signOut()}>Log out</Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm"><Link to="/auth" search={{ tab: "login" }}>Login</Link></Button>
              <Button asChild size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Link to="/auth" search={{ tab: "signup" }}>Sign up</Link>
              </Button>
            </>
          )}
        </div>

        <button className="md:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border bg-background md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4">
            <Link to="/evaluate" className="rounded-md bg-emerald-500/15 px-2 py-1 text-sm font-semibold text-emerald-700" onClick={() => setOpen(false)}>✨ Evaluate My Profile</Link>
            <Link to="/universities" className={linkClass} onClick={() => setOpen(false)}>Universities</Link>

            <Link to="/scholarships" className={linkClass} onClick={() => setOpen(false)}>Scholarships</Link>
            {user && <Link to="/dashboard" className={linkClass} onClick={() => setOpen(false)}>Dashboard</Link>}
            {user && <Link to="/profile" className={linkClass} onClick={() => setOpen(false)}>Profile</Link>}
            {user && <Link to="/ask-ai" className={linkClass} onClick={() => setOpen(false)}>Ask Aria</Link>}
            {user && <Link to="/shortlist" className={linkClass} onClick={() => setOpen(false)}>Saved</Link>}
            <div className="flex gap-2 pt-2">
              {user ? (
                <Button size="sm" variant="outline" onClick={() => supabase.auth.signOut()}>Log out</Button>
              ) : (
                <>
                  <Button asChild variant="outline" size="sm" className="flex-1"><Link to="/auth" search={{ tab: "login" }}>Login</Link></Button>
                  <Button asChild size="sm" className="flex-1 bg-primary text-primary-foreground"><Link to="/auth" search={{ tab: "signup" }}>Sign up</Link></Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
