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
  Loader2,
} from "lucide-react";
import { daysLeft } from "@/lib/data";
import { fundingLabel, providerLabel, type ProfileWeight, type FundingType, type ProviderType, type CycleStatus } from "@/lib/scholarship-enrich";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { TopoBackground } from "@/components/TopoBackground";
import { SmartCampusImage } from "@/components/SmartCampusImage";
import { useWikiImage } from "@/lib/use-wiki-image";
import { LoginNudge } from "./universities.index";

export const Route = createFileRoute("/scholarships/")({
  head: () => ({
    meta: [
      { title: "Scholarships — Every UG, Masters & PhD Award Worth Knowing" },
      {
        name: "description",
        content:
          "67+ fully-funded, government, university & NGO scholarships for Bangladeshi & South Asian students. Hidden costs, MOI waivers, real eligibility — one portal.",
      },
      { property: "og:title", content: "Scholarships — FindFurther" },
      {
        property: "og:description",
        content:
          "Every scholarship that matters — filtered by degree, budget, profile and hidden costs.",
      },
    ],
  }),
  component: ScholarshipsHub,
});

/* ──────────────── Types ──────────────── */

type DbRow = {
  id: string;
  slug: string;
  name: string;
  provider: string | null;
  host_country: string | null;
  flag_emoji: string | null;
  description: string | null;
  funding_type: string | null;
  provider_type: string | null;
  cycle_status: string | null;
  degree_level: string | null;
  deadline: string | null;
  expected_next_open_month: string | null;
  amount_display: string | null;
  annual_value_usd: number | null;
  application_fee_usd: number | null;
  accepts_moi_waiver: boolean | null;
  academic_profile_weight: string | null;
  awarding_basis: string | null;
  min_sat_score: number | null;
  min_act_score: number | null;
  banner_image_url: string | null;
  eligible_countries: string[] | null;
  wow_fact: string | null;
  fully_funded: boolean | null;
};

type ViewSch = {
  id: string;
  slug: string;
  name: string;
  provider: string;
  country: string;
  countryFlag: string;
  description: string;
  funding_type: FundingType;
  provider_type: ProviderType;
  cycle_status: CycleStatus;
  level: "undergraduate" | "postgraduate" | "phd" | "all";
  deadline: string; // ISO
  amount: string;
  annual_value_usd: number | null;
  application_fee_usd: number;
  accepts_moi_waiver: boolean;
  academic_profile_weight: ProfileWeight;
  awarding_basis: "merit" | "portfolio" | "professional" | null;
  min_sat_score: number | null;
  min_act_score: number | null;
  banner_image_url: string | null;
  wow_fact: string | null;
};

function mapRow(r: DbRow): ViewSch {
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    provider: r.provider ?? "—",
    country: r.host_country ?? "—",
    countryFlag: r.flag_emoji ?? "🎓",
    description: r.description ?? "",
    funding_type: (r.funding_type as FundingType) ?? "partial_bursary",
    provider_type: (r.provider_type as ProviderType) ?? "ngo_foundation",
    cycle_status: (r.cycle_status as CycleStatus) ?? "active_open",
    level: (r.degree_level as ViewSch["level"]) ?? "all",
    deadline: r.deadline ?? "",
    amount: r.amount_display ?? "Varies",
    annual_value_usd: r.annual_value_usd,
    application_fee_usd: r.application_fee_usd ?? 0,
    accepts_moi_waiver: !!r.accepts_moi_waiver,
    academic_profile_weight: (r.academic_profile_weight as ProfileWeight) ?? "merit",
    awarding_basis: (r.awarding_basis as ViewSch["awarding_basis"]) ?? null,
    min_sat_score: r.min_sat_score ?? null,
    min_act_score: r.min_act_score ?? null,
    banner_image_url: r.banner_image_url,
    wow_fact: r.wow_fact,
  };
}

/* ──────────────── Filter primitives ──────────────── */

type BudgetKey = "free" | "5k" | "15k" | "any";
const BUDGETS: { key: BudgetKey; label: string; sub: string }[] = [
  { key: "free", label: "100% Free Education", sub: "Fully funded only" },
  { key: "5k", label: "Up to $5k / yr out-of-pocket", sub: "Includes partial bursaries" },
  { key: "15k", label: "Up to $15k / yr out-of-pocket", sub: "Includes tuition waivers" },
  { key: "any", label: "Any budget", sub: "Show everything" },
];

type LevelKey = "all" | "undergraduate" | "postgraduate" | "phd";
const LEVELS: { key: LevelKey; label: string; sub: string; icon: any }[] = [
  { key: "undergraduate", label: "Undergraduate", sub: "Bachelor's degree", icon: GraduationCap },
  { key: "postgraduate", label: "Masters", sub: "MSc / MA / MBA", icon: GraduationCap },
  { key: "phd", label: "PhD", sub: "Doctoral / research", icon: GraduationCap },
  { key: "all", label: "All levels", sub: "Open to UG + PG", icon: Sparkles },
];

const PROFILES: { key: ProfileWeight | "any"; label: string; icon: any }[] = [
  { key: "any", label: "Any profile", icon: Sparkles },
  { key: "merit", label: "High Academic / Merit", icon: GraduationCap },
  { key: "portfolio", label: "Creative / Portfolio / ECA", icon: Palette },
  { key: "professional", label: "Work Experience", icon: Briefcase },
];

const PROVIDER_TYPES: { key: "all" | ProviderType; label: string }[] = [
  { key: "all", label: "All sources" },
  { key: "government", label: "Government" },
  { key: "university_internal", label: "University" },
  { key: "ngo_foundation", label: "NGO / Foundation" },
  { key: "private_corporate", label: "Corporate / Private" },
];

const COUNTRY_REGION: Record<string, string> = {
  USA: "North America", Canada: "North America",
  UK: "Europe", Germany: "Europe", Finland: "Europe", Norway: "Europe", Italy: "Europe",
  Netherlands: "Europe", Sweden: "Europe", Switzerland: "Europe", "EU (multi)": "Europe", France: "Europe",
  Japan: "Asia", "South Korea": "Asia", China: "Asia", Singapore: "Asia", "Hong Kong": "Asia", India: "Asia", Turkey: "Asia",
  Australia: "Oceania", "New Zealand": "Oceania",
};
const REGIONS = ["all", "North America", "Europe", "Asia", "Oceania", "Various"] as const;

/* ──────────────── Page ──────────────── */

function ScholarshipsHub() {
  const [level, setLevel] = useState<LevelKey>("undergraduate");
  const [budget, setBudget] = useState<BudgetKey>("free");
  const [profile, setProfile] = useState<ProfileWeight | "any">("any");
  const [providerType, setProviderType] = useState<"all" | ProviderType>("all");
  const [region, setRegion] = useState<(typeof REGIONS)[number]>("all");
  const [noFee, setNoFee] = useState(false);
  const [moiOnly, setMoiOnly] = useState(false);
  const [satOnly, setSatOnly] = useState(false);
  const [userSat, setUserSat] = useState<string>("");
  const [q, setQ] = useState("");

  const dbQuery = useQuery({
    queryKey: ["scholarships-all-v2"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("scholarships")
        .select(
          "id,slug,name,provider,host_country,flag_emoji,description,funding_type,provider_type,cycle_status,degree_level,deadline,expected_next_open_month,amount_display,annual_value_usd,application_fee_usd,accepts_moi_waiver,academic_profile_weight,awarding_basis,min_sat_score,min_act_score,banner_image_url,eligible_countries,wow_fact,fully_funded"
        )
        .order("deadline", { ascending: true, nullsFirst: false })
        .limit(500);
      if (error) throw error;
      return (data as DbRow[]).map(mapRow);
    },
    staleTime: 5 * 60 * 1000,
  });

  const all = dbQuery.data ?? [];

  const satNum = Number(userSat);
  const hasUserSat = Number.isFinite(satNum) && satNum >= 400 && satNum <= 1600;

  const filtered = useMemo(() => {
    return all.filter((s) => {
      if (level !== "all") {
        if (s.level !== level && s.level !== "all") return false;
      }
      // Budget filter: use real funding type AND tuition cap
      if (budget === "free" && s.funding_type !== "fully_funded") return false;
      if (budget === "5k") {
        // Out-of-pocket = sticker tuition minus award. Anything fully funded or under ~$5k tuition stays.
        const tuition = s.annual_value_usd ?? 0;
        if (s.funding_type !== "fully_funded" && s.funding_type !== "tuition_waiver" && tuition < 4000) return false;
      }
      if (budget === "15k") {
        if (s.funding_type === "stipend_only") return false;
      }
      // Profile filter — use the proper enum column, fall back gracefully
      if (profile !== "any" && s.awarding_basis && s.awarding_basis !== profile) return false;
      if (providerType !== "all" && s.provider_type !== providerType) return false;
      if (region !== "all") {
        const r = COUNTRY_REGION[s.country] ?? "Various";
        if (r !== region) return false;
      }
      if (noFee && s.application_fee_usd > 0) return false;
      if (moiOnly && !s.accepts_moi_waiver) return false;
      // SAT filtering
      if (satOnly && s.min_sat_score == null) return false;
      if (hasUserSat && s.min_sat_score != null && s.min_sat_score > satNum) return false;
      if (q) {
        const n = q.toLowerCase();
        if (
          !s.name.toLowerCase().includes(n) &&
          !s.country.toLowerCase().includes(n) &&
          !s.provider.toLowerCase().includes(n)
        ) return false;
      }
      return true;
    });
  }, [all, level, budget, profile, providerType, region, noFee, moiOnly, satOnly, hasUserSat, satNum, q]);

    const { active, prepMode } = useMemo(() => {
    const isOpenNow = (s: ViewSch) => {
      if (s.cycle_status === "rolling_admissions") return true;
      if (s.cycle_status !== "active_open") return false;
      return !s.deadline || daysLeft(s.deadline) >= 0;
    };
    const open = filtered.filter(isOpenNow).sort((a, b) => {
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      return +new Date(a.deadline) - +new Date(b.deadline);
    });
    const rest = filtered.filter(
      (s) => !isOpenNow(s) && (s.cycle_status === "closed_prep_mode" || s.cycle_status === "active_open"),
    );
    return { active: open, prepMode: rest };
  }, [filtered]);

  const closingSoon = active.filter((s) => {
    if (!s.deadline) return false;
    const d = daysLeft(s.deadline);
    return d >= 0 && d <= 30;
  });

  const reset = () => {
    setLevel("undergraduate");
    setBudget("free");
    setProfile("any");
    setProviderType("all");
    setRegion("all");
    setNoFee(false);
    setMoiOnly(false);
    setSatOnly(false);
    setUserSat("");
    setQ("");
  };

  const fullyFundedCount = all.filter((s) => s.funding_type === "fully_funded").length;
  const noFeeCount = all.filter((s) => s.application_fee_usd === 0).length;
  const countriesCount = new Set(all.map((s) => s.country).filter((c) => c && c !== "—")).size;

  return (
    <div>
      {/* ─── Cinematic Hero ─── */}
            <section
        className="relative overflow-hidden"
        style={{ background: "linear-gradient(135deg,#651F2B 0%,#4a1620 60%,#2a0e14 100%)" }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-90"
          style={{
            background:
              "radial-gradient(ellipse 70% 60% at 80% 0%, rgba(217,181,101,.18), transparent 65%), radial-gradient(ellipse 60% 50% at 10% 100%, rgba(120,35,50,.5), transparent 60%)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(217,181,101,.07) 1px, transparent 1px), linear-gradient(90deg, rgba(217,181,101,.07) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
          }}
        />

        <div className="relative mx-auto max-w-7xl px-4 pt-16 pb-12 md:pt-24 md:pb-16 lg:px-6">
          <div className="mb-8 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.28em] text-[#f5f0e0]/60">
            <span className="h-px w-10 bg-[#D9B565]/60" />
            Vol. {new Date().getFullYear()} — Atlas
            <span className="h-px w-10 bg-[#D9B565]/60" />
          </div>

          <h1 className="font-heading text-6xl font-extrabold leading-[0.95] tracking-tight text-[#f5f0e0] md:text-[7.5rem]">
            <span className="font-medium italic text-[#D9B565]">Funded.</span>
          </h1>
          <div className="mt-4 font-heading text-2xl font-light tracking-tight text-[#f5f0e0]/80 md:text-3xl">
            Everywhere worth going.
          </div>

          <div className="mt-12 grid max-w-4xl grid-cols-2 gap-px overflow-hidden rounded-md border border-[#f5f0e0]/15 bg-[#f5f0e0]/15 sm:grid-cols-4">
            {[
              { v: all.length, l: "Awards" },
              { v: fullyFundedCount, l: "Fully funded" },
              { v: noFeeCount, l: "$0 to apply" },
              { v: countriesCount, l: "Countries" },
            ].map((k) => (
              <div key={k.l} className="bg-[#2a0e14]/70 px-6 py-6 backdrop-blur">
                <div className="font-heading text-4xl font-bold tabular-nums text-[#f5f0e0] md:text-5xl">
                  {k.v}
                </div>
                <div className="mt-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#D9B565]">
                  {k.l}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10">
            <div className="inline-flex flex-wrap gap-1.5 rounded-full border border-[#f5f0e0]/20 bg-[#2a0e14]/40 p-1.5 backdrop-blur-xl">
              {LEVELS.map((l) => {
                const Icon = l.icon;
                const isActive = level === l.key;
                const count = all.filter((s) => l.key === "all" ? true : s.level === l.key || s.level === "all").length;
                return (
                  <button
                    key={l.key}
                    onClick={() => setLevel(l.key)}
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[13px] font-semibold transition-all duration-300 ${
                      isActive
                        ? "bg-[#f5f0e0] text-[#651F2B] shadow-lg"
                        : "text-[#f5f0e0]/80 hover:text-[#f5f0e0]"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{l.label}</span>
                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums ${
                      isActive ? "bg-[#651F2B]/15 text-[#651F2B]" : "bg-[#f5f0e0]/15 text-[#f5f0e0]/70"
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <div className="hairline-gold absolute inset-x-0 bottom-0" />
      </section>

      <div className="mx-auto max-w-7xl px-4 py-10 lg:px-6">


      {/* WTF Scholarships carousel */}
      <WtfScholarshipsCarousel all={all} />

      {/* Intent matrix */}
      <section className="rounded-md border border-border bg-heading p-5 md:p-6">
        <div className="grid gap-6 md:grid-cols-3">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Wallet className="h-4 w-4 text-primary" />
              <h3 className="font-heading text-sm font-bold uppercase tracking-wide text-foreground">Your budget</h3>
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

          <div>
            <div className="mb-2 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h3 className="font-heading text-sm font-bold uppercase tracking-wide text-foreground">Your profile</h3>
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

          <div className="flex flex-col gap-3">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-primary" />
                <h3 className="font-heading text-sm font-bold uppercase tracking-wide text-foreground">Hidden-wall toggles</h3>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="flex cursor-pointer items-start gap-2 rounded border border-border px-3 py-2 text-sm hover:border-primary/40">
                  <input type="checkbox" checked={noFee} onChange={(e) => setNoFee(e.target.checked)} className="mt-0.5 h-4 w-4 accent-primary" />
                  <span>
                    <span className="font-medium text-foreground">Only $0 application fees</span>
                    <span className="block text-[11px] text-muted-foreground">Hide awards that charge to apply</span>
                  </span>
                </label>
                <label className="flex cursor-pointer items-start gap-2 rounded border border-border px-3 py-2 text-sm hover:border-primary/40">
                  <input type="checkbox" checked={moiOnly} onChange={(e) => setMoiOnly(e.target.checked)} className="mt-0.5 h-4 w-4 accent-primary" />
                  <span>
                    <span className="font-medium text-foreground">Accepts MOI (no IELTS)</span>
                    <span className="block text-[11px] text-muted-foreground">Medium-of-instruction letter in lieu of IELTS/TOEFL</span>
                  </span>
                </label>
                <label className="flex cursor-pointer items-start gap-2 rounded border border-border px-3 py-2 text-sm hover:border-primary/40">
                  <input type="checkbox" checked={satOnly} onChange={(e) => setSatOnly(e.target.checked)} className="mt-0.5 h-4 w-4 accent-primary" />
                  <span>
                    <span className="font-medium text-foreground">SAT-based merit awards only</span>
                    <span className="block text-[11px] text-muted-foreground">Show only scholarships with a published SAT cutoff</span>
                  </span>
                </label>
                <div className="rounded border border-border px-3 py-2">
                  <label className="block text-[11px] font-medium text-foreground">Your SAT score (optional)</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={400}
                    max={1600}
                    placeholder="e.g. 1450"
                    value={userSat}
                    onChange={(e) => setUserSat(e.target.value)}
                    className="mt-1 h-8 w-full rounded border border-border bg-heading px-2 text-sm text-foreground"
                  />
                  <div className="mt-1 text-[10px] text-muted-foreground">Hides awards whose minimum SAT exceeds your score.</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <select
                value={providerType}
                onChange={(e) => setProviderType(e.target.value as any)}
                className="h-10 rounded border border-border bg-heading px-2 text-sm text-foreground"
              >
                {PROVIDER_TYPES.map((p) => (
                  <option key={p.key} value={p.key}>{p.label}</option>
                ))}
              </select>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value as any)}
                className="h-10 rounded border border-border bg-heading px-2 text-sm text-foreground"
              >
                {REGIONS.map((r) => (
                  <option key={r} value={r}>{r === "all" ? "All regions" : r}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-[1fr_auto] gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, country, provider…" className="h-10 bg-heading pl-9" />
              </div>
              <Button variant="outline" size="sm" onClick={reset} className="h-10">
                <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Reset
              </Button>
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
            <div className="mt-0.5 text-xs text-foreground/80">Sorted by deadline — apply to the urgent ones first.</div>
          </div>
        </div>
      )}

      {/* Loading */}
      {dbQuery.isLoading && (
        <div className="mt-10 flex items-center justify-center gap-3 rounded-md border border-border bg-heading p-12 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading scholarships…
        </div>
      )}

      {/* Dual stream */}
      {!dbQuery.isLoading && (
        <>
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
                icon={<CalendarClock className="h-5 w-5 text-earth" />}
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
        </>
      )}

      <LoginNudge text="Save your favorites and track every deadline." />
      </div>
    </div>
  );
}


/* ──────────────── Helpers ──────────────── */

function SectionHeader({
  icon, title, subtitle, count, accent,
}: { icon: React.ReactNode; title: string; subtitle: string; count: number; accent?: "amber" }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4 border-b border-border pb-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          {icon}
          <h2 className={`font-heading text-2xl font-bold ${accent === "amber" ? "text-earth" : "text-foreground"}`}>{title}</h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      </div>
      <div className="shrink-0 rounded-full border border-border bg-heading px-3 py-1 text-xs font-semibold text-foreground">{count}</div>
    </div>
  );
}

function EmptyState({ reset }: { reset: () => void }) {
  return (
    <div className="rounded-md border border-dashed border-border bg-heading p-12 text-center">
      <p className="font-heading text-lg font-bold text-foreground">No scholarships match these exact criteria.</p>
      <p className="mt-1 text-sm text-muted-foreground">Try broadening your degree level, budget or region filters.</p>
      <Button onClick={reset} className="mt-5 bg-primary text-primary-foreground hover:bg-primary/90">
        <RotateCcw className="mr-2 h-4 w-4" /> Reset filters
      </Button>
    </div>
  );
}

function levelBadge(level: ViewSch["level"]): string {
  switch (level) {
    case "undergraduate": return "Bachelor's";
    case "postgraduate": return "Master's";
    case "phd": return "PhD";
    case "all": return "All Levels";
    default: return String(level ?? "").toUpperCase();
  }
}

/* ──────────────── Card ──────────────── */

function ScholarshipCard({ s, variant }: { s: ViewSch; variant: "active" | "prep" }) {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const d = s.deadline ? daysLeft(s.deadline) : null;
  const isRolling = s.cycle_status === "rolling_admissions";

  const countdownCls =
    isRolling || d === null
      ? "bg-[#f5f0e0]/15 text-[#f5f0e0] ring-[#f5f0e0]/30"
      : d < 0
      ? "bg-[#f5f0e0]/15 text-[#f5f0e0]/70 ring-[#f5f0e0]/25"
      : d <= 10
      ? "bg-red-500/90 text-white ring-red-300/60"
      : d <= 30
      ? "bg-amber-600/90 text-white ring-amber-300/60"
      : "bg-[#D9B565] text-[#43151d] ring-[#D9B565]/60";

  const countdownLabel = isRolling || d === null ? "Rolling" : d < 0 ? "Closed" : d === 0 ? "Today" : `${d}d left`;

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

  const banner = typeof s.banner_image_url === "string" ? s.banner_image_url.trim() : "";
  const provider = s.provider && s.provider !== "—" ? s.provider : "";
  const wikiByProvider = useWikiImage(provider, !banner && !!provider);
  const wikiByName = useWikiImage(s.name, !banner && !provider);
  const imageSrc = banner || wikiByProvider.data || wikiByName.data || null;

  return (
    <Link
      to="/scholarships/$slug"
      params={{ slug: s.slug }}
      className="group relative flex min-h-[390px] flex-col overflow-hidden rounded-lg bg-[#43151d] shadow-sm ring-1 ring-[#651F2B]/30 transition-shadow hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#651F2B]"
    >
      <div className="absolute inset-0">
        <TopoBackground />
        <SmartCampusImage
          src={imageSrc}
          name={s.name}
          alt={`${s.name} scholarship cover`}
          className="transition-transform duration-700 group-hover:scale-[1.04]"
          noOverlay
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1d080d]/95 via-[#2a0e14]/80 to-transparent" />
      </div>

      <div className="absolute right-3 top-3 z-10 flex items-center gap-1.5">
        <span className="rounded-full bg-[#f5f0e0]/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#f5f0e0] ring-1 ring-[#f5f0e0]/30 backdrop-blur">
          {levelBadge(s.level)}
        </span>
        <button
          onClick={save}
          disabled={saving}
          aria-label="Save to shortlist"
          className="rounded-full bg-[#f5f0e0]/15 p-1.5 text-[#f5f0e0] ring-1 ring-[#f5f0e0]/30 backdrop-blur transition hover:bg-[#f5f0e0]/25 hover:text-red-300"
        >
          <Heart className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="absolute left-3 top-3 z-10 flex flex-wrap items-center gap-1.5">
        <span className="rounded-full bg-[#D9B565] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#43151d] ring-1 ring-[#f5f0e0]/20">
          {fundingLabel(s.funding_type)}
        </span>
        {variant === "prep" && (
          <span className="rounded-full bg-[#f5f0e0]/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#f5f0e0] ring-1 ring-[#f5f0e0]/30">
            Prep mode
          </span>
        )}
      </div>

      <div className="relative z-10 flex flex-1 flex-col justify-end p-5 pt-16 text-[#f5f0e0]">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-xl leading-none">{s.countryFlag}</span>
          <span className="font-medium">{s.country}</span>
          <span aria-hidden className="text-[#f5f0e0]/50">·</span>
          <span className="text-xs text-[#f5f0e0]/75">{providerLabel(s.provider_type)}</span>
        </div>

        <h3 className="mt-2 line-clamp-2 font-heading text-xl font-extrabold leading-tight drop-shadow-lg">
          {s.name}
        </h3>
        <div className="mt-1 truncate text-xs text-[#f5f0e0]/75">{s.provider}</div>

        {s.min_sat_score != null && (
          <div className="mt-2 inline-flex w-fit items-center gap-1.5 self-start rounded-full bg-[#D9B565]/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#f5f0e0] ring-1 ring-[#D9B565]/50 backdrop-blur">
            🎯 SAT ≥ {s.min_sat_score}
            {s.min_act_score ? <span className="text-[#f5f0e0]/70">· ACT {s.min_act_score}+</span> : null}
          </div>
        )}

        <div className="mt-4 flex items-end justify-between gap-3 border-t border-[#f5f0e0]/20 pt-3">
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-wide text-[#f5f0e0]/60">Value</div>
            <div className="line-clamp-2 text-sm font-bold leading-snug">{s.amount || "Varies"}</div>
          </div>
          {variant === "prep" ? (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#f5f0e0]/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#f5f0e0] ring-1 ring-[#f5f0e0]/30">
              <CalendarClock className="h-3 w-3" /> Next cycle
            </span>
          ) : (
            <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ring-1 ${countdownCls}`}>
              <Clock className="h-3 w-3" />
              {countdownLabel}
            </span>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between text-[11px] text-[#f5f0e0]/75">
          <span>{s.application_fee_usd > 0 ? `$${s.application_fee_usd} fee` : "Free to apply"}</span>
          {s.accepts_moi_waiver && (
            <span className="rounded-full bg-[#D9B565]/20 px-2 py-0.5 font-semibold text-[#D9B565] ring-1 ring-[#D9B565]/40">MOI ok</span>
          )}
          <span className="inline-flex items-center gap-1 font-semibold text-[#f5f0e0] group-hover:underline">
            View <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}

/* ──────────────── WTF Carousel ──────────────── */

function WtfScholarshipsCarousel({ all }: { all: ViewSch[] }) {
  const buckets = useMemo(() => {
    return [
      {
        title: "$0 application fee",
        items: all.filter((s) => s.application_fee_usd === 0 && s.funding_type === "fully_funded").slice(0, 6),
        emoji: "💸",
        tone: "from-accent to-heading border-accent",
      },
      {
        title: "MOI accepted (skip IELTS)",
        items: all.filter((s) => s.accepts_moi_waiver && s.funding_type === "fully_funded").slice(0, 6),
        emoji: "📝",
        tone: "from-sky-50 to-heading border-sky-200",
      },
      {
        title: "Government-backed fully funded",
        items: all.filter((s) => s.provider_type === "government" && s.funding_type === "fully_funded").slice(0, 6),
        emoji: "🏛️",
        tone: "from-earth to-heading border-earth",
      },
    ];
  }, [all]);

  return (
    <section className="mb-8">
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <h2 className="font-heading text-sm font-bold uppercase tracking-wide text-foreground">WTF scholarships</h2>
        <span className="text-xs text-muted-foreground">— the ones most people don't know exist</span>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {buckets.map((bucket) => (
          <div key={bucket.title} className="rounded-md border border-[#651F2B]/15 bg-white/50 p-4">
            <div className="mb-2 flex items-center gap-2">
              <span className="text-lg">{bucket.emoji}</span>
              <h3 className="font-heading text-sm font-bold text-foreground">{bucket.title}</h3>
            </div>
            <ul className="space-y-1.5">
              {bucket.items.slice(0, 4).map((s) => (
                <li key={s.id}>
                  <Link
                    to="/scholarships/$slug"
                    params={{ slug: s.slug }}
                    className="group flex items-start gap-2 text-xs text-foreground/85 hover:text-primary"
                  >
                    <span className="text-sm leading-none">{s.countryFlag}</span>
                    <span className="line-clamp-1 flex-1 font-medium group-hover:underline">{s.name}</span>
                  </Link>
                </li>
              ))}
              {bucket.items.length === 0 && (
                <li className="text-xs text-muted-foreground">Nothing in this bucket yet.</li>
              )}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
