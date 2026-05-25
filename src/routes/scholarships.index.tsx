import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search,
  AlertTriangle,
  Heart,
  ArrowRight,
  Clock,
  RotateCcw,
  CalendarClock,
  Sparkles,
  Wallet,
  GraduationCap,
  Briefcase,
  Palette,
} from "lucide-react";
import { daysLeft, scholarshipSlug } from "@/lib/data";
import {
  ENRICHED_SCHOLARSHIPS,
  fundingLabel,
  providerLabel,
  type EnrichedScholarship,
  type ProfileWeight,
} from "@/lib/scholarship-enrich";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LoginNudge } from "./universities.index";

export const Route = createFileRoute("/scholarships/")({
  head: () => ({
    meta: [
      { title: "Scholarships — BeyondBorder" },
      {
        name: "description",
        content:
          "Every international scholarship that matters — filtered by budget, profile, and hidden costs. Active opportunities and next-cycle prep, side by side.",
      },
      { property: "og:title", content: "Scholarships — BeyondBorder" },
      {
        property: "og:description",
        content:
          "Intent-driven filters, dual-stream view of active and prep-mode awards, and full visibility into hidden costs.",
      },
    ],
  }),
  component: ScholarshipsHub,
});

type BudgetKey = "free" | "5k" | "15k" | "any";
const BUDGETS: { key: BudgetKey; label: string; sub: string }[] = [
  { key: "free", label: "100% Free Education", sub: "Fully funded only" },
  { key: "5k", label: "Up to $5k / yr out-of-pocket", sub: "Includes partial bursaries" },
  { key: "15k", label: "Up to $15k / yr out-of-pocket", sub: "Includes tuition waivers" },
  { key: "any", label: "Any budget", sub: "Show everything" },
];

const PROFILES: { key: ProfileWeight | "any"; label: string; icon: any }[] = [
  { key: "any", label: "Any profile", icon: Sparkles },
  { key: "merit", label: "High Academic / Merit", icon: GraduationCap },
  { key: "portfolio", label: "Creative / Portfolio / ECA", icon: Palette },
  { key: "professional", label: "Work Experience", icon: Briefcase },
];

const COUNTRY_REGION: Record<string, string> = {
  USA: "North America", Canada: "North America",
  UK: "Europe", Germany: "Europe", Finland: "Europe", Norway: "Europe", Italy: "Europe",
  Netherlands: "Europe", Sweden: "Europe", Switzerland: "Europe", "EU (multi)": "Europe",
  Japan: "Asia", "South Korea": "Asia", China: "Asia", Singapore: "Asia",
  Australia: "Oceania", "New Zealand": "Oceania",
};
const REGIONS = ["all", "North America", "Europe", "Asia", "Oceania"] as const;

function ScholarshipsHub() {
  const [budget, setBudget] = useState<BudgetKey>("free");
  const [profile, setProfile] = useState<ProfileWeight | "any">("any");
  const [region, setRegion] = useState<(typeof REGIONS)[number]>("all");
  const [noFee, setNoFee] = useState(false);
  const [moiOnly, setMoiOnly] = useState(false);
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    return ENRICHED_SCHOLARSHIPS.filter((s) => {
      if (budget === "free" && s.funding_type !== "fully_funded") return false;
      if (budget === "5k" && s.funding_type === "stipend_only") return false;
      // 15k & any: no restriction beyond default
      if (profile !== "any" && s.academic_profile_weight !== profile) return false;
      if (region !== "all" && COUNTRY_REGION[s.country] !== region) return false;
      if (noFee && s.application_fee_usd > 0) return false;
      if (moiOnly && !s.accepts_moi_waiver) return false;
      if (q) {
        const n = q.toLowerCase();
        if (!s.name.toLowerCase().includes(n) && !s.country.toLowerCase().includes(n) && !s.provider.toLowerCase().includes(n)) {
          return false;
        }
      }
      return true;
    });
  }, [budget, profile, region, noFee, moiOnly, q]);

  const active = useMemo(
    () =>
      filtered
        .filter((s) => s.cycle_status === "active_open" || s.cycle_status === "rolling_admissions")
        .sort((a, b) => +new Date(a.deadline) - +new Date(b.deadline)),
    [filtered],
  );
  const prepMode = useMemo(
    () => filtered.filter((s) => s.cycle_status === "closed_prep_mode"),
    [filtered],
  );

  const closingSoon = active.filter((s) => {
    const d = daysLeft(s.deadline);
    return d >= 0 && d <= 30;
  });

  const reset = () => {
    setBudget("free");
    setProfile("any");
    setRegion("all");
    setNoFee(false);
    setMoiOnly(false);
    setQ("");
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      {/* Page heading */}
      <div className="mb-6">
        <h1 className="font-heading text-4xl font-extrabold text-foreground md:text-5xl">
          Scholarships
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Every international scholarship that matters — filtered by what you can actually pay,
          and split into what's <em>open today</em> vs what to start <em>preparing now</em>.
        </p>
      </div>

      {/* ─── Intent matrix ─── */}
      <section className="rounded-md border border-border bg-white p-5 md:p-6">
        <div className="grid gap-6 md:grid-cols-3">
          {/* Budget switcher */}
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Wallet className="h-4 w-4 text-primary" />
              <h3 className="font-heading text-sm font-bold uppercase tracking-wide text-foreground">
                Your budget
              </h3>
            </div>
            <div className="flex flex-col gap-1.5">
              {BUDGETS.map((b) => (
                <button
                  key={b.key}
                  onClick={() => setBudget(b.key)}
                  className={`rounded border px-3 py-2 text-left text-sm transition ${
                    budget === b.key
                      ? "border-primary bg-primary/5 font-semibold text-foreground"
                      : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  }`}
                >
                  <div className="text-sm">{b.label}</div>
                  <div className="text-[11px] text-muted-foreground">{b.sub}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Profile selector */}
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h3 className="font-heading text-sm font-bold uppercase tracking-wide text-foreground">
                Your profile
              </h3>
            </div>
            <div className="flex flex-col gap-1.5">
              {PROFILES.map((p) => {
                const Icon = p.icon;
                return (
                  <button
                    key={p.key}
                    onClick={() => setProfile(p.key)}
                    className={`flex items-center gap-2 rounded border px-3 py-2 text-left text-sm transition ${
                      profile === p.key
                        ? "border-primary bg-primary/5 font-semibold text-foreground"
                        : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{p.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Hidden wall toggles + region + search */}
          <div className="flex flex-col gap-3">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-primary" />
                <h3 className="font-heading text-sm font-bold uppercase tracking-wide text-foreground">
                  Hidden-wall toggles
                </h3>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="flex cursor-pointer items-start gap-2 rounded border border-border px-3 py-2 text-sm hover:border-primary/40">
                  <input
                    type="checkbox"
                    checked={noFee}
                    onChange={(e) => setNoFee(e.target.checked)}
                    className="mt-0.5 h-4 w-4 accent-primary"
                  />
                  <span>
                    <span className="font-medium text-foreground">Only $0 application fees</span>
                    <span className="block text-[11px] text-muted-foreground">
                      Hide awards that charge to apply
                    </span>
                  </span>
                </label>
                <label className="flex cursor-pointer items-start gap-2 rounded border border-border px-3 py-2 text-sm hover:border-primary/40">
                  <input
                    type="checkbox"
                    checked={moiOnly}
                    onChange={(e) => setMoiOnly(e.target.checked)}
                    className="mt-0.5 h-4 w-4 accent-primary"
                  />
                  <span>
                    <span className="font-medium text-foreground">Accepts MOI (no IELTS)</span>
                    <span className="block text-[11px] text-muted-foreground">
                      Medium-of-instruction letter in lieu of IELTS/TOEFL
                    </span>
                  </span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value as (typeof REGIONS)[number])}
                className="h-10 rounded border border-border bg-white px-2 text-sm text-foreground"
              >
                {REGIONS.map((r) => (
                  <option key={r} value={r}>
                    {r === "all" ? "All regions" : r}
                  </option>
                ))}
              </select>
              <Button variant="outline" size="sm" onClick={reset} className="h-10">
                <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Reset
              </Button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by name, country, or provider…"
                className="h-10 bg-white pl-9"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Urgency banner */}
      {closingSoon.length > 0 && (
        <div className="mt-6 flex items-start gap-3 rounded-md border border-destructive/30 bg-destructive/5 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
          <div className="min-w-0 flex-1">
            <div className="font-heading text-sm font-bold text-destructive">
              Closing soon: {closingSoon.length} match{closingSoon.length > 1 ? "es" : ""} close within 30 days
            </div>
            <div className="mt-0.5 text-xs text-foreground/80">
              Sorted by deadline — apply to the urgent ones first.
            </div>
          </div>
        </div>
      )}

      {/* ─── Dual stream ─── */}
      <section className="mt-10">
        <SectionHeader
          icon={<Clock className="h-5 w-5 text-primary" />}
          title="The Current Window"
          subtitle="Active and rolling-admission awards, soonest deadline first."
          count={active.length}
        />
        {active.length === 0 ? (
          <EmptyState reset={reset} />
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {active.map((s) => (
              <ScholarshipCard key={s.id} s={s} variant="active" />
            ))}
          </div>
        )}
      </section>

      {prepMode.length > 0 && (
        <section className="mt-14">
          <SectionHeader
            icon={<CalendarClock className="h-5 w-5 text-amber-700" />}
            title="The Next-Cycle Pipeline"
            subtitle="Premium fellowships currently closed. Start preparing now so you're not caught off-guard when portals reopen."
            count={prepMode.length}
            accent="amber"
          />
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {prepMode.map((s) => (
              <ScholarshipCard key={s.id} s={s} variant="prep" />
            ))}
          </div>
        </section>
      )}

      <LoginNudge text="Save your favorites and track every deadline." />
    </div>
  );
}

function SectionHeader({
  icon,
  title,
  subtitle,
  count,
  accent,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  count: number;
  accent?: "amber";
}) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4 border-b border-border pb-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          {icon}
          <h2
            className={`font-heading text-2xl font-bold ${
              accent === "amber" ? "text-amber-900" : "text-foreground"
            }`}
          >
            {title}
          </h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      </div>
      <div className="shrink-0 rounded-full border border-border bg-white px-3 py-1 text-xs font-semibold text-foreground">
        {count}
      </div>
    </div>
  );
}

function EmptyState({ reset }: { reset: () => void }) {
  return (
    <div className="rounded-md border border-dashed border-border bg-white p-12 text-center">
      <p className="font-heading text-lg font-bold text-foreground">
        No scholarships match these exact criteria.
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        Try broadening your budget or region filters.
      </p>
      <Button onClick={reset} className="mt-5 bg-primary text-primary-foreground hover:bg-primary/90">
        <RotateCcw className="mr-2 h-4 w-4" /> Reset filters
      </Button>
    </div>
  );
}

/* ──────────────────── Card ──────────────────── */

function ScholarshipCard({
  s,
  variant,
}: {
  s: EnrichedScholarship;
  variant: "active" | "prep";
}) {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const d = daysLeft(s.deadline);
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
    <article
      className={`group flex h-full flex-col rounded-md border p-5 transition-shadow hover:shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1)] ${
        variant === "prep"
          ? "border-amber-200 bg-[#FBF7EE]"
          : "border-border bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary ring-1 ring-primary/30">
            {fundingLabel(s.funding_type)}
          </span>
          <span className="inline-flex items-center rounded-full bg-neutral-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-foreground/70 ring-1 ring-border">
            {providerLabel(s.provider_type)}
          </span>
        </div>
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
      <div className="mt-1 truncate text-xs text-muted-foreground">{s.provider}</div>

      <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
        <span className="text-xl leading-none">{s.countryFlag}</span>
        <span>{s.country}</span>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 border-y border-border py-4 text-sm">
        <div>
          <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">Headline value</dt>
          <dd className="mt-0.5 font-bold text-foreground">{s.amount || "Varies"}</dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">App fee</dt>
          <dd className="mt-0.5 font-bold text-foreground">
            {s.application_fee_usd > 0 ? `$${s.application_fee_usd}` : "Free"}
          </dd>
        </div>
      </dl>

      {/* Cycle row */}
      {variant === "prep" ? (
        <div className="mt-4 rounded border border-amber-200 bg-amber-50/60 p-3 text-xs">
          <div className="flex items-center gap-1.5 font-bold uppercase tracking-wide text-amber-800">
            <CalendarClock className="h-3 w-3" /> Prep mode
          </div>
          <p className="mt-1 text-amber-900/85">
            {s.prep_hint ?? "Currently closed — start collecting references and a draft SOP."}
          </p>
        </div>
      ) : (
        <div className="mt-4 flex items-center justify-between gap-2">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${countdownCls}`}
          >
            <Clock className="h-3 w-3" />
            {d < 0
              ? "Closed"
              : d === 0
              ? "Closes today"
              : s.cycle_status === "rolling_admissions"
              ? "Rolling"
              : `${d} days left`}
          </span>
          {s.accepts_moi_waiver && (
            <span className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
              MOI ok
            </span>
          )}
        </div>
      )}

      <Button
        asChild
        size="sm"
        className="mt-4 h-9 w-full bg-primary text-primary-foreground hover:bg-primary/90"
      >
        <Link to="/scholarships/$slug" params={{ slug }}>
          View details <ArrowRight className="ml-1 h-3.5 w-3.5" />
        </Link>
      </Button>
    </article>
  );
}

export { ScholarshipCard };
