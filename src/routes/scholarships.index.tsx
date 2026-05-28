import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { gradientForName } from "@/components/SmartCampusImage";
import { TopoBackground } from "@/components/TopoBackground";
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

  // Slug → banner_image_url map (fetched from DB scholarships table).
  const bannerQuery = useQuery({
    queryKey: ["scholarship-banners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("scholarships")
        .select("slug, banner_image_url")
        .not("banner_image_url", "is", null);
      if (error) throw error;
      const map = new Map<string, string>();
      for (const r of data ?? []) {
        if ((r as any).slug && (r as any).banner_image_url) {
          map.set((r as any).slug, (r as any).banner_image_url);
        }
      }
      return map;
    },
    staleTime: 5 * 60 * 1000,
  });
  const bannerMap = bannerQuery.data ?? new Map<string, string>();

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

      {/* ─── WTF Scholarships carousel ─── */}
      <WtfScholarshipsCarousel />



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
              <ScholarshipCard key={s.id} s={s} variant="active" bannerUrl={bannerMap.get(scholarshipSlug(s)) ?? null} />
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
              <ScholarshipCard key={s.id} s={s} variant="prep" bannerUrl={bannerMap.get(scholarshipSlug(s)) ?? null} />
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

function levelBadge(level: EnrichedScholarship["level"]): string {
  switch (level) {
    case "undergraduate": return "Bachelor's";
    case "postgraduate": return "Master's";
    case "phd": return "PhD";
    case "all": return "All Levels";
    default: return String(level ?? "").toUpperCase();
  }
}

function ScholarshipCard({
  s,
  variant,
  bannerUrl,
}: {
  s: EnrichedScholarship;
  variant: "active" | "prep";
  bannerUrl?: string | null;
}) {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const d = daysLeft(s.deadline);
  const slug = scholarshipSlug(s);

  const countdownCls =
    d < 0
      ? "bg-white/15 text-white/80 ring-white/20"
      : d <= 10
      ? "bg-red-500/90 text-white ring-red-300/60"
      : d <= 30
      ? "bg-amber-500/90 text-white ring-amber-200/60"
      : "bg-emerald-500/90 text-white ring-emerald-200/60";

  const save = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
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

  // Background: deterministic country hero image (lightning fast, no AI fetch).
  const bgUrl = getCountryImage(s.country);

  return (
    <Link
      to="/scholarships/$slug"
      params={{ slug }}
      className="group relative block h-[360px] overflow-hidden rounded-lg ring-1 ring-border shadow-sm transition-shadow hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-500 ease-out group-hover:scale-105"
        style={{ backgroundImage: `url(${bgUrl})` }}
        aria-hidden
      />
      {/* Dark gradient overlay for legibility */}
      <div
        className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/80 to-transparent"
        aria-hidden
      />

      {/* Top-right level badge */}
      <div className="absolute right-3 top-3 z-10 flex items-center gap-1.5">
        <span className="rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white ring-1 ring-white/30 backdrop-blur">
          {levelBadge(s.level)}
        </span>
        <button
          onClick={save}
          disabled={saving}
          aria-label="Save to shortlist"
          className="rounded-full bg-white/10 p-1.5 text-white ring-1 ring-white/30 backdrop-blur transition hover:bg-white/20 hover:text-red-300"
        >
          <Heart className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Top-left chips */}
      <div className="absolute left-3 top-3 z-10 flex flex-wrap items-center gap-1.5">
        <span className="rounded-full bg-primary/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-primary-foreground ring-1 ring-white/20 backdrop-blur">
          {fundingLabel(s.funding_type)}
        </span>
        {variant === "prep" && (
          <span className="rounded-full bg-amber-500/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white ring-1 ring-white/20 backdrop-blur">
            Prep mode
          </span>
        )}
      </div>

      {/* Bottom content */}
      <div className="relative z-10 flex h-full flex-col justify-end p-5 !text-white">
        <div className="flex items-center gap-2 text-sm !text-white">
          <span className="text-xl leading-none">{s.countryFlag}</span>
          <span className="font-medium">{s.country}</span>
          <span aria-hidden className="!text-white/60">·</span>
          <span className="text-xs !text-white/80">{providerLabel(s.provider_type)}</span>
        </div>

        <h3 className="mt-2 font-heading text-xl font-extrabold leading-tight !text-white line-clamp-2 drop-shadow-lg">
          {s.name}
        </h3>
        <div className="mt-1 truncate text-xs !text-white/80">{s.provider}</div>

        <div className="mt-4 flex items-center justify-between gap-2 border-t border-white/15 pt-3">
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-wide text-white/55">Value</div>
            <div className="truncate text-sm font-bold text-white">{s.amount || "Varies"}</div>
          </div>
          {variant === "prep" ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white ring-1 ring-white/20">
              <CalendarClock className="h-3 w-3" /> Opens later
            </span>
          ) : (
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ring-1 ${countdownCls}`}>
              <Clock className="h-3 w-3" />
              {d < 0
                ? "Closed"
                : d === 0
                ? "Today"
                : s.cycle_status === "rolling_admissions"
                ? "Rolling"
                : `${d}d left`}
            </span>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between text-[11px] text-white/70">
          <span>{s.application_fee_usd > 0 ? `$${s.application_fee_usd} fee` : "Free to apply"}</span>
          {s.accepts_moi_waiver && (
            <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 font-semibold text-emerald-200 ring-1 ring-emerald-300/40">
              MOI ok
            </span>
          )}
          <span className="inline-flex items-center gap-1 font-semibold text-white group-hover:underline">
            View <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}

/* ─────────────────── WTF Scholarships Carousel ─────────────────── */

function WtfScholarshipsCarousel() {
  const wtf = useMemo(() => {
    return [
      {
        title: "$0 application fee",
        items: ENRICHED_SCHOLARSHIPS.filter((s) => s.application_fee_usd === 0 && s.funding_type === "fully_funded").slice(0, 6),
        emoji: "💸",
        tone: "from-emerald-50 to-white border-emerald-200",
      },
      {
        title: "MOI accepted (skip IELTS)",
        items: ENRICHED_SCHOLARSHIPS.filter((s) => s.accepts_moi_waiver && s.funding_type === "fully_funded").slice(0, 6),
        emoji: "📝",
        tone: "from-sky-50 to-white border-sky-200",
      },
      {
        title: "Government-backed fully funded",
        items: ENRICHED_SCHOLARSHIPS.filter((s) => s.provider_type === "government" && s.funding_type === "fully_funded").slice(0, 6),
        emoji: "🏛️",
        tone: "from-amber-50 to-white border-amber-200",
      },
    ];
  }, []);

  return (
    <section className="mb-8">
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <h2 className="font-heading text-sm font-bold uppercase tracking-wide text-foreground">
          WTF scholarships
        </h2>
        <span className="text-xs text-muted-foreground">— the ones most people don't know exist</span>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {wtf.map((bucket) => (
          <div key={bucket.title} className={`rounded-md border bg-gradient-to-b p-4 ${bucket.tone}`}>
            <div className="mb-2 flex items-center gap-2">
              <span className="text-lg">{bucket.emoji}</span>
              <h3 className="font-heading text-sm font-bold text-foreground">{bucket.title}</h3>
            </div>
            <ul className="space-y-1.5">
              {bucket.items.slice(0, 4).map((s) => (
                <li key={s.id}>
                  <Link
                    to="/scholarships/$slug"
                    params={{ slug: scholarshipSlug(s) }}
                    className="group flex items-start gap-2 text-xs text-foreground/85 hover:text-primary"
                  >
                    <span className="text-sm leading-none">{s.countryFlag}</span>
                    <span className="line-clamp-1 flex-1 font-medium group-hover:underline">{s.name}</span>
                  </Link>
                </li>
              ))}
              {bucket.items.length === 0 && (
                <li className="text-xs text-muted-foreground">Nothing indexed in this bucket yet.</li>
              )}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}


export { ScholarshipCard };
