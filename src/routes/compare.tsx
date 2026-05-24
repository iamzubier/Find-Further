import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useCompare } from "@/lib/compare-store";
import { UNIVERSITIES } from "@/lib/data";
import { matchUniversity, type MatchResult } from "@/lib/matching";
import { bdToUs } from "@/lib/gpa";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { MatchBadge } from "@/components/MatchBadge";
import { Button } from "@/components/ui/button";
import { X, GitCompare } from "lucide-react";

export const Route = createFileRoute("/compare")({
  head: () => ({ meta: [
    { title: "Compare universities — BeyondBorder" },
    { name: "description", content: "Side-by-side comparison of universities: tuition, deadlines, scholarships, and your match score." },
  ]}),
  component: ComparePage,
});

function ComparePage() {
  const ids = useCompare((s) => s.ids);
  const remove = useCompare((s) => s.remove);
  const clear = useCompare((s) => s.clear);
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [matches, setMatches] = useState<Record<string, MatchResult>>({});

  const unis = ids.map((id) => UNIVERSITIES.find((u) => u.id === id)).filter(Boolean) as typeof UNIVERSITIES;

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle().then(({ data }) => setProfile(data));
  }, [user]);

  useEffect(() => {
    if (!profile) return;
    const m: Record<string, MatchResult> = {};
    unis.forEach((u) => { m[u.id] = matchUniversity(u, profile); });
    setMatches(m);
  }, [profile, ids.join(",")]);

  if (unis.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <GitCompare className="mx-auto h-12 w-12 text-muted-foreground" />
        <h1 className="mt-4 font-heading text-3xl font-extrabold">Nothing to compare yet</h1>
        <p className="mt-2 text-muted-foreground">Add universities to the compare tray from any university page.</p>
        <Button asChild className="mt-6 bg-primary text-primary-foreground"><Link to="/universities">Browse universities</Link></Button>
      </div>
    );
  }

  const rows: { label: string; get: (u: typeof unis[number]) => React.ReactNode }[] = [
    { label: "Country", get: (u) => <span className="text-base">{u.countryFlag} {u.country}</span> },
    { label: "QS rank", get: (u) => <span className="font-semibold">#{u.qsRank}</span> },
    { label: "Programs", get: (u) => <span className="text-xs">{u.programs.join(", ")}</span> },
    { label: "Tuition", get: (u) => <span className="font-semibold">{u.tuition}</span> },
    { label: "Deal tag", get: (u) => <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-semibold text-primary">{u.dealTag}</span> },
    { label: "Deadline", get: (u) => u.deadline },
    { label: "Min GPA", get: (u) => u.minGpa ? `${u.minGpa.toFixed(1)} / 5.0 (≈ US ${bdToUs(u.minGpa).toFixed(1)})` : "—" },
    { label: "Your match", get: (u) => matches[u.id] ? <MatchBadge verdict={matches[u.id].verdict} score={matches[u.id].score} size="sm" /> : <span className="text-xs text-muted-foreground">Log in</span> },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl font-extrabold md:text-4xl">Compare universities</h1>
          <p className="mt-1 text-sm text-muted-foreground">{unis.length} of 3</p>
        </div>
        <Button variant="ghost" size="sm" onClick={clear}>Clear all</Button>
      </div>

      <div className="card-surface mt-6 overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead>
            <tr className="border-b border-border">
              <th className="p-4 text-left text-xs uppercase text-muted-foreground"> </th>
              {unis.map((u) => (
                <th key={u.id} className="p-4 text-left align-top">
                  <div className="flex items-start justify-between gap-2">
                    <Link to="/universities/$uniId" params={{ uniId: u.id }} className="font-heading text-base font-extrabold hover:text-primary">{u.name}</Link>
                    <button onClick={() => remove(u.id)} className="text-muted-foreground hover:text-foreground" aria-label="Remove">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label} className="border-b border-border/50 last:border-0">
                <td className="p-4 text-xs uppercase text-muted-foreground">{r.label}</td>
                {unis.map((u) => <td key={u.id} className="p-4 text-sm align-top">{r.get(u)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-muted-foreground">Tip: open any uni for the full admission hacks, exam prep, and AI study plan.</p>
    </div>
  );
}
