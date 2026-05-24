import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useCompare } from "@/lib/compare-store";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { X, GitCompare, ExternalLink, Trophy } from "lucide-react";

export const Route = createFileRoute("/compare")({
  head: () => ({ meta: [
    { title: "Compare universities — BeyondBorder" },
    { name: "description", content: "Side-by-side comparison of universities: tuition, deadlines, scholarships, and your match." },
  ]}),
  component: ComparePage,
});

const FALLBACK_IMG = "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=800&q=80";

type DetailRow = any;

function ComparePage() {
  const items = useCompare((s) => s.items);
  const remove = useCompare((s) => s.remove);
  const clear = useCompare((s) => s.clear);

  const slugs = items.map((x) => x.slug);
  const detailQ = useQuery({
    queryKey: ["compare-details", slugs.join(",")],
    enabled: slugs.length > 0,
    queryFn: async () => {
      const { data } = await supabase.from("universities_detail").select("*").in("slug", slugs);
      return (data ?? []) as DetailRow[];
    },
  });

  // Build merged uni list — prefer detail row, fallback to tray item
  const unis = items.map((it) => {
    const d = (detailQ.data ?? []).find((r) => r.slug === it.slug);
    return { ...it, ...(d ?? {}) };
  });

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <GitCompare className="mx-auto h-12 w-12 text-muted-foreground" />
        <h1 className="mt-4 font-heading text-3xl font-extrabold">Add at least 2 universities to compare</h1>
        <p className="mt-2 text-muted-foreground">Click "Compare" on any university card.</p>
        <Button asChild className="mt-6 bg-primary text-primary-foreground"><Link to="/universities">Browse Universities</Link></Button>
      </div>
    );
  }

  if (items.length < 2) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="font-heading text-3xl font-extrabold">Add at least 2 universities to compare</h1>
        <p className="mt-2 text-muted-foreground">You have 1 in your compare list. Add at least one more.</p>
        <Button asChild className="mt-6 bg-primary text-primary-foreground"><Link to="/universities">Browse Universities</Link></Button>
      </div>
    );
  }

  // --- comparison rows
  type Row = {
    label: string;
    get: (u: any) => React.ReactNode;
    bestIdx?: number; // computed below
    better?: "min" | "max";
    rawNum?: (u: any) => number | null;
  };

  const rows: Row[] = [
    { label: "QS World Rank", get: (u) => u.qs_rank ?? u.qsRank ?? "—", better: "min", rawNum: (u) => u.qs_rank ?? u.qsRank ?? null },
    { label: "Country", get: (u) => <>{u.country_flag ?? u.countryFlag ?? ""} {u.country}</> },
    { label: "City", get: (u) => u.city ?? "—" },
    { label: "Acceptance rate", get: (u) => u.acceptance_rate ?? "—", better: "min", rawNum: (u) => parseRate(u.acceptance_rate) },
    { label: "Annual tuition", get: (u) => formatTuition(u.tuition) ?? "—", better: "min", rawNum: (u) => extractTuitionNum(u.tuition) },
    { label: "Living cost / mo", get: (u) => u.living_cost_monthly ? `$${u.living_cost_monthly}` : "—", better: "min", rawNum: (u) => u.living_cost_monthly ?? null },
    { label: "IELTS required", get: (u) => u.admission_reqs?.ielts ?? "—" },
    { label: "TOEFL required", get: (u) => u.admission_reqs?.toefl ?? "—" },
    { label: "SAT range", get: (u) => u.admission_reqs?.sat_min ? `${u.admission_reqs.sat_min}${u.admission_reqs.sat_max ? `–${u.admission_reqs.sat_max}` : "+"}` : "—" },
    { label: "Min GPA (US 4.0)", get: (u) => u.admission_reqs?.min_gpa_us ?? "—" },
    { label: "International %", get: (u) => u.international_pct ?? "—" },
    { label: "Scholarships", get: (u) => (u.scholarships?.length ?? 0) > 0
      ? <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-600">Yes</span>
      : <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">—</span>
    },
    { label: "Top programs", get: (u) => {
        const ps = (u.programs_detail ?? []).slice(0, 4).map((p: any) => p.name ?? p).filter(Boolean);
        return ps.length ? <div className="flex flex-wrap gap-1">{ps.map((n: string) => <span key={n} className="rounded bg-secondary px-1.5 py-0.5 text-[11px]">{n}</span>)}</div> : "—";
    }},
    { label: "Next deadline", get: (u) => { const d = u.deadlines?.[0]; if (!d) return "—"; const dl = d.deadline ?? d.date; return `${d.intake ?? d.round ?? ""} · ${dl ?? "TBA"}`.trim().replace(/^·\s*/, ""); } },
    { label: "Official site", get: (u) => u.official_url
      ? <a href={u.official_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">Visit <ExternalLink className="h-3 w-3" /></a>
      : "—" },
    { label: "Apply", get: (u) => u.application_url
      ? <Button asChild size="sm" className="bg-primary text-primary-foreground"><a href={u.application_url} target="_blank" rel="noopener noreferrer">Apply now</a></Button>
      : "—" },
  ];

  // Compute winner per numeric row
  const wins = unis.map(() => 0);
  rows.forEach((r) => {
    if (!r.better || !r.rawNum) return;
    const nums = unis.map((u) => r.rawNum!(u));
    const valid = nums.map((n, i) => ({ n, i })).filter((x) => x.n !== null && !isNaN(x.n as number));
    if (valid.length < 2) return;
    valid.sort((a, b) => r.better === "min" ? (a.n! - b.n!) : (b.n! - a.n!));
    r.bestIdx = valid[0].i;
    wins[valid[0].i] += 1;
  });
  const overallWinner = wins.indexOf(Math.max(...wins));

  return (
    <div className="mx-auto max-w-6xl px-4 pb-32 pt-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl font-extrabold md:text-4xl">Compare universities</h1>
          <p className="mt-1 text-sm text-muted-foreground">{items.length} selected</p>
        </div>
        <Button variant="ghost" size="sm" onClick={clear}>Clear all</Button>
      </div>

      <div className="card-surface mt-6 overflow-x-auto">
        <table className="w-full min-w-[720px]">
          <thead>
            <tr className="border-b border-border">
              <th className="w-44 p-0"></th>
              {unis.map((u, idx) => (
                <th key={u.slug} className="p-0 align-top">
                  <div
                    className="relative h-32 w-full bg-cover bg-center"
                    style={{ backgroundImage: `url('${u.campus_image_url || u.imageUrl || FALLBACK_IMG}')` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 to-black/30" />
                    {idx === overallWinner && wins[idx] > 0 && (
                      <div className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white">
                        <Trophy className="h-3 w-3" /> Best Match
                      </div>
                    )}
                    <button
                      onClick={() => remove(u.slug)}
                      className="absolute right-2 top-2 rounded bg-black/40 p-1 text-white hover:bg-black/60"
                      aria-label="Remove"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                    <div className="absolute inset-x-0 bottom-0 p-3 text-left text-white">
                      <div className="flex items-center gap-2">
                        {u.logo_url && (
                          <div className="flex h-8 w-8 items-center justify-center rounded bg-white p-1">
                            <img src={u.logo_url} alt="" className="max-h-full max-w-full" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                          </div>
                        )}
                        <Link
                          to="/universities/$slug"
                          params={{ slug: u.slug }}
                          className="font-heading text-sm font-extrabold leading-tight hover:underline"
                        >
                          {u.name}
                        </Link>
                      </div>
                      <div className="mt-1 text-[11px] text-white/80">{u.country_flag ?? u.countryFlag} {u.country}</div>
                    </div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {detailQ.isLoading ? (
              <tr><td colSpan={unis.length + 1} className="p-10 text-center text-sm text-muted-foreground">Loading comparison…</td></tr>
            ) : rows.map((r) => (
              <tr key={r.label} className="border-b border-border/50 last:border-0">
                <td className="p-3 text-xs uppercase tracking-wide text-muted-foreground">{r.label}</td>
                {unis.map((u, idx) => (
                  <td
                    key={u.slug}
                    className={`p-3 align-top text-sm ${r.bestIdx === idx ? "bg-emerald-500/10 font-semibold text-emerald-700 dark:text-emerald-400" : ""}`}
                  >
                    {r.get(u)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button asChild size="lg" className="bg-primary text-primary-foreground">
          <Link to="/evaluate">Match these to my profile</Link>
        </Button>
      </div>
    </div>
  );
}

function parseRate(s?: string): number | null {
  if (!s) return null;
  const m = s.match(/(\d+(?:\.\d+)?)/);
  return m ? parseFloat(m[1]) : null;
}
function extractTuitionNum(t: any): number | null {
  if (!t) return null;
  const candidates = [t.intl, t.international, t.usd, t.amount, t.yearly];
  for (const c of candidates) {
    if (typeof c === "number") return c;
    if (typeof c === "string") {
      const m = c.replace(/,/g, "").match(/(\d+(?:\.\d+)?)/);
      if (m) return parseFloat(m[1]);
    }
  }
  return null;
}
function formatTuition(t: any): string | null {
  if (!t) return null;
  if (typeof t === "string") return t;
  if (t.intl) return typeof t.intl === "number" ? `$${t.intl.toLocaleString()}` : t.intl;
  if (t.international) return t.international;
  if (t.usd) return `$${t.usd.toLocaleString?.() ?? t.usd}`;
  if (t.yearly) return t.yearly;
  return null;
}
