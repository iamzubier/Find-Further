import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  SCHOLARSHIPS,
  daysLeft,
  findScholarshipBySlug,
  type Scholarship,
} from "@/lib/data";
import { enrich, fundingLabel, providerLabel, type EnrichedScholarship } from "@/lib/scholarship-enrich";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  Clock,
  Heart,
  ExternalLink,
  Check,
  X,
  DollarSign,
  GraduationCap,
  ListChecks,
  MessageSquareQuote,
  Plane,
  HeartPulse,
  Home,
  Globe2,
  Languages,
  CalendarClock,
  Sparkles,
  Trophy,
  Users,
  Calculator,
  AlertCircle,
} from "lucide-react";
import { SmartCampusImage } from "@/components/SmartCampusImage";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { hydrateScholarship } from "@/lib/hydrate-scholarship.functions";


type DbScholarship = {
  id: string;
  slug: string;
  name: string;
  provider: string | null;
  host_country: string | null;
  description: string | null;
  funding_type: string | null;
  provider_type: string | null;
  cycle_status: string | null;
  degree_level: string | null;
  annual_value_usd: number | null;
  amount_display: string | null;
  allowance_breakdown: Record<string, unknown> | null;
  upfront_costs_covered: Record<string, unknown> | null;
  hidden_costs_for_student: string | null;
  hidden_obligations: string | null;
  application_fee_usd: number | null;
  accepts_moi_waiver: boolean | null;
  academic_profile_weight: string | null;
  deadline: string | null;
  expected_next_open_month: string | null;
  official_url: string | null;
  required_documents_checklist: string[] | null;
  insider_tips: string[] | null;
  hydrated_at: string | null;
};

export const Route = createFileRoute("/scholarships/$slug")({
  head: ({ params }) => {
    const s = findScholarshipBySlug(params.slug);
    const name = s?.name ?? "Scholarship";
    return {
      meta: [
        { title: `${name} — BeyondBorder Scholarships` },
        {
          name: "description",
          content: s
            ? `${name}: ${s.amount}. Financial dashboard, hidden costs, MOI vs IELTS, and dynamic timeline.`
            : "Live scholarship profile — funding, obligations, and deadlines.",
        },
      ],
    };
  },
  errorComponent: ({ reset }) => (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center">
      <h1 className="font-heading text-3xl font-extrabold">Something went wrong</h1>
      <Button onClick={() => reset()} className="mt-6">Try again</Button>
    </div>
  ),
  component: ScholarshipDetailPage,
});

function ScholarshipDetailPage() {
  const { slug } = Route.useParams();
  const staticS = useMemo(() => findScholarshipBySlug(slug), [slug]);
  const queryClient = useQueryClient();
  const hydrateFn = useServerFn(hydrateScholarship);

  // Pull DB row (if present) — gives us the multi-POV detail when hydrated.
  const dbQuery = useQuery({
    queryKey: ["scholarship-db", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("scholarships")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return (data as DbScholarship | null) ?? null;
    },
  });

  // Trigger JIT hydration when neither static nor DB has this scholarship
  const [hydrating, setHydrating] = useState(false);
  const [hydrateErr, setHydrateErr] = useState<string | null>(null);
  useEffect(() => {
    if (dbQuery.isLoading) return;
    if (staticS) return;
    if (dbQuery.data?.hydrated_at) return;
    if (hydrating) return;
    setHydrating(true);
    setHydrateErr(null);
    hydrateFn({ data: { slug } })
      .then((r) => {
        if (!r.ok) setHydrateErr(r.error ?? "Hydration failed");
        return queryClient.invalidateQueries({ queryKey: ["scholarship-db", slug] });
      })
      .catch((e) => setHydrateErr(String(e?.message ?? e)))
      .finally(() => setHydrating(false));
  }, [slug, staticS, dbQuery.data, dbQuery.isLoading, hydrating, hydrateFn, queryClient]);

  // No data at all → shimmer + rotating status
  if (!staticS && !dbQuery.data) {
    if (hydrateErr) return <HydrationError slug={slug} message={hydrateErr} />;
    return <HydrationShimmer />;
  }

  // Build a unified enriched view: static enrichment, with DB overrides if present.
  const view = buildView(staticS, dbQuery.data ?? null);

  return (
    <div className="pb-24">
      <Hero v={view} />

      <div className="mx-auto max-w-6xl px-4 py-10">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="mb-8 grid h-auto w-full grid-cols-2 gap-1 bg-neutral-100 p-1 md:grid-cols-4 lg:grid-cols-8">
            <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
            <TabsTrigger value="covers" className="text-xs">What It Covers</TabsTrigger>
            <TabsTrigger value="who" className="text-xs">Who Can Apply</TabsTrigger>
            <TabsTrigger value="how" className="text-xs">How To Apply</TabsTrigger>
            <TabsTrigger value="docs" className="text-xs">Documents</TabsTrigger>
            <TabsTrigger value="tips" className="text-xs">Tips</TabsTrigger>
            <TabsTrigger value="stories" className="text-xs">Stories</TabsTrigger>
            <TabsTrigger value="odds" className="text-xs">Odds</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <Overview v={view} />
          </TabsContent>
          <TabsContent value="covers">
            <FinancialDashboard v={view} />
          </TabsContent>
          <TabsContent value="who">
            <WhoCanApply v={view} />
            <div className="mt-6"><LanguageMeritMatrix v={view} /></div>
          </TabsContent>
          <TabsContent value="how">
            <Timeline v={view} />
            <CommonErrors />
          </TabsContent>
          <TabsContent value="docs">
            <DocChecklist v={view} />
          </TabsContent>
          <TabsContent value="tips">
            <RecipientTips v={view} />
          </TabsContent>
          <TabsContent value="stories">
            <SuccessStories v={view} />
          </TabsContent>
          <TabsContent value="odds">
            <OddsCalculator v={view} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

/* ─────────────────── Overview ─────────────────── */

function Overview({ v }: { v: View }) {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      <div className="md:col-span-2 rounded-md border border-border bg-white p-6">
        <h2 className="font-heading text-2xl font-bold text-foreground">About this award</h2>
        <p className="mt-3 text-sm leading-relaxed text-foreground/85">
          {v.description || `${v.name} is a ${fundingLabel(v.funding_type).toLowerCase()} ${providerLabel(v.provider_type).toLowerCase()} award hosted in ${v.country}.`}
        </p>
        <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-border pt-4 text-sm">
          <Row label="Provider" value={v.provider} />
          <Row label="Host country" value={v.country} />
          <Row label="Funding" value={fundingLabel(v.funding_type)} />
          <Row label="Type" value={providerLabel(v.provider_type)} />
          <Row label="Cycle" value={v.cycle_status === "closed_prep_mode" ? "Prep mode" : v.cycle_status === "rolling_admissions" ? "Rolling" : "Open"} />
          <Row label="Annual value" value={v.amount || "Varies"} />
        </dl>
      </div>
      <div className="rounded-md border border-amber-200 bg-amber-50/30 p-6">
        <div className="flex items-center gap-2 text-amber-800">
          <Sparkles className="h-4 w-4" />
          <h3 className="font-heading text-sm font-bold uppercase tracking-wide">The wow fact</h3>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-amber-900">
          {v.application_fee_usd === 0
            ? `Zero application fee — most peers pay $50-150 just to be considered.`
            : v.accepts_moi_waiver
            ? `Accepts MOI letter in lieu of IELTS — saves ~$250 + 6 weeks of test prep.`
            : `Competitive merit award. Strong recommenders matter more than raw GPA.`}
        </p>
      </div>
    </div>
  );
}


/* ─────────────────── View model ─────────────────── */

type View = EnrichedScholarship & {
  source: "static" | "hydrated" | "merged";
  hidden_obligations?: string;
  hidden_costs_for_student?: string;
  allowance_breakdown?: Record<string, unknown>;
  upfront_costs_covered?: Record<string, unknown>;
  required_documents_checklist?: string[];
  insider_tips?: string[];
  expected_next_open_month?: string;
  applyUrl?: string;
};

function buildView(staticS: Scholarship | undefined, db: DbScholarship | null): View {
  if (staticS && !db?.hydrated_at) {
    return { ...enrich(staticS), source: "static" };
  }
  // DB-only or merged
  const baseStatic: Scholarship = staticS ?? {
    id: db!.id,
    name: db!.name,
    country: db!.host_country ?? "Unknown",
    countryFlag: "🌍",
    type: db!.funding_type === "fully_funded" ? "Full" : db!.funding_type === "tuition_waiver" ? "Partial" : "Stipend",
    level: (db!.degree_level as Scholarship["level"]) ?? "all",
    amount: db!.amount_display ?? "Varies",
    deadline: db!.deadline ?? new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10),
    description: db!.description ?? "",
    applyUrl: db!.official_url ?? undefined,
  };
  const enriched = enrich(baseStatic);
  if (!db) return { ...enriched, source: "static" };
  return {
    ...enriched,
    source: staticS ? "merged" : "hydrated",
    provider: db.provider ?? enriched.provider,
    funding_type: (db.funding_type as EnrichedScholarship["funding_type"]) ?? enriched.funding_type,
    provider_type: (db.provider_type as EnrichedScholarship["provider_type"]) ?? enriched.provider_type,
    cycle_status: (db.cycle_status as EnrichedScholarship["cycle_status"]) ?? enriched.cycle_status,
    application_fee_usd: db.application_fee_usd ?? enriched.application_fee_usd,
    accepts_moi_waiver: db.accepts_moi_waiver ?? enriched.accepts_moi_waiver,
    hidden_obligations: db.hidden_obligations ?? undefined,
    hidden_costs_for_student: db.hidden_costs_for_student ?? undefined,
    allowance_breakdown: db.allowance_breakdown ?? undefined,
    upfront_costs_covered: db.upfront_costs_covered ?? undefined,
    required_documents_checklist: db.required_documents_checklist ?? undefined,
    insider_tips: db.insider_tips ?? undefined,
    expected_next_open_month: db.expected_next_open_month ?? undefined,
    applyUrl: db.official_url ?? enriched.applyUrl,
  };
}

/* ─────────────────── Shimmer / error states ─────────────────── */

const ROTATING = [
  "Connecting to global registry…",
  "Cross-referencing official portals…",
  "Synthesising allowance breakdown…",
  "Surfacing past recipient tips…",
];

function HydrationShimmer() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((n) => (n + 1) % ROTATING.length), 1100);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="mx-auto max-w-3xl px-4 py-20">
      <div className="rounded-md border border-border bg-white p-10 text-center shadow-sm">
        <div className="mx-auto h-12 w-12 animate-pulse rounded-full bg-primary/15" />
        <h1 className="mt-6 font-heading text-2xl font-bold text-foreground">
          Building this scholarship profile…
        </h1>
        <p className="mt-2 text-sm text-muted-foreground transition-opacity">{ROTATING[i]}</p>
        <div className="mx-auto mt-8 max-w-md space-y-2">
          <div className="h-3 animate-pulse rounded bg-neutral-200" />
          <div className="h-3 w-5/6 animate-pulse rounded bg-neutral-200" />
          <div className="h-3 w-2/3 animate-pulse rounded bg-neutral-200" />
        </div>
      </div>
    </div>
  );
}

function HydrationError({ slug, message }: { slug: string; message: string }) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center">
      <h1 className="font-heading text-3xl font-extrabold text-foreground">
        Couldn't build this profile
      </h1>
      <p className="mt-3 text-sm text-muted-foreground">
        We tried to pull live data for <code className="rounded bg-neutral-100 px-1.5 py-0.5">{slug}</code> but ran into:
      </p>
      <p className="mx-auto mt-2 max-w-md rounded border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
        {message}
      </p>
      <Button asChild className="mt-6"><Link to="/scholarships">← Back to all scholarships</Link></Button>
    </div>
  );
}

/* ─────────────────── Hero ─────────────────── */

function useCountdown(deadlineIso: string) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const target = new Date(deadlineIso).getTime();
  const diff = Math.max(0, target - now);
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff / 3600000) % 24),
    minutes: Math.floor((diff / 60000) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    closed: target - now <= 0,
  };
}

function Hero({ v }: { v: View }) {
  const { user } = useAuth();
  const c = useCountdown(v.deadline);
  const d = daysLeft(v.deadline);
  const isPrep = v.cycle_status === "closed_prep_mode";

  const save = async () => {
    if (!user) {
      toast.error("Log in to save scholarships");
      return;
    }
    const { error } = await supabase.from("shortlist").insert({
      user_id: user.id,
      item_type: "scholarship",
      item_id: v.id,
      item_name: v.name,
      item_data: v as any,
    });
    if (error) toast.error(error.code === "23505" ? "Already saved" : error.message);
    else toast.success(`Saved ${v.name}`);
  };

  return (
    <div className="relative w-full overflow-hidden border-b border-border bg-neutral-900">
      <div className="absolute inset-0">
        <SmartCampusImage src={null} name={`${v.country} library`} noOverlay loading="eager" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/55 to-black/85" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-10 text-white">
        <Link to="/scholarships" className="inline-flex items-center gap-1 text-sm text-white/80 hover:text-white">
          <ArrowLeft className="h-4 w-4" /> All scholarships
        </Link>

        <div className="mt-6 grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-sm text-white/85">
              <span className="text-2xl">{v.countryFlag}</span>
              <span>{v.country}</span>
              <span aria-hidden>·</span>
              <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-semibold backdrop-blur">
                {fundingLabel(v.funding_type)}
              </span>
              <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-semibold backdrop-blur">
                {providerLabel(v.provider_type)}
              </span>
            </div>
            <h1
              className="mt-3 font-heading text-3xl font-extrabold leading-tight md:text-5xl"
              style={{ color: "#F9FAFB" }}
            >
              {v.name}
            </h1>
            <p className="mt-2 text-sm text-white/75">{v.provider}</p>
            {v.description && (
              <p className="mt-3 max-w-2xl text-sm text-white/85 md:text-base">{v.description}</p>
            )}

            <div className="mt-5 inline-flex flex-wrap items-center gap-2">
              {v.applyUrl && (
                <a href={v.applyUrl} target="_blank" rel="noopener noreferrer">
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                    {isPrep ? "Visit official portal" : "Apply now"} <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                </a>
              )}
              <Button variant="outline" onClick={save} className="border-white/30 bg-white/10 text-white hover:bg-white/20">
                <Heart className="mr-2 h-4 w-4" /> Save to Shortlist
              </Button>
            </div>
          </div>

          {/* Countdown or prep card */}
          <div className="rounded-md border border-white/20 bg-black/40 p-5 text-center backdrop-blur">
            {isPrep ? (
              <>
                <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-amber-200">
                  <CalendarClock className="h-3 w-3" /> Prep mode
                </div>
                <div className="mt-3 font-heading text-xl font-bold text-white">
                  Portal closed
                </div>
                <div className="mt-1 text-sm text-white/85">
                  Reopens ~ <b className="text-white">{v.expected_next_open_month ?? "next cycle"}</b>
                </div>
                <p className="mt-3 text-xs text-white/75">
                  {v.prep_hint ?? "Start collecting references and a draft SOP now."}
                </p>
              </>
            ) : (
              <>
                <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-white/70">
                  <Clock className="h-3 w-3" />
                  {c.closed ? "Closed" : "Closes in"}
                </div>
                {c.closed ? (
                  <div className="mt-3 font-heading text-2xl font-bold text-white/80">Applications closed</div>
                ) : (
                  <div className="mt-3 grid grid-cols-4 gap-3">
                    {[
                      { v: c.days, l: "Days" },
                      { v: c.hours, l: "Hrs" },
                      { v: c.minutes, l: "Min" },
                      { v: c.seconds, l: "Sec" },
                    ].map((u) => (
                      <div key={u.l}>
                        <div className="font-heading text-3xl font-extrabold tabular-nums text-white">
                          {String(u.v).padStart(2, "0")}
                        </div>
                        <div className="mt-0.5 text-[10px] uppercase tracking-wide text-white/60">{u.l}</div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-3 text-xs text-white/70">
                  Deadline: <b className="text-white">{new Date(v.deadline).toLocaleDateString()}</b>
                  {!c.closed && d >= 0 && d <= 30 && (
                    <span className="ml-2 rounded-full bg-destructive px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                      Urgent
                    </span>
                  )}
                </div>
              </>
            )}
            <div className="mt-4 border-t border-white/15 pt-3 text-left text-xs text-white/70">
              <div>Total annual value</div>
              <div className="mt-0.5 font-heading text-base font-bold text-white">{v.amount || "Varies"}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────── Financial Dashboard (balance sheet) ─────────────────── */

function FinancialDashboard({ v }: { v: View }) {
  const allowance = v.allowance_breakdown ?? {};
  const upfront = v.upfront_costs_covered ?? {};

  // Heuristic fallbacks when AI hasn't filled the structured fields
  const covered: { label: string; icon: any; on: boolean; note?: string }[] = [
    {
      label: "Tuition",
      icon: GraduationCap,
      on: v.funding_type === "fully_funded" || v.funding_type === "tuition_waiver" || /tuition/i.test(v.amount),
    },
    {
      label: "Monthly living stipend",
      icon: Home,
      on:
        v.funding_type === "fully_funded" ||
        v.funding_type === "stipend_only" ||
        typeof (allowance as any).monthly_stipend_usd === "number" ||
        /stipend|month/i.test(v.amount),
    },
    {
      label: "International airfare",
      icon: Plane,
      on: Boolean((allowance as any).airfare ?? (upfront as any).airfare) || /travel|airfare|flight/i.test(v.amount),
    },
    {
      label: "Health insurance",
      icon: HeartPulse,
      on: Boolean((allowance as any).insurance ?? (upfront as any).health_insurance) || /insurance/i.test(v.amount),
    },
    {
      label: "Visa fees",
      icon: Globe2,
      on: Boolean((upfront as any).visa_fees),
    },
    {
      label: "Application fee",
      icon: DollarSign,
      on: Boolean((upfront as any).application_fee_waiver) || v.application_fee_usd === 0,
      note: v.application_fee_usd === 0 ? "Free to apply" : `$${v.application_fee_usd} fee`,
    },
  ];

  return (
    <section>
      <header className="mb-5">
        <h2 className="font-heading text-2xl font-bold text-foreground">Financial dashboard</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Balance sheet of what's covered vs what you still pay out-of-pocket.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Covered column */}
        <div className="rounded-md border border-emerald-200 bg-emerald-50/30 p-5">
          <div className="mb-3 flex items-center gap-2 border-b border-emerald-200 pb-2">
            <Check className="h-4 w-4 text-emerald-700" />
            <h3 className="font-heading text-sm font-bold uppercase tracking-wide text-emerald-800">
              Covered by award
            </h3>
          </div>
          <ul className="space-y-2.5">
            {covered.filter((c) => c.on).map((c) => {
              const Icon = c.icon;
              return (
                <li key={c.label} className="flex items-start gap-3 text-sm">
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
                  <span className="flex-1 text-foreground">{c.label}</span>
                  {c.note && <span className="text-xs font-semibold text-emerald-700">{c.note}</span>}
                </li>
              );
            })}
            {covered.filter((c) => c.on).length === 0 && (
              <li className="text-sm text-muted-foreground">No itemised coverage confirmed yet.</li>
            )}
          </ul>
        </div>

        {/* Out-of-pocket column */}
        <div className="rounded-md border border-amber-200 bg-amber-50/30 p-5">
          <div className="mb-3 flex items-center gap-2 border-b border-amber-200 pb-2">
            <X className="h-4 w-4 text-amber-700" />
            <h3 className="font-heading text-sm font-bold uppercase tracking-wide text-amber-800">
              You still pay
            </h3>
          </div>
          <ul className="space-y-2.5 text-sm">
            {covered.filter((c) => !c.on).map((c) => {
              const Icon = c.icon;
              return (
                <li key={c.label} className="flex items-start gap-3">
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
                  <span className="flex-1 text-foreground">{c.label}</span>
                  {c.note && <span className="text-xs font-semibold text-amber-700">{c.note}</span>}
                </li>
              );
            })}
            {v.hidden_costs_for_student && (
              <li className="mt-3 rounded border border-amber-200 bg-white p-3 text-xs leading-relaxed text-amber-900">
                <b className="block uppercase tracking-wide">Realistic hidden costs</b>
                <span>{v.hidden_costs_for_student}</span>
              </li>
            )}
          </ul>
        </div>
      </div>

      {v.hidden_obligations && (
        <div className="mt-4 rounded-md border border-border bg-white p-5">
          <div className="mb-2 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h3 className="font-heading text-sm font-bold uppercase tracking-wide text-foreground">
              Strings attached
            </h3>
          </div>
          <p className="text-sm text-foreground/85">{v.hidden_obligations}</p>
        </div>
      )}
    </section>
  );
}

/* ─────────────────── Language & Merit Matrix ─────────────────── */

function LanguageMeritMatrix({ v }: { v: View }) {
  return (
    <section>
      <header className="mb-5">
        <h2 className="font-heading text-2xl font-bold text-foreground">Language & merit matrix</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Can you skip the IELTS, and what kind of profile actually wins this award.
        </p>
      </header>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-md border border-border bg-white p-5">
          <div className="flex items-center gap-2">
            <Languages className="h-5 w-5 text-primary" />
            <h3 className="font-heading text-sm font-bold uppercase tracking-wide text-foreground">
              English proof
            </h3>
          </div>
          <div className="mt-4 flex items-start gap-3 text-sm">
            {v.accepts_moi_waiver ? (
              <>
                <Check className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
                <div>
                  <b className="text-emerald-700">MOI letter accepted.</b>
                  <span className="block text-foreground/85">
                    A signed Medium-of-Instruction letter from your previous university typically substitutes for IELTS / TOEFL — saving ~$250 + weeks of test prep. Always confirm on the official portal.
                  </span>
                </div>
              </>
            ) : (
              <>
                <X className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
                <div>
                  <b className="text-amber-800">IELTS / TOEFL required.</b>
                  <span className="block text-foreground/85">
                    No MOI shortcut for this country. Plan for IELTS Academic 6.5+ or TOEFL iBT 90+ as a typical floor.
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="rounded-md border border-border bg-white p-5">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            <h3 className="font-heading text-sm font-bold uppercase tracking-wide text-foreground">
              Profile weight
            </h3>
          </div>
          <div className="mt-4 grid gap-2 text-sm">
            <Row label="Selection bias" value={profileLabel(v.academic_profile_weight)} />
            <Row label="Min GPA (US 4.0)" value={v.minGpa ? `${v.minGpa.toFixed(1)}+` : "Varies"} />
            <Row label="HSC / CBSE equiv." value={v.minGpa ? `${v.minGpa.toFixed(1)} HSC / ${Math.round(v.minGpa * 20)}% CBSE` : "Varies"} />
            <Row label="Application fee" value={v.application_fee_usd === 0 ? "Free" : `$${v.application_fee_usd}`} />
          </div>
        </div>
      </div>
    </section>
  );
}

function profileLabel(p: View["academic_profile_weight"]): string {
  if (p === "merit") return "High academic / merit-based";
  if (p === "portfolio") return "Creative / portfolio focus";
  if (p === "professional") return "Work-experience weighted";
  return "Holistic";
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border py-1.5 last:border-b-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold text-foreground">{value}</span>
    </div>
  );
}

/* ─────────────────── Dynamic timeline (6-month prep retrospective) ─────────────────── */

function Timeline({ v }: { v: View }) {
  const isPrep = v.cycle_status === "closed_prep_mode";
  const targetDate = isPrep
    ? // 60 days before estimated reopen — show prep schedule leading up to it
      (() => {
        const t = new Date();
        t.setMonth(t.getMonth() + 6);
        return t;
      })()
    : new Date(v.deadline);

  const months = useMemo(() => {
    const out: { label: string; tasks: string[] }[] = [];
    for (let i = 6; i >= 1; i--) {
      const d = new Date(targetDate);
      d.setMonth(d.getMonth() - i);
      out.push({
        label: d.toLocaleString("en", { month: "long", year: "numeric" }),
        tasks: TIMELINE_TASKS[6 - i],
      });
    }
    return out;
  }, [targetDate]);

  return (
    <section>
      <header className="mb-5">
        <h2 className="font-heading text-2xl font-bold text-foreground">
          {isPrep ? "6-month prep timeline" : "Application timeline"}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {isPrep
            ? `Working backwards from the expected reopening (~${v.expected_next_open_month ?? "next cycle"}).`
            : `Working backwards from the ${new Date(v.deadline).toLocaleDateString()} deadline.`}
        </p>
      </header>

      <ol className="relative space-y-5 border-l-2 border-border pl-6">
        {months.map((m, i) => (
          <li key={m.label} className="relative">
            <span className="absolute -left-[33px] flex h-8 w-8 items-center justify-center rounded-full border-2 border-primary bg-white font-heading text-xs font-bold text-primary">
              {6 - i}
            </span>
            <div className="rounded-md border border-border bg-white p-4">
              <h3 className="font-heading text-sm font-bold uppercase tracking-wide text-foreground">
                {m.label}
              </h3>
              <ul className="mt-2 space-y-1 text-sm text-foreground/85">
                {m.tasks.map((t) => (
                  <li key={t} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

const TIMELINE_TASKS: string[][] = [
  ["Shortlist 3 target awards in this category", "Read 5+ recipient blog posts / Reddit threads"],
  ["Approach 3 recommenders, give them a 1-pager brief", "Begin SOP outline (story arc, why this country)"],
  ["Book IELTS / TOEFL slot (if MOI not accepted)", "Order official transcripts + notarised translations"],
  ["Draft 1 of SOP → review with peer", "Apply to a fee-waiver university first (de-risk visa proof)"],
  ["Finalise recommendation letters", "Collect bank solvency letter + police clearance"],
  ["Submit ≥72 hrs before deadline — portals get congested", "Save confirmation PDF + email both recommenders"],
];

/* ─────────────────── Doc checklist ─────────────────── */

function DocChecklist({ v }: { v: View }) {
  const docs = v.required_documents_checklist?.length
    ? v.required_documents_checklist
    : [
        "Academic transcripts (all post-secondary)",
        "Statement of Purpose (SOP)",
        "2 Letters of Recommendation",
        "Passport copy (data page)",
        "Updated CV / Résumé",
        v.accepts_moi_waiver ? "MOI certificate (in lieu of IELTS)" : "IELTS / TOEFL score report",
        "Bank Solvency Certificate (6+ months funds)",
      ];

  return (
    <section>
      <header className="mb-5">
        <div className="flex items-center gap-2">
          <ListChecks className="h-5 w-5 text-primary" />
          <h2 className="font-heading text-2xl font-bold text-foreground">Document checklist</h2>
        </div>
      </header>
      <div className="rounded-md border border-border bg-white p-6">
        <ul className="space-y-3">
          {docs.map((doc) => (
            <li key={doc} className="flex items-start gap-3 text-sm">
              <input type="checkbox" className="mt-0.5 h-4 w-4 rounded border-border accent-primary" />
              <span className="text-foreground">{doc}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ─────────────────── Insider tips ─────────────────── */

function InsiderTips({ v }: { v: View }) {
  const tips = v.insider_tips?.length
    ? v.insider_tips
    : [
        "Start your SOP 8 weeks before deadline — get it reviewed by 3+ people including one past recipient.",
        "Your recommenders matter more than your raw GPA. Pick people who can speak to your specific work.",
        "Practice answering 'why this country, why now' — interviewers want a clear, specific story.",
      ];
  return (
    <section>
      <header className="mb-5">
        <div className="flex items-center gap-2">
          <MessageSquareQuote className="h-5 w-5 text-primary" />
          <h2 className="font-heading text-2xl font-bold text-foreground">Insider tips</h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Synthesised from Reddit, Quora, and past awardees.
        </p>
      </header>
      <div className="grid gap-4 md:grid-cols-2">
        {tips.map((t) => (
          <article key={t} className="rounded-md border border-border bg-white p-5">
            <blockquote className="border-l-4 border-primary pl-4 text-sm leading-relaxed text-foreground/90">
              "{t}"
            </blockquote>
          </article>
        ))}
      </div>
      <p className="mt-4 text-xs italic text-muted-foreground">
        Tips are illustrative. Always verify with the official scholarship office.
      </p>
    </section>
  );
}

/* ─────────────────── Who Can Apply ─────────────────── */

function WhoCanApply({ v }: { v: View }) {
  const gpaUS = v.minGpa ?? 3.5;
  return (
    <section className="rounded-md border border-border bg-white p-6">
      <div className="flex items-center gap-2">
        <Users className="h-5 w-5 text-primary" />
        <h2 className="font-heading text-2xl font-bold text-foreground">Eligibility</h2>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">GPA cross-map</h3>
          <dl className="mt-2 space-y-1.5 text-sm">
            <Row label="US 4.0 scale" value={`${gpaUS.toFixed(1)}+`} />
            <Row label="UK degree class" value={gpaUS >= 3.7 ? "First Class" : gpaUS >= 3.3 ? "2:1" : "2:2"} />
            <Row label="HSC (BD, 5.0)" value={`${Math.min(5, gpaUS * 1.25).toFixed(2)}+`} />
            <Row label="CBSE (India, %)" value={`${Math.round(gpaUS * 20)}%+`} />
            <Row label="SA (Matric, %)" value={`${Math.round(gpaUS * 18 + 10)}%+`} />
          </dl>
        </div>
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Eligible nationals</h3>
          <p className="mt-2 text-sm text-foreground/85">
            {v.eligibleCountries?.length
              ? v.eligibleCountries.slice(0, 12).join(", ")
              : "Open to applicants from most developing & partner countries — check the official portal for the exact list."}
          </p>
          <h3 className="mt-4 text-xs font-bold uppercase tracking-wide text-muted-foreground">Level</h3>
          <p className="mt-2 text-sm text-foreground/85 capitalize">{v.level}</p>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────── Common Errors ─────────────────── */

function CommonErrors() {
  const errors = [
    "Uploading transcripts that aren't officially attested (boards reject scanned copies).",
    "Generic SOP — selectors spot template language within 2 paragraphs.",
    "Asking recommenders too late (give them 4+ weeks and a brag-sheet).",
    "Mismatched name spelling across passport, transcript, and application.",
    "Submitting in the final 6 hours — portals crash under load.",
  ];
  return (
    <section className="mt-6 rounded-md border border-destructive/30 bg-destructive/5 p-6">
      <div className="flex items-center gap-2 text-destructive">
        <AlertCircle className="h-5 w-5" />
        <h3 className="font-heading text-lg font-bold">Common mistakes that get applicants rejected</h3>
      </div>
      <ul className="mt-3 space-y-2 text-sm text-foreground/90">
        {errors.map((e) => (
          <li key={e} className="flex items-start gap-2">
            <X className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            <span>{e}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ─────────────────── Recipient Tips (DB-backed) ─────────────────── */

function RecipientTips({ v }: { v: View }) {
  const { data: tips } = useQuery({
    queryKey: ["scholarship-tips", v.slug ?? v.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("scholarship_tips")
        .select("*")
        .eq("scholarship_slug", v.slug ?? "")
        .order("source_upvotes", { ascending: false })
        .limit(20);
      return data ?? [];
    },
  });

  if (tips && tips.length > 0) {
    return (
      <section>
        <header className="mb-5">
          <div className="flex items-center gap-2">
            <MessageSquareQuote className="h-5 w-5 text-primary" />
            <h2 className="font-heading text-2xl font-bold text-foreground">Tips from recipients</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            From {tips.length} community submission{tips.length > 1 ? "s" : ""} — Reddit, Quora, alumni networks.
          </p>
        </header>
        <div className="grid gap-4 md:grid-cols-2">
          {tips.map((t: any) => (
            <article key={t.id} className="rounded-md border border-border bg-white p-5">
              {t.tag && (
                <span className="mb-2 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
                  {t.tag}
                </span>
              )}
              <blockquote className="border-l-4 border-primary pl-4 text-sm leading-relaxed text-foreground/90">
                "{t.tip_text}"
              </blockquote>
              <div className="mt-2 text-[11px] text-muted-foreground">
                {t.source_platform ?? "Community"}
                {t.applicant_country && ` · ${t.applicant_country}`}
                {t.year_posted && ` · ${t.year_posted}`}
              </div>
            </article>
          ))}
        </div>
      </section>
    );
  }
  return <InsiderTips v={v} />;
}

/* ─────────────────── Success Stories ─────────────────── */

function SuccessStories({ v }: { v: View }) {
  const { data: stories } = useQuery({
    queryKey: ["scholarship-stories", v.slug ?? v.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("scholarship_success_stories")
        .select("*")
        .eq("scholarship_slug", v.slug ?? "")
        .order("year_awarded", { ascending: false })
        .limit(8);
      return data ?? [];
    },
  });

  return (
    <section>
      <header className="mb-5">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          <h2 className="font-heading text-2xl font-bold text-foreground">Success stories</h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Anonymised profiles of past recipients — see what actually got them in.
        </p>
      </header>
      {!stories || stories.length === 0 ? (
        <div className="rounded-md border border-dashed border-border bg-white p-10 text-center text-sm text-muted-foreground">
          No verified success stories indexed yet for this award. Check back after the next cycle.
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {stories.map((s: any) => (
            <article key={s.id} className="rounded-md border border-border bg-white p-5">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-heading text-base font-bold text-foreground">
                  Anonymous recipient · {s.applicant_country ?? "Unknown"}
                </h3>
                {s.year_awarded && (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                    {s.year_awarded}
                  </span>
                )}
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-2 border-y border-border py-3 text-xs">
                {s.major && <Row label="Major" value={s.major} />}
                {s.curriculum && <Row label="Curriculum" value={s.curriculum} />}
                {s.gpa_raw && <Row label="GPA" value={s.gpa_raw} />}
                {s.ielts_score && <Row label="IELTS" value={s.ielts_score} />}
              </dl>
              {s.eca_summary && (
                <p className="mt-3 text-xs italic text-muted-foreground">ECA: {s.eca_summary}</p>
              )}
              {s.story && <p className="mt-3 text-sm leading-relaxed text-foreground/90">{s.story}</p>}
              {s.tips_from_winner && (
                <p className="mt-3 rounded border-l-2 border-primary bg-primary/5 p-3 text-xs text-foreground/90">
                  <b>Their advice:</b> {s.tips_from_winner}
                </p>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

/* ─────────────────── Odds Calculator ─────────────────── */

function OddsCalculator({ v }: { v: View }) {
  const { user } = useAuth();
  const { data: profile } = useQuery({
    queryKey: ["profile-for-odds", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const [gpa, setGpa] = useState("");
  const [ielts, setIelts] = useState("");
  const [eca, setEca] = useState("3");

  useEffect(() => {
    if (profile) {
      if (profile.hsc_gpa) setGpa(String((profile.hsc_gpa / 5) * 4));
      if (profile.ielts) setIelts(String(profile.ielts));
    }
  }, [profile]);

  const target = v.minGpa ?? 3.5;
  const gpaN = parseFloat(gpa) || 0;
  const ieltsN = parseFloat(ielts) || 0;
  const ecaN = parseInt(eca, 10) || 0;

  // Simple weighted score (0-100)
  const gpaScore = Math.min(100, (gpaN / target) * 70);
  const ieltsScore = v.accepts_moi_waiver ? 80 : Math.min(100, (ieltsN / 7.5) * 100);
  const ecaScore = (ecaN / 5) * 100;
  const overall = Math.round(gpaScore * 0.55 + ieltsScore * 0.25 + ecaScore * 0.2);
  const clamped = Math.max(2, Math.min(95, overall));

  const verdict =
    clamped >= 75 ? { label: "Strong match", tone: "text-emerald-700 bg-emerald-50 border-emerald-200" }
    : clamped >= 50 ? { label: "Competitive", tone: "text-amber-700 bg-amber-50 border-amber-200" }
    : { label: "Stretch goal", tone: "text-destructive bg-destructive/5 border-destructive/30" };

  const improvements: string[] = [];
  if (gpaN < target) improvements.push(`Lift GPA to ${target.toFixed(1)}+ (you're at ${gpaN.toFixed(2)}). One strong semester can move the needle.`);
  if (!v.accepts_moi_waiver && ieltsN < 7) improvements.push(`Aim for IELTS 7.0+ overall, no band below 6.5. Worth $300 for the test re-take.`);
  if (ecaN < 4) improvements.push(`Add depth to 1-2 ECAs — long commitment beats scattered participation. Selectors look for a story.`);
  improvements.push(`Line up 2 recommenders 6 weeks early and brief them on this specific award.`);
  improvements.push(`Draft your SOP around a single thread: why this country, why now, why you.`);

  return (
    <section className="rounded-md border border-border bg-white p-6">
      <div className="flex items-center gap-2">
        <Calculator className="h-5 w-5 text-primary" />
        <h2 className="font-heading text-2xl font-bold text-foreground">Your odds</h2>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        {user ? "Pre-filled from your profile — adjust to model 'what if I improve' scenarios." : "Enter your stats to estimate matching probability."}
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div>
          <label className="text-xs font-semibold uppercase text-muted-foreground">GPA (US 4.0)</label>
          <Input type="number" step="0.01" value={gpa} onChange={(e) => setGpa(e.target.value)} placeholder="3.7" className="mt-1" />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase text-muted-foreground">IELTS</label>
          <Input type="number" step="0.1" value={ielts} onChange={(e) => setIelts(e.target.value)} placeholder="7.0" className="mt-1" disabled={v.accepts_moi_waiver} />
          {v.accepts_moi_waiver && <p className="mt-1 text-[10px] text-emerald-700">MOI accepted — IELTS skipped</p>}
        </div>
        <div>
          <label className="text-xs font-semibold uppercase text-muted-foreground">ECA depth (1-5)</label>
          <Input type="number" min="1" max="5" value={eca} onChange={(e) => setEca(e.target.value)} className="mt-1" />
        </div>
      </div>

      <div className="mt-6 rounded-md border border-border bg-neutral-50 p-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Match probability</div>
            <div className="font-heading text-5xl font-extrabold tabular-nums text-foreground">{clamped}%</div>
          </div>
          <span className={`rounded-full border px-3 py-1 text-xs font-bold ${verdict.tone}`}>{verdict.label}</span>
        </div>
        <Progress value={clamped} className="mt-3 h-2" />
      </div>

      <div className="mt-6">
        <h3 className="font-heading text-sm font-bold uppercase tracking-wide text-foreground">How to raise your odds</h3>
        <ul className="mt-3 space-y-2 text-sm text-foreground/90">
          {improvements.map((tip) => (
            <li key={tip} className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

// Force-include for the static list so tree-shaking doesn't drop the import
void SCHOLARSHIPS;

