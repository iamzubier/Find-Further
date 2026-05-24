import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { UNIVERSITIES, SCHOLARSHIPS, daysLeft } from "@/lib/data";
import { gpaConversionLine } from "@/lib/gpa";
import { UniversityCard } from "../universities";
import { ScholarshipCard } from "../scholarships";
import { ArrowRight, Sparkles, TrendingUp, AlertCircle, Target } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — BeyondBorder" }, { name: "robots", content: "noindex" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle().then(({ data }) => setProfile(data));
  }, [user]);

  // Demo score (would normally be derived from profile + AI). Spec says "show 7.2 as example".
  const score = 7.2;
  const strengths = profile?.hsc_gpa && profile.hsc_gpa >= 4.5 ? "High GPA" : "Strong motivation";
  const weaknesses = !profile?.sat ? "No SAT yet" : "Limited ECA";
  const improvement = !profile?.ielts ? "Add IELTS" : "Add a leadership ECA";

  const picks = useMemo(() => UNIVERSITIES.slice(0, 3).map((u, i) => ({ u, match: [92, 86, 78][i] })), []);
  const deadlines = useMemo(() => [...SCHOLARSHIPS].sort((a,b) => +new Date(a.deadline) - +new Date(b.deadline)).slice(0, 3), []);
  const gpaLine = gpaConversionLine(profile?.hsc_gpa);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-heading text-3xl font-extrabold md:text-4xl">Hey {profile?.name || "there"} 👋</h1>
      <p className="mt-1 text-sm text-muted-foreground">Here's your snapshot.</p>

      <div className="mt-8 grid gap-6 md:grid-cols-[1fr_2fr]">
        <ScoreCard score={score} strengths={strengths} weaknesses={weaknesses} improvement={improvement} gpaLine={gpaLine} />
        <div className="card-surface p-6">
          <h2 className="font-heading text-xl font-extrabold">Quick actions</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            <Pill to="/profile">Update my profile</Pill>
            <Pill to="/universities">Browse all universities</Pill>
            <Pill to="/scholarships">See all scholarships</Pill>
            <Pill to="/ask-ai" primary>Ask AI advisor</Pill>
          </div>
        </div>
      </div>

      <section className="mt-10">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="font-heading text-2xl font-extrabold">Best Picks For You</h2>
          <Link to="/universities" className="text-sm text-primary hover:underline">See all</Link>
        </div>
        <div className="grid gap-3">{picks.map(({ u, match }) => <UniversityCard key={u.id} u={u} match={match} />)}</div>
      </section>

      <section className="mt-10">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="font-heading text-2xl font-extrabold">Deadlines Coming Up</h2>
          <Link to="/scholarships" className="text-sm text-primary hover:underline">See all</Link>
        </div>
        <div className="grid gap-3">{deadlines.map((s) => <ScholarshipCard key={s.id} s={s} />)}</div>
      </section>
    </div>
  );
}

function ScoreCard({ score, strengths, weaknesses, improvement, gpaLine }: { score: number; strengths: string; weaknesses: string; improvement: string; gpaLine: string | null }) {
  const pct = (score / 10) * 100;
  const C = 2 * Math.PI * 36;

  return (
    <div className="card-surface p-6">
      <div className="flex items-center gap-5">
        <div className="relative h-24 w-24">
          <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90">
            <circle cx="40" cy="40" r="36" stroke="var(--color-border)" strokeWidth="6" fill="none" />
            <circle cx="40" cy="40" r="36" stroke="var(--color-primary)" strokeWidth="6" fill="none"
              strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C - (pct/100) * C} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="font-heading text-2xl font-extrabold text-foreground">{score.toFixed(1)}</div>
            <div className="text-[10px] uppercase text-muted-foreground">/ 10</div>
          </div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Profile score</div>
          <h3 className="font-heading text-xl font-extrabold">Solid — keep going</h3>
        </div>
      </div>
      {gpaLine && <div className="mt-3 rounded-md bg-secondary/60 px-3 py-2 text-xs text-muted-foreground">{gpaLine}</div>}
      <ul className="mt-5 space-y-2 text-sm">
        <li className="flex items-start gap-2"><TrendingUp className="mt-0.5 h-4 w-4 text-primary" /><span><b>Strong:</b> {strengths}</span></li>
        <li className="flex items-start gap-2"><AlertCircle className="mt-0.5 h-4 w-4 text-warning" /><span><b>Weak:</b> {weaknesses}</span></li>
        <li className="flex items-start gap-2"><Target className="mt-0.5 h-4 w-4 text-primary" /><span><b>Improve:</b> {improvement}</span></li>
      </ul>
      <Button asChild className="mt-5 w-full bg-primary text-primary-foreground hover:bg-primary/90">
        <Link to="/ask-ai"><Sparkles className="mr-2 h-4 w-4" /> Ask AI for tips</Link>
      </Button>
    </div>
  );
}

function Pill({ to, primary, children }: { to: any; primary?: boolean; children: React.ReactNode }) {
  return (
    <Link to={to} className={`rounded-full px-4 py-2 text-sm transition-colors ${
      primary ? "bg-primary text-primary-foreground hover:bg-primary/90" : "border border-border bg-secondary text-foreground hover:border-primary/50"
    }`}>
      {children} {primary && <ArrowRight className="ml-1 inline h-3 w-3" />}
    </Link>
  );
}
