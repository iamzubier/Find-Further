import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, AlertTriangle, ChevronDown, Heart, ExternalLink } from "lucide-react";
import { SCHOLARSHIPS, daysLeft, type Scholarship } from "@/lib/data";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LoginNudge } from "./universities.index";

export const Route = createFileRoute("/scholarships/")({
  head: () => ({ meta: [
    { title: "Scholarships — BeyondBorder" },
    { name: "description", content: "Live international scholarships sorted by deadline. For students worldwide." },
  ]}),
  component: ScholarshipsPage,
});

const LEVELS = [
  { value: "undergraduate", label: "Undergraduate" },
  { value: "postgraduate", label: "Master's" },
  { value: "phd", label: "PhD" },
  { value: "all", label: "All levels" },
] as const;

function ScholarshipsPage() {
  const [q, setQ] = useState("");
  const [country, setCountry] = useState<string>("all");
  const [type, setType] = useState<string>("all");
  const [level, setLevel] = useState<string>("undergraduate");

  const sorted = useMemo(() => {
    return [...SCHOLARSHIPS].sort((a, b) => +new Date(a.deadline) - +new Date(b.deadline));
  }, []);

  const filtered = useMemo(() => {
    return sorted.filter((s) => {
      if (level !== "any" && s.level !== level && s.level !== "all") return false;
      if (country !== "all" && s.country !== country) return false;
      if (type !== "all" && s.type !== type) return false;
      if (q && !s.name.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [sorted, country, type, q, level]);

  const closingSoon = filtered.filter((s) => daysLeft(s.deadline) <= 30 && daysLeft(s.deadline) >= 0);
  const countries = Array.from(new Set(SCHOLARSHIPS.map((s) => s.country)));

  return (
    <div className="relative -mt-px overflow-hidden">
      {/* Soft lavender/cream gradient backdrop */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[680px]"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 0%, oklch(0.94 0.06 285) 0%, oklch(0.97 0.025 285) 45%, transparent 75%)",
        }}
      />

      {/* ───── Hero ───── */}
      <section className="mx-auto max-w-5xl px-4 pt-16 pb-10 text-center md:pt-24 md:pb-14">
        <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary ring-1 ring-primary/20">
          No counselor needed — 100% free
        </span>

        <h1 className="mx-auto mt-7 max-w-4xl font-heading text-[44px] font-black leading-[0.95] tracking-[-0.03em] text-foreground sm:text-6xl md:text-7xl lg:text-[88px]">
          Find{" "}
          <span
            className="bg-clip-text text-transparent"
            style={{
              backgroundImage:
                "linear-gradient(135deg, oklch(0.55 0.24 285) 0%, oklch(0.68 0.22 305) 100%)",
            }}
          >
            Fully Funded
          </span>{" "}
          Scholarships.
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground md:text-lg">
          {SCHOLARSHIPS.length}+ verified scholarships, deadline tracking, eligibility filters —
          everything to win a scholarship without paying a counselor.
        </p>

        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <a
            href="#browse"
            className="inline-flex h-12 items-center rounded-full bg-foreground px-7 text-sm font-semibold text-background shadow-lg shadow-foreground/10 transition hover:scale-[1.02]"
          >
            Browse Scholarships
          </a>
          <a
            href="/universities"
            className="inline-flex h-12 items-center rounded-full bg-background px-7 text-sm font-semibold text-foreground ring-1 ring-border transition hover:bg-secondary"
          >
            Explore Universities
          </a>
        </div>

        {/* tiny trust row */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> {filtered.length} live now</span>
          <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> {closingSoon.length} closing in 30 days</span>
          <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-primary" /> Updated daily</span>
        </div>
      </section>

      {/* ───── Browse panel ───── */}
      <section id="browse" className="mx-auto max-w-6xl px-4 pb-16">
        <div className="mb-8 flex items-end justify-between gap-4">
          <h2 className="font-heading text-3xl font-black tracking-tight md:text-5xl">
            Everything live.{" "}
            <span className="text-muted-foreground/60">Zero cost.</span>
          </h2>
        </div>

        {/* Degree level — primary filter */}
        <div className="inline-flex flex-wrap rounded-full border border-border bg-card p-1 text-sm shadow-sm">
          {LEVELS.map((l) => (
            <button
              key={l.value}
              onClick={() => setLevel(l.value)}
              className={`rounded-full px-4 py-1.5 transition ${
                level === l.value
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {l.label}
            </button>
          ))}
          <button
            onClick={() => setLevel("any")}
            className={`rounded-full px-4 py-1.5 transition ${
              level === "any"
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Any
          </button>
        </div>

        {closingSoon.length > 0 && (
          <div className="mt-6 flex items-start gap-3 rounded-3xl border border-destructive/30 bg-destructive/5 p-5">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-destructive" />
            <div>
              <div className="font-heading font-bold text-destructive">
                {closingSoon.length} scholarship{closingSoon.length > 1 ? "s" : ""} closing within 30 days
              </div>
              <div className="text-sm text-foreground/80">Don't sleep on these. Expand each card for details.</div>
            </div>
          </div>
        )}

        <div className="mt-6 grid gap-2 rounded-3xl border border-border bg-card p-3 shadow-sm md:grid-cols-[1fr_200px_180px]">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search scholarships…"
              className="h-12 rounded-full border-0 bg-secondary pl-10"
            />
          </div>
          <Select value={country} onValueChange={setCountry}>
            <SelectTrigger className="h-12 rounded-full border-0 bg-secondary"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All countries</SelectItem>
              {countries.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="h-12 rounded-full border-0 bg-secondary"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="Full">Full</SelectItem>
              <SelectItem value="Partial">Partial</SelectItem>
              <SelectItem value="Stipend">Stipend</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {filtered.length === 0 ? (
          <div className="mt-6 rounded-3xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
            No scholarships match those filters. Try switching to <b>Any</b> level.
          </div>
        ) : (
          <div className="mt-6 grid gap-3">
            {filtered.map((s) => <ScholarshipCard key={s.id} s={s} />)}
          </div>
        )}

        <LoginNudge text="Which of these are you actually eligible for?" />
      </section>
    </div>
  );
}

const LEVEL_BADGE: Record<string, { label: string; cls: string }> = {
  undergraduate: { label: "Bachelor's", cls: "bg-emerald-500/15 text-emerald-700 ring-emerald-500/30 dark:text-emerald-300" },
  postgraduate:  { label: "Master's",   cls: "bg-blue-500/15 text-blue-700 ring-blue-500/30 dark:text-blue-300" },
  phd:           { label: "PhD",        cls: "bg-purple-500/15 text-purple-700 ring-purple-500/30 dark:text-purple-300" },
  all:           { label: "All levels", cls: "bg-amber-500/15 text-amber-700 ring-amber-500/30 dark:text-amber-300" },
};

export function ScholarshipCard({ s }: { s: Scholarship }) {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const d = daysLeft(s.deadline);
  const badgeColor =
    d < 0 ? "bg-muted text-muted-foreground" :
    d <= 10 ? "bg-destructive/20 text-destructive ring-1 ring-destructive/40" :
    d <= 30 ? "bg-warning/20 text-warning ring-1 ring-warning/40" :
    "bg-secondary text-muted-foreground";
  const lvl = LEVEL_BADGE[s.level] ?? LEVEL_BADGE.all;

  const save = async () => {
    if (!user) { toast.error("Log in to save scholarships"); return; }
    const { error } = await supabase.from("shortlist").insert({
      user_id: user.id, item_type: "scholarship", item_id: s.id, item_name: s.name, item_data: s as any,
    });
    if (error) toast.error(error.code === "23505" ? "Already saved" : error.message);
    else toast.success(`Saved ${s.name}`);
  };

  return (
    <div className="card-surface overflow-hidden">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between p-5 text-left md:p-6">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{s.countryFlag}</span>
          <div>
            <h3 className="font-heading text-lg font-extrabold">{s.name}</h3>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${lvl.cls}`}>{lvl.label}</span>
              <span>{s.country}</span><span>·</span>
              <span className="rounded-full bg-secondary px-2 py-0.5">{s.type}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeColor}`}>
            {d < 0 ? "Closed" : `${d} days left`}
          </span>
          <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
        </div>
      </button>

      {open && (
        <div className="border-t border-border bg-background/30 p-5 md:p-6 animate-in fade-in slide-in-from-top-1">
          <p className="text-sm text-foreground/85">{s.description}</p>
          <div className="mt-4 grid gap-3 text-sm md:grid-cols-4">
            <Stat label="Amount" value={s.amount} />
            <Stat label="Level" value={lvl.label} />
            <Stat label="Type" value={s.type} />
            <Stat label="Deadline" value={new Date(s.deadline).toLocaleDateString()} />
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              Apply now <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={save}><Heart className="mr-2 h-4 w-4" /> Save</Button>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-0.5 font-semibold text-foreground">{value}</div>
    </div>
  );
}
