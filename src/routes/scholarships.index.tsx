import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, AlertTriangle, Heart, ArrowRight, Clock, RotateCcw } from "lucide-react";
import { SCHOLARSHIPS, daysLeft, scholarshipSlug, type Scholarship } from "@/lib/data";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LoginNudge } from "./universities.index";

export const Route = createFileRoute("/scholarships/")({
  head: () => ({
    meta: [
      { title: "Scholarships — BeyondBorder" },
      { name: "description", content: "Live international scholarships sorted by deadline. Filter by funding scope, region, and degree level." },
    ],
  }),
  component: ScholarshipsHub,
});

const TIERS = [
  { value: "undergraduate", label: "Undergraduate (Bachelor's)" },
  { value: "postgraduate", label: "Postgraduate (Master's / PhD)" },
  { value: "all", label: "All Tiers" },
] as const;

type Tier = (typeof TIERS)[number]["value"];

const FUNDING_SCOPES = [
  { value: "all", label: "All funding" },
  { value: "Full", label: "Fully Funded" },
  { value: "Partial", label: "Tuition Only" },
  { value: "Stipend", label: "Living Stipend Only" },
] as const;

const COUNTRY_REGION: Record<string, "North America" | "Europe" | "Asia" | "Oceania"> = {
  USA: "North America",
  Canada: "North America",
  UK: "Europe",
  Germany: "Europe",
  Finland: "Europe",
  Norway: "Europe",
  Italy: "Europe",
  Netherlands: "Europe",
  Sweden: "Europe",
  Switzerland: "Europe",
  "EU (multi)": "Europe",
  Japan: "Asia",
  "South Korea": "Asia",
  China: "Asia",
  Singapore: "Asia",
  Australia: "Oceania",
  "New Zealand": "Oceania",
};

const REGIONS = ["all", "North America", "Europe", "Asia", "Oceania"] as const;

function tierMatch(tier: Tier, level: Scholarship["level"]): boolean {
  if (tier === "all") return true;
  if (tier === "undergraduate") return level === "undergraduate" || level === "all";
  // postgraduate
  return level === "postgraduate" || level === "phd" || level === "all";
}

function ScholarshipsHub() {
  const [tier, setTier] = useState<Tier>("undergraduate");
  const [scope, setScope] = useState<string>("all");
  const [region, setRegion] = useState<(typeof REGIONS)[number]>("all");
  const [q, setQ] = useState("");

  const sorted = useMemo(
    () => [...SCHOLARSHIPS].sort((a, b) => +new Date(a.deadline) - +new Date(b.deadline)),
    [],
  );

  const filtered = useMemo(() => {
    return sorted.filter((s) => {
      if (!tierMatch(tier, s.level)) return false;
      if (scope !== "all" && s.type !== scope) return false;
      if (region !== "all" && COUNTRY_REGION[s.country] !== region) return false;
      if (q) {
        const needle = q.toLowerCase();
        if (!s.name.toLowerCase().includes(needle) && !s.country.toLowerCase().includes(needle)) return false;
      }
      return true;
    });
  }, [sorted, tier, scope, region, q]);

  const closingSoon = filtered.filter((s) => {
    const d = daysLeft(s.deadline);
    return d >= 0 && d <= 30;
  });

  const reset = () => {
    setTier("undergraduate");
    setScope("all");
    setRegion("all");
    setQ("");
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      {/* Page heading */}
      <div className="mb-6">
        <h1 className="font-heading text-4xl font-extrabold text-foreground md:text-5xl">Scholarships</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          {SCHOLARSHIPS.length}+ verified international scholarships sorted by deadline. Filter by funding scope and region.
        </p>
      </div>

      {/* Segmented tier control */}
      <div className="inline-flex flex-wrap rounded-md border border-border bg-white p-1 shadow-sm">
        {TIERS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTier(t.value)}
            className={`rounded px-4 py-2 text-sm font-semibold transition ${
              tier === t.value
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Urgency banner */}
      {closingSoon.length > 0 && (
        <div className="mt-6 flex items-start gap-3 rounded-md border border-destructive/30 bg-destructive/5 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
          <div className="min-w-0 flex-1">
            <div className="font-heading text-sm font-bold text-destructive">
              Closing Soon: {closingSoon.length} high-value scholarship{closingSoon.length > 1 ? "s" : ""} close within 30 days
            </div>
            <div className="mt-0.5 text-xs text-foreground/80">
              Sorted by deadline — apply to the urgent ones first.
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-[260px_1fr]">
        {/* ─── Sidebar filters ─── */}
        <aside className="space-y-6 lg:sticky lg:top-20 lg:self-start">
          <div className="rounded-md border border-border bg-white p-5">
            <h3 className="mb-3 font-heading text-sm font-bold uppercase tracking-wide text-foreground">Search</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Name or country…"
                className="h-10 bg-white pl-9"
              />
            </div>
          </div>

          <div className="rounded-md border border-border bg-white p-5">
            <h3 className="mb-3 font-heading text-sm font-bold uppercase tracking-wide text-foreground">Funding Scope</h3>
            <div className="space-y-2">
              {FUNDING_SCOPES.map((f) => (
                <label key={f.value} className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="scope"
                    value={f.value}
                    checked={scope === f.value}
                    onChange={() => setScope(f.value)}
                    className="h-4 w-4 accent-primary"
                  />
                  <span className={scope === f.value ? "font-semibold text-foreground" : "text-muted-foreground"}>
                    {f.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="rounded-md border border-border bg-white p-5">
            <h3 className="mb-3 font-heading text-sm font-bold uppercase tracking-wide text-foreground">Host Region</h3>
            <div className="space-y-2">
              {REGIONS.map((r) => (
                <label key={r} className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="region"
                    value={r}
                    checked={region === r}
                    onChange={() => setRegion(r)}
                    className="h-4 w-4 accent-primary"
                  />
                  <span className={region === r ? "font-semibold text-foreground" : "text-muted-foreground"}>
                    {r === "all" ? "All regions" : r}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <Button variant="outline" size="sm" onClick={reset} className="w-full">
            <RotateCcw className="mr-2 h-3.5 w-3.5" /> Reset filters
          </Button>
        </aside>

        {/* ─── Results grid ─── */}
        <main className="min-w-0">
          <div className="mb-4 flex items-baseline justify-between border-b border-border pb-2">
            <h2 className="font-heading text-2xl font-bold text-foreground">
              {filtered.length} scholarship{filtered.length === 1 ? "" : "s"}
            </h2>
            <span className="text-xs uppercase tracking-wide text-muted-foreground">Sorted by deadline</span>
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-md border border-dashed border-border bg-white p-12 text-center">
              <p className="font-heading text-lg font-bold text-foreground">No scholarships match these exact criteria.</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Try broadening your budget or region filters.
              </p>
              <Button onClick={reset} className="mt-5 bg-primary text-primary-foreground hover:bg-primary/90">
                <RotateCcw className="mr-2 h-4 w-4" /> Reset filters
              </Button>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((s) => (
                <ScholarshipCardV2 key={s.id} s={s} />
              ))}
            </div>
          )}

          <LoginNudge text="Save your favorites and track every deadline." />
        </main>
      </div>
    </div>
  );
}

function levelPill(level: Scholarship["level"]): { label: string; cls: string } {
  if (level === "undergraduate")
    return { label: "Bachelor's Only", cls: "bg-emerald-500/15 text-emerald-700 ring-emerald-500/40" };
  if (level === "postgraduate" || level === "phd")
    return { label: "Master's / PhD", cls: "bg-blue-500/15 text-blue-700 ring-blue-500/40" };
  return { label: "All Levels", cls: "bg-amber-500/15 text-amber-700 ring-amber-500/40" };
}

function ScholarshipCardV2({ s }: { s: Scholarship }) {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const d = daysLeft(s.deadline);
  const pill = levelPill(s.level);
  const slug = scholarshipSlug(s);

  const countdownCls =
    d < 0
      ? "bg-neutral-100 text-muted-foreground ring-border"
      : d <= 10
      ? "bg-destructive/10 text-destructive ring-destructive/40"
      : d <= 30
      ? "bg-amber-500/10 text-amber-700 ring-amber-500/40"
      : "bg-emerald-500/10 text-emerald-700 ring-emerald-500/40";

  const save = async () => {
    if (!user) {
      toast.error("Log in to save scholarships");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("shortlist").insert({
      user_id: user.id,
      item_type: "scholarship",
      item_id: s.id,
      item_name: s.name,
      item_data: s as any,
    });
    setSaving(false);
    if (error) toast.error(error.code === "23505" ? "Already saved" : error.message);
    else toast.success(`Saved ${s.name}`);
  };

  return (
    <article className="group flex h-full flex-col rounded-md border border-border bg-white p-5 transition-shadow hover:shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1)]">
      <div className="flex items-start justify-between gap-3">
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ${pill.cls}`}>
          {pill.label}
        </span>
        <button
          onClick={save}
          disabled={saving}
          aria-label="Save to shortlist"
          className="rounded-md p-1.5 text-muted-foreground ring-1 ring-border transition hover:text-destructive hover:ring-destructive/40"
        >
          <Heart className="h-4 w-4" />
        </button>
      </div>

      <h3 className="mt-3 font-heading text-lg font-bold leading-snug text-foreground line-clamp-2">
        {s.name}
      </h3>

      <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
        <span className="text-xl leading-none">{s.countryFlag}</span>
        <span>{s.country}</span>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 border-y border-border py-4 text-sm">
        <div>
          <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">Annual Value</dt>
          <dd className="mt-0.5 font-bold text-foreground">{s.amount || "Varies"}</dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">Award Seats</dt>
          <dd className="mt-0.5 font-bold text-foreground">Varies Annually</dd>
        </div>
      </dl>

      <div className="mt-4 flex items-center justify-between gap-2">
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${countdownCls}`}>
          <Clock className="h-3 w-3" />
          {d < 0 ? "Closed" : d === 0 ? "Closes today" : `${d} days left`}
        </span>
        <Button asChild size="sm" className="h-8 bg-primary text-primary-foreground hover:bg-primary/90">
          <Link to="/scholarships/$slug" params={{ slug }}>
            View Details <ArrowRight className="ml-1 h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>
    </article>
  );
}

export { ScholarshipCardV2 as ScholarshipCard };
