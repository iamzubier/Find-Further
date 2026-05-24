import { Link } from "@tanstack/react-router";
import { Logo } from "@/components/Logo";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border bg-background">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:grid-cols-4">
        <div>
          <Logo />
          <p className="mt-3 text-sm text-muted-foreground">
            Find your path to the world's best universities.
          </p>
        </div>
        <div>
          <h4 className="mb-3 font-heading text-sm font-bold uppercase tracking-wide text-foreground">Explore</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/universities" className="hover:text-primary">Universities</Link></li>
            <li><Link to="/scholarships" className="hover:text-primary">Scholarships</Link></li>
            <li><Link to="/evaluate" className="hover:text-primary">Evaluate my profile</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 font-heading text-sm font-bold uppercase tracking-wide text-foreground">For Students</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/auth" search={{ tab: "signup" }} className="hover:text-primary">Create account</Link></li>
            <li><Link to="/profile" className="hover:text-primary">Build profile</Link></li>
            <li><Link to="/ask-ai" className="hover:text-primary">Ask Aria AI</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 font-heading text-sm font-bold uppercase tracking-wide text-foreground">Global</h4>
          <p className="text-sm text-muted-foreground">
            For students from any country, applying to any university worldwide. Free. No commissions.
          </p>
        </div>
      </div>
      <div className="border-t border-border py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} BeyondBorder
      </div>
    </footer>
  );
}
