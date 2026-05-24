import { Link } from "@tanstack/react-router";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border bg-background">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2 font-heading text-lg font-extrabold">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-primary" />
            BeyondBorder
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Built for Bangladeshi students who think consultants are overrated.
          </p>
        </div>
        <div>
          <h4 className="mb-3 font-heading text-sm font-bold uppercase tracking-wide text-foreground">Explore</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/universities" className="hover:text-primary">Universities</Link></li>
            <li><Link to="/scholarships" className="hover:text-primary">Scholarships</Link></li>
            <li><Link to="/" className="hover:text-primary">WTF moments</Link></li>
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
          <h4 className="mb-3 font-heading text-sm font-bold uppercase tracking-wide text-foreground">Built in BD</h4>
          <p className="text-sm text-muted-foreground">
            Made with 🇧🇩 for HSC and A-level students. 100% free, no shady commissions.
          </p>
        </div>
      </div>
      <div className="border-t border-border py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} BeyondBorder
      </div>
    </footer>
  );
}
