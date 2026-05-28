import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { queryOptions, useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import React, { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { getUniDetail, submitTip } from "@/lib/uni-detail.functions";
import { hydrateUniversity } from "@/lib/hydrate-university.functions";
import { usToBd } from "@/lib/gpa";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useCompare } from "@/lib/compare-store";
import { loadEvalSummary, type EvalSummary } from "@/lib/evaluation-store";
import { requirementInStudentSystem, CURRICULUMS } from "@/lib/curriculum";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Heart, GitCompare, Share2, ExternalLink, ArrowLeft, MapPin, Calendar, GraduationCap, DollarSign, BookOpen, Lightbulb, Award, Search, ThumbsUp, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { SmartLogo } from "@/components/SmartLogo";
import { SmartCampusImage } from "@/components/SmartCampusImage";
import { TopoBackground } from "@/components/TopoBackground";

const detailQuery = (slug: string) => queryOptions({
  queryKey: ["uni-detail", slug],
  queryFn: () => getUniDetail({ data: { slug } }),
});

const SlugSearchSchema = z.object({
  name: z.string().optional(),
  country: z.string().optional(),
});

export const Route = createFileRoute("/universities/$slug")({
  validateSearch: (s) => SlugSearchSchema.parse(s),
  loader: async ({ params, context }) => {
    return await context.queryClient.ensureQueryData(detailQuery(params.slug));
  },
  head: ({ loaderData }) => ({
    meta: loaderData?.uni ? [
      { title: `${loaderData.uni.name} — Admissions, Tuition & Hacks | BeyondBorder` },
      { name: "description", content: `Complete guide to ${loaderData.uni.name}, ${loaderData.uni.country}: tuition, scholarships, deadlines, real student tips, and grade conversions for your curriculum.` },
      { property: "og:image", content: loaderData.uni.campus_image_url ?? "" },
    ] : [
      { title: "Loading university profile… | BeyondBorder" },
    ],
  }),
  component: UniDetailPage,
});

const TABS = ["Overview","Admissions","Tuition & Aid","Programs","Entrance Exams","How to Get In"] as const;

const HYDRATION_MESSAGES = [
  "Connecting to global registry...",
  "Extracting live 2026 tuition fees...",
  "Scraping community admission hacks...",
  "Finalizing institutional profile...",
];

function HydrationShimmer() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % HYDRATION_MESSAGES.length), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="min-h-screen bg-background pb-32">
      <div className="relative h-[420px] w-full overflow-hidden bg-gradient-to-br from-neutral-100 to-neutral-200">
        <div className="absolute inset-0 animate-pulse bg-[linear-gradient(110deg,transparent_35%,rgba(255,255,255,0.6)_50%,transparent_65%)] bg-[length:200%_100%]" />
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-6xl px-4 pb-8">
          <div className="flex items-end gap-5">
            <div className="h-20 w-20 animate-pulse rounded-lg bg-white/70 ring-4 ring-white" />
            <div className="flex-1">
              <div className="h-10 w-2/3 animate-pulse rounded bg-white/70" />
              <div className="mt-3 h-4 w-1/3 animate-pulse rounded bg-white/60" />
            </div>
          </div>
        </div>
      </div>
      <div className="mx-auto mt-10 max-w-2xl px-4 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 shadow-sm">
          <Sparkles className="h-4 w-4 animate-pulse text-primary" />
          <span key={idx} className="text-sm font-medium text-foreground transition-opacity duration-300">
            {HYDRATION_MESSAGES[idx]}
          </span>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">Building this profile live from public sources — usually 3–5 seconds.</p>
      </div>
      <div className="mx-auto mt-10 grid max-w-6xl gap-8 px-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card-surface p-6">
              <div className="h-5 w-1/3 animate-pulse rounded bg-neutral-200" />
              <div className="mt-4 h-3 w-full animate-pulse rounded bg-neutral-100" />
              <div className="mt-2 h-3 w-5/6 animate-pulse rounded bg-neutral-100" />
              <div className="mt-2 h-3 w-3/4 animate-pulse rounded bg-neutral-100" />
            </div>
          ))}
        </div>
        <div className="card-surface h-64 animate-pulse p-6" />
      </div>
    </div>
  );
}

function HydrationError({ message, slug }: { message: string; slug: string }) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center">
      <h1 className="font-heading text-3xl font-extrabold">Couldn't build this profile</h1>
      <p className="mt-2 text-muted-foreground">{message}</p>
      <p className="mt-1 text-xs text-muted-foreground">Slug: {slug}</p>
      <Button asChild className="mt-6"><Link to="/universities">← Browse all universities</Link></Button>
    </div>
  );
}

function UniDetailPage() {
  const { slug } = Route.useParams();
  const searchParams = Route.useSearch();
  const { data, refetch } = useSuspenseQuery(detailQuery(slug));
  const queryClient = useQueryClient();
  const hydrate = useServerFn(hydrateUniversity);
  const [hydrating, setHydrating] = useState(false);
  const [hydrationError, setHydrationError] = useState<string | null>(null);
  const [tab, setTab] = useState<typeof TABS[number]>("Overview");

  const needsHydration = !data.uni;

  useEffect(() => {
    if (!needsHydration || hydrating) return;
    let cancelled = false;
    setHydrating(true);
    setHydrationError(null);
    (async () => {
      try {
        const res = await hydrate({ data: { slug, name: searchParams.name, country: searchParams.country } });
        if (cancelled) return;
        if (!res.ok) {
          setHydrationError(res.error ?? "AI lookup failed.");
          setHydrating(false);
          return;
        }
        await queryClient.invalidateQueries({ queryKey: ["uni-detail", slug] });
        await refetch();
        setHydrating(false);
      } catch (e: any) {
        if (cancelled) return;
        setHydrationError(e?.message ?? "Network error.");
        setHydrating(false);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needsHydration, slug]);

  if (needsHydration) {
    if (hydrationError) return <HydrationError message={hydrationError} slug={slug} />;
    return <HydrationShimmer />;
  }

  const uni = data.uni!;

  return (
    <div className="pb-32">
      <Hero uni={uni} />
      <div className="sticky top-14 z-30 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-6xl overflow-x-auto px-4">
          <div className="flex gap-1">
            {TABS.map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition ${tab===t ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 lg:grid-cols-[1fr_320px]">
        <main className="min-w-0">
          {tab === "Overview" && <Overview uni={uni} />}
          {tab === "Admissions" && <Admissions uni={uni} />}
          {tab === "Tuition & Aid" && <Tuition uni={uni} />}
          {tab === "Programs" && <Programs uni={uni} />}
          {tab === "How to Get In" && <Tips uni={uni} tips={data.tips} />}
          {tab === "Entrance Exams" && <Exams uni={uni} />}
        </main>
        <Sidebar uni={uni} />
      </div>
    </div>
  );
}

function Hero({ uni }: { uni: any }) {
  return (
    <header className="relative h-[420px] min-h-[400px] w-full overflow-hidden">
      <TopoBackground />


      {/* Back link */}
      <div className="absolute inset-x-0 top-0 z-10 p-4">
        <Link to="/universities" className="inline-flex items-center gap-1 text-sm text-white/90 hover:text-white drop-shadow">
          <ArrowLeft className="h-4 w-4" /> All universities
        </Link>
      </div>

      {/* Bottom-anchored content */}
      <div className="relative z-10 mx-auto flex h-full max-w-6xl flex-col justify-end px-6 pb-8 md:px-12">
        <div className="flex flex-wrap items-end gap-5">
          <SmartLogo
            name={uni.name}
            logoUrl={uni.logo_url}
            website={uni.official_url}
            size={80}
            className="ring-4 ring-white shadow-2xl"
          />

          <div>
            <h1 className="text-4xl md:text-5xl font-serif font-bold !text-white drop-shadow-lg tracking-tight">
              {uni.name}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-lg !text-slate-200">
              {uni.country_flag && <span className="text-xl">{uni.country_flag}</span>}
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                {uni.city ? `${uni.city}, ` : ""}{uni.country}
              </span>
              {uni.qs_rank && (
                <span className="rounded-full bg-primary px-3 py-0.5 text-sm font-bold text-primary-foreground">
                  QS #{uni.qs_rank}
                </span>
              )}
              {uni.founded_year && <span className="text-sm text-slate-300">Founded {uni.founded_year}</span>}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

function Card({ title, icon: Icon, children }: any) {
  return (
    <section className="card-surface mb-6 p-6">
      <h2 className="mb-4 flex items-center gap-2 font-heading text-xl font-extrabold">
        {Icon && <Icon className="h-5 w-5 text-primary" />} {title}
      </h2>
      {children}
    </section>
  );
}

function Overview({ uni }: any) {
  const stats = [
    { label: "Acceptance Rate", value: uni.acceptance_rate },
    { label: "Total Students", value: uni.total_students },
    { label: "International %", value: uni.international_pct },
    { label: "Student:Faculty", value: uni.student_faculty_ratio },
  ];
  return (
    <>
      <Card title="About" icon={BookOpen}>
        <p className="leading-relaxed text-foreground/90">{uni.about}</p>
        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          {stats.map(s => (
            <div key={s.label} className="rounded-lg border border-border bg-secondary/40 p-3">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">{s.label}</div>
              <div className="mt-1 font-heading text-lg font-bold">{s.value || "—"}</div>
            </div>
          ))}
        </div>
      </Card>
      {uni.campus_life && (
        <Card title="Campus Life">
          <p className="leading-relaxed text-foreground/90">{uni.campus_life}</p>
        </Card>
      )}
      {uni.notable_alumni?.length > 0 && (
        <Card title="Notable Alumni" icon={Award}>
          <ul className="flex flex-wrap gap-2">
            {uni.notable_alumni.map((a: string) => <li key={a} className="rounded-full bg-secondary px-3 py-1 text-sm">{a}</li>)}
          </ul>
        </Card>
      )}
      {uni.subject_rankings?.length > 0 && (
        <Card title="Subject Rankings">
          <ul className="space-y-2">
            {uni.subject_rankings.map((r: any) => (
              <li key={r.subject} className="flex items-center justify-between rounded-md border border-border p-3">
                <span>{r.subject}</span>
                <span className="font-bold text-primary">#{r.rank} world</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
      {(uni.maps_query || uni.official_url) && (
        <Card title="Location">
          {uni.official_url && (
            <a href={uni.official_url} target="_blank" rel="noopener noreferrer" className="mb-3 inline-flex">
              <Button variant="outline" size="sm"><ExternalLink className="mr-2 h-3 w-3" /> Official Website</Button>
            </a>
          )}
          {uni.maps_query && (
            <div className="aspect-video overflow-hidden rounded-lg border border-border">
              <iframe
                title={`Map of ${uni.name}`}
                src={`https://www.google.com/maps?q=${encodeURIComponent(uni.maps_query)}&output=embed`}
                className="h-full w-full" loading="lazy"
              />
            </div>
          )}
        </Card>
      )}
    </>
  );
}

function GpaLine({ usGpa }: { usGpa: number }) {
  const bd = usToBd(usGpa);
  return <span className="text-xs text-muted-foreground">= BD HSC {bd.toFixed(2)}+ / 5.0</span>;
}

function StudentSystemLine({ usGpa, evalSum }: { usGpa: number; evalSum: EvalSummary }) {
  const inStudent = requirementInStudentSystem(usGpa, evalSum.curriculum);
  const ok = evalSum.converted.us4 >= usGpa;
  return (
    <span className={`ml-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${ok ? "bg-emerald-500/10 text-emerald-700 ring-emerald-500/30" : "bg-rose-500/10 text-rose-700 ring-rose-500/30"}`}>
      = {inStudent} in your {CURRICULUMS[evalSum.curriculum].scale} {ok ? "✓" : "✗"}
    </span>
  );
}

function YourScore({ ok, mine }: { ok: boolean; mine: string }) {
  return <span className={`ml-2 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${ok ? "bg-emerald-500/10 text-emerald-700 ring-emerald-500/30" : "bg-rose-500/10 text-rose-700 ring-rose-500/30"}`}>{mine} {ok ? "✓" : "✗"}</span>;
}

function Admissions({ uni }: any) {
  const r = uni.admission_reqs ?? {};
  const evalSum = useMemo(() => loadEvalSummary(), []);
  const ieltsOk = evalSum?.tests.ielts && r.ielts ? evalSum.tests.ielts >= r.ielts : null;
  const toeflOk = evalSum?.tests.toefl && r.toefl ? evalSum.tests.toefl >= r.toefl : null;
  const satOk = evalSum?.tests.sat && r.sat_min ? evalSum.tests.sat >= r.sat_min : null;
  const rows = [
    { label: "Minimum GPA (US 4.0 scale)", value: r.min_gpa_us ? `${r.min_gpa_us}` : "—", extra: r.min_gpa_us ? (<><GpaLine usGpa={r.min_gpa_us} />{evalSum && <StudentSystemLine usGpa={r.min_gpa_us} evalSum={evalSum} />}</>) : null },
    { label: "IELTS Academic", value: r.ielts ? `${r.ielts}+` : "—", extra: ieltsOk !== null ? <YourScore ok={ieltsOk} mine={`yours ${evalSum!.tests.ielts}`} /> : null },
    { label: "TOEFL iBT", value: r.toefl ? `${r.toefl}+` : "—", extra: toeflOk !== null ? <YourScore ok={toeflOk} mine={`yours ${evalSum!.tests.toefl}`} /> : null },
    { label: "SAT range", value: (r.sat_min && r.sat_max) ? `${r.sat_min} – ${r.sat_max}` : "—", extra: satOk !== null ? <YourScore ok={satOk} mine={`yours ${evalSum!.tests.sat}`} /> : null },
    { label: "ACT range", value: (r.act_min && r.act_max) ? `${r.act_min} – ${r.act_max}` : "—" },
    { label: "Language of Instruction", value: r.language ?? "—" },
  ];
  return (
    <>
      {evalSum && (
        <div className="card-surface mb-4 flex flex-wrap items-center justify-between gap-3 border-primary/30 bg-primary/5 p-4">
          <p className="text-sm">
            <b>Personalized for you:</b> Showing requirements in your <b>{CURRICULUMS[evalSum.curriculum].scale}</b> scale. Your grade: US {evalSum.converted.us4.toFixed(2)}/4.0.
          </p>
          <Link to="/evaluate" className="text-xs font-semibold text-primary hover:underline">Update profile →</Link>
        </div>
      )}
      {!evalSum && (
        <div className="card-surface mb-4 flex flex-wrap items-center justify-between gap-3 p-4">
          <p className="text-sm text-muted-foreground">See requirements in <b>your</b> grading system (HSC, A-Levels, Gaokao, IB…).</p>
          <Button asChild size="sm"><Link to="/evaluate">Evaluate my profile →</Link></Button>
        </div>
      )}
      <Card title="Requirements" icon={GraduationCap}>
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <tbody>
              {rows.map((row, i) => (
                <tr key={row.label} className={i%2 ? "bg-secondary/30" : ""}>
                  <td className="border-b border-border px-4 py-2.5 font-medium">{row.label}</td>
                  <td className="border-b border-border px-4 py-2.5">
                    <span className="font-semibold">{row.value}</span>
                    {row.extra && <span className="ml-2">{row.extra}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      {uni.deadlines?.length > 0 && (
        <Card title="Deadlines" icon={Calendar}>
          <div className="grid gap-3">
            {uni.deadlines.map((d: any, i: number) => {
              const dl = d.deadline ?? d.date;
              return (
                <div key={`${d.intake}-${i}`} className="rounded-lg border border-border p-4">
                  <div className="font-semibold">{d.intake ?? d.round ?? "Intake"}</div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    Apply by <span className="font-medium text-foreground">{dl ?? "TBA"}</span>
                    {d.decision && <> · Decision: {d.decision}</>}
                  </div>
                </div>
              );
            })}
          </div>
          {uni.processing_time && <p className="mt-3 text-xs text-muted-foreground">Avg. processing time: {uni.processing_time}</p>}
        </Card>
      )}
      <Card title="Application Process">
        <ol className="space-y-2 text-sm">
          {uni.application_steps?.map((s: string, i: number) => (
            <li key={i} className="flex gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{i+1}</span><span>{s}</span></li>
          ))}
        </ol>
      </Card>
      <Card title="Required Documents">
        <ul className="grid gap-2 md:grid-cols-2">
          {uni.required_docs?.map((d: string) => (
            <li key={d} className="flex items-start gap-2 text-sm"><input type="checkbox" className="mt-1 h-4 w-4 rounded border-border" /><span>{d}</span></li>
          ))}
        </ul>
        <Button asChild className="mt-5"><a href={uni.application_url} target="_blank" rel="noopener noreferrer"><ExternalLink className="mr-2 h-4 w-4" /> Go to Application Portal</a></Button>
      </Card>
    </>
  );
}

function Tuition({ uni }: any) {
  const t = uni.tuition ?? {};
  const yearly = t.per_year_usd ?? 0;
  const livingYearly = (uni.living_cost_monthly ?? 0) * 12;
  return (
    <>
      <Card title="Tuition" icon={DollarSign}>
        <div className="rounded-lg border border-border p-5">
          <div className="text-3xl font-extrabold">{t.display ?? "—"}</div>
          {t.per_semester && <div className="mt-1 text-sm text-muted-foreground">~{t.currency} {t.per_semester.toLocaleString()} / semester</div>}
        </div>
      </Card>
      <Card title="Living Costs">
        <div className="grid gap-3 md:grid-cols-3">
          <Stat label="Living / month" value={uni.living_cost_monthly ? `~$${uni.living_cost_monthly.toLocaleString()}` : "—"} />
          <Stat label="Living / year" value={livingYearly ? `~$${livingYearly.toLocaleString()}` : "—"} />
          <Stat label="Total CoA / year" value={(yearly||livingYearly) ? `~$${(yearly + livingYearly).toLocaleString()}` : "—"} highlight />
        </div>
        {uni.fee_waivers && <p className="mt-3 text-sm text-muted-foreground"><b>Fee waivers:</b> {uni.fee_waivers}</p>}
      </Card>
      <ScholarshipsByLevel scholarships={uni.scholarships ?? []} />
      {uni.financial_aid && <Card title="Financial Aid"><p className="text-sm">{uni.financial_aid}</p></Card>}
      {uni.work_permit && <Card title="Work Permit Rules"><p className="text-sm">{uni.work_permit}</p></Card>}
    </>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-lg border p-3 ${highlight ? "border-primary/40 bg-primary/5" : "border-border"}`}>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 font-heading text-lg font-bold">{value}</div>
    </div>
  );
}

function Programs({ uni }: any) {
  const [q, setQ] = useState("");
  const [faculty, setFaculty] = useState<string>("all");
  const programs = uni.programs_detail ?? [];
  const faculties = useMemo(() => Array.from(new Set(programs.map((p: any) => p.faculty))) as string[], [programs]);
  const filtered = programs.filter((p: any) =>
    (faculty === "all" || p.faculty === faculty) &&
    (q === "" || p.name.toLowerCase().includes(q.toLowerCase()))
  );
  const grouped = filtered.reduce((acc: any, p: any) => { (acc[p.faculty] ??= []).push(p); return acc; }, {});
  return (
    <Card title="Undergraduate Programs" icon={GraduationCap}>
      <div className="mb-4 flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search programs..." value={q} onChange={e => setQ(e.target.value)} className="pl-9" />
        </div>
        <Select value={faculty} onValueChange={setFaculty}>
          <SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All faculties</SelectItem>
            {faculties.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      {Object.entries(grouped).map(([fac, items]) => (
        <div key={fac} className="mb-5">
          <h3 className="mb-2 font-heading text-sm font-bold uppercase text-muted-foreground">{fac}</h3>
          <div className="grid gap-2">
            {(items as any[]).map(p => (
              <div key={p.name} className="rounded-lg border border-border p-3">
                <div className="font-semibold">{p.name}</div>
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span>⏱ {p.duration}</span>
                  <span>🗣 {p.language}</span>
                  <span>💰 {p.tuition}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
      {filtered.length === 0 && <p className="text-sm text-muted-foreground">No programs match.</p>}
    </Card>
  );
}

// Brand SVG logos for source platforms.
function RedditLogo({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} aria-hidden>
      <circle cx="10" cy="10" r="10" fill="#FF4500" />
      <path fill="#fff" d="M16.7 10.2a1.5 1.5 0 00-2.5-1.1c-1-.6-2.2-1-3.6-1.1l.7-2.3 2 .5a1 1 0 101-1.3l-2.5-.6a.3.3 0 00-.4.2l-.9 2.8c-1.4 0-2.7.5-3.7 1.2a1.5 1.5 0 10-1.7 2.5c0 .2-.1.3-.1.5 0 2.2 2.5 4 5.6 4s5.6-1.8 5.6-4l-.1-.5c.4-.3.6-.7.6-1.3zm-9.5.8a.9.9 0 111.8 0 .9.9 0 01-1.8 0zm5.5 2.7c-.7.7-2 .8-2.4.8s-1.7 0-2.4-.8a.3.3 0 010-.4.3.3 0 01.4 0c.4.5 1.4.6 2 .6s1.6-.1 2-.6a.3.3 0 01.4 0 .3.3 0 010 .4zm-.4-1.8a.9.9 0 110-1.8.9.9 0 010 1.8z" />
    </svg>
  );
}
function QuoraLogo({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} aria-hidden>
      <circle cx="10" cy="10" r="10" fill="#B92B27" />
      <path fill="#fff" d="M13.6 14.4c-.5-1-1.1-2-2.4-2-.3 0-.6 0-.8.2l-.5-1c1-.5 2.7-.9 4-.2.9-1 1.3-2.4 1.3-3.9 0-3-2.4-5.4-5.4-5.4S4.4 4.5 4.4 7.5s2.4 5.5 5.4 5.5h.4c.5 1.2 1.4 2.6 3.3 2.6.9 0 1.5-.3 2-.7l-1.9-.5zm-3.8-1.7c-2 0-2.9-2-2.9-5.1s.9-5.2 2.9-5.2 2.9 2 2.9 5.2c0 1.2-.1 2.2-.4 3-.5-.9-1.3-1.7-2.6-1.7-.4 0-.7 0-.9.2l.5 1c.1-.1.2-.1.4-.1.9 0 1.4 1 1.7 1.9-.5.5-1 .8-1.6.8z" />
    </svg>
  );
}
function YoutubeLogo({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <rect width="24" height="24" rx="4" fill="#FF0000" />
      <path fill="#fff" d="M10 8.5v7l6-3.5z" />
    </svg>
  );
}
function ForumLogo({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} aria-hidden>
      <circle cx="10" cy="10" r="10" fill="#3B82F6" />
      <path fill="#fff" d="M5 6h10v6H8l-3 3z" />
    </svg>
  );
}
function OfficialLogo({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} aria-hidden>
      <circle cx="10" cy="10" r="10" fill="#10B981" />
      <path fill="#fff" d="M8.5 13.5L5 10l1.4-1.4 2.1 2.1L13.6 5.6 15 7z" />
    </svg>
  );
}

const PLATFORMS: Record<string, { label: string; Logo: (p: { className?: string }) => React.ReactElement }> = {
  reddit:   { label: "Reddit",   Logo: RedditLogo },
  quora:    { label: "Quora",    Logo: QuoraLogo },
  youtube:  { label: "YouTube",  Logo: YoutubeLogo },
  forum:    { label: "Forum",    Logo: ForumLogo },
  official: { label: "Official", Logo: OfficialLogo },
};

const TAG_LABELS: Record<string, string> = {
  Academics: "Academics", ECA: "ECA", Scholarship: "Scholarship",
  Strategy: "Application", CampusLife: "Campus Life", FinancialAid: "Financial Aid", Visa: "Visa",
};
const TAGS = ["All", "Academics", "ECA", "Scholarship", "Strategy", "CampusLife", "FinancialAid"];

const COUNTRY_NAMES: Record<string, string> = {
  BD: "Bangladesh", IN: "India", PK: "Pakistan", LK: "Sri Lanka", NP: "Nepal",
  CN: "China", NG: "Nigeria", AE: "UAE", MY: "Malaysia",
};

function prettyDomain(url?: string) {
  if (!url) return "";
  try {
    const u = new URL(url);
    return (u.hostname + u.pathname).replace(/^www\./, "").replace(/\/$/, "");
  } catch { return url; }
}

function TipCard({ t }: { t: any }) {
  const p = PLATFORMS[t.source_platform] ?? PLATFORMS.forum;
  const [vote, setVote] = useState<"up" | "down" | null>(null);
  return (
    <div className="rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/40">
      <div className="flex items-start gap-3">
        <p.Logo className="mt-0.5 h-6 w-6 shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">{p.label}</span>
            {t.source_url && <>
              <span>·</span>
              <a href={t.source_url} target="_blank" rel="noopener noreferrer" className="truncate hover:text-primary hover:underline">
                {prettyDomain(t.source_url)}
              </a>
            </>}
          </div>
          <p className="text-sm leading-relaxed text-foreground">{t.tip_text}</p>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 font-semibold text-primary ring-1 ring-primary/20">
              {TAG_LABELS[t.tag] ?? t.tag}
            </span>
            {t.source_upvotes > 0 && (
              <span className="inline-flex items-center gap-1 text-muted-foreground">
                <ThumbsUp className="h-3 w-3" /> {t.source_upvotes.toLocaleString()} upvotes
              </span>
            )}
            {t.posted_at && <span className="text-muted-foreground">{new Date(t.posted_at).toLocaleDateString()}</span>}
            <div className="ml-auto flex items-center gap-1.5">
              <span className="text-muted-foreground">Helpful?</span>
              <button
                onClick={() => setVote(vote === "up" ? null : "up")}
                className={`rounded-md p-1 ring-1 transition ${vote === "up" ? "bg-emerald-500/15 text-emerald-700 ring-emerald-500/30" : "ring-border text-muted-foreground hover:text-foreground"}`}
                aria-label="Helpful"
              >👍</button>
              <button
                onClick={() => setVote(vote === "down" ? null : "down")}
                className={`rounded-md p-1 ring-1 transition ${vote === "down" ? "bg-rose-500/15 text-rose-700 ring-rose-500/30" : "ring-border text-muted-foreground hover:text-foreground"}`}
                aria-label="Not helpful"
              >👎</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Tips({ uni, tips }: any) {
  const [tag, setTag] = useState("All");
  const [platform, setPlatform] = useState<"all" | keyof typeof PLATFORMS>("all");
  const [sort, setSort] = useState<"upvoted" | "recent">("upvoted");
  const evalSum = useMemo(() => loadEvalSummary(), []);
  const homeCountry = evalSum?.country;
  const homeName = homeCountry ? COUNTRY_NAMES[homeCountry] : null;
  const [onlyMine, setOnlyMine] = useState(false);
  const { user } = useAuth();

  let filtered = tips as any[];
  if (tag !== "All") filtered = filtered.filter(t => t.tag === tag);
  if (platform !== "all") filtered = filtered.filter(t => t.source_platform === platform);
  if (onlyMine && homeName) {
    const needle = homeName.toLowerCase();
    filtered = filtered.filter(t =>
      t.tip_text?.toLowerCase().includes(needle) ||
      t.source_url?.toLowerCase().includes(needle.replace(/\s+/g, ""))
    );
  }
  filtered = [...filtered].sort((a, b) => sort === "upvoted"
    ? (b.source_upvotes ?? 0) - (a.source_upvotes ?? 0)
    : new Date(b.posted_at ?? b.created_at).getTime() - new Date(a.posted_at ?? a.created_at).getTime()
  );

  return (
    <Card title="Real tips from students and communities 🎯" icon={Lightbulb}>
      <p className="mb-4 text-sm text-muted-foreground">Sourced from Reddit, Quora, YouTube and college forums.</p>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        {TAGS.map(t => (
          <button key={t} onClick={() => setTag(t)}
            className={`rounded-full px-3 py-1 text-xs font-medium ring-1 ${tag === t ? "bg-primary text-primary-foreground ring-primary" : "bg-secondary text-foreground ring-border hover:border-primary/40"}`}>
            {t === "All" ? "All" : (TAG_LABELS[t] ?? t)}
          </button>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2 border-t border-border pt-3">
        <span className="text-xs uppercase tracking-wide text-muted-foreground">Platform</span>
        {(["all", "reddit", "quora", "youtube", "forum"] as const).map(pk => {
          const Logo = pk !== "all" ? PLATFORMS[pk].Logo : null;
          return (
            <button key={pk} onClick={() => setPlatform(pk)}
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${platform === pk ? "bg-primary text-primary-foreground ring-primary" : "bg-secondary text-foreground ring-border hover:border-primary/40"}`}>
              {Logo && <Logo className="h-3.5 w-3.5" />}
              {pk === "all" ? "All sources" : PLATFORMS[pk].label}
            </button>
          );
        })}

        <span className="ml-auto text-xs uppercase tracking-wide text-muted-foreground">Sort</span>
        <Select value={sort} onValueChange={(v) => setSort(v as any)}>
          <SelectTrigger className="h-8 w-[170px] text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="upvoted">Most upvoted</SelectItem>
            <SelectItem value="recent">Most recent</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {homeName && (
          <button onClick={() => setOnlyMine(v => !v)}
            className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${onlyMine ? "bg-emerald-600 text-white ring-emerald-600" : "bg-emerald-500/10 text-emerald-700 ring-emerald-500/30"}`}>
            🌍 Mentioning {homeName}
          </button>
        )}
        <SubmitTip uniSlug={uni.slug} disabled={!user} />
      </div>

      <div className="grid gap-3">
        {filtered.map((t: any) => <TipCard key={t.id} t={t} />)}
        {filtered.length === 0 && (
          <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No tips match these filters yet. Try removing one.
          </p>
        )}
      </div>

      <p className="mt-4 text-xs italic text-muted-foreground">
        Tips are sourced from public community posts and student experiences. Always verify important information with official university sources.
      </p>
    </Card>
  );
}

function SubmitTip({ uniSlug, disabled }: { uniSlug: string; disabled: boolean }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [platform, setPlatform] = useState("reddit");
  const [tag, setTag] = useState("Strategy");
  const [busy, setBusy] = useState(false);
  const submit = useServerFn(submitTip);
  const onSubmit = async () => {
    setBusy(true);
    try {
      const res = await submit({ data: { uni_slug: uniSlug, tip_text: text, source_url: url, source_platform: platform as any, tag: tag as any } });
      if (res.ok) { toast.success("Thanks! Your tip will appear after review."); setOpen(false); setText(""); setUrl(""); }
      else toast.error(res.error ?? "Failed");
    } catch (e: any) { toast.error(e?.message ?? "Failed"); }
    finally { setBusy(false); }
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" disabled={disabled} title={disabled ? "Log in to submit" : ""}>+ Submit a tip</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Share a tip</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Textarea placeholder="Paste the tip (20-1000 chars)" value={text} onChange={e => setText(e.target.value)} rows={4} />
          <Input placeholder="Source URL (https://...)" value={url} onChange={e => setUrl(e.target.value)} />
          <div className="grid grid-cols-2 gap-2">
            <Select value={platform} onValueChange={setPlatform}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{Object.keys(PLATFORMS).map(p => <SelectItem key={p} value={p}>{PLATFORMS[p].label}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={tag} onValueChange={setTag}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{TAGS.slice(1).map(t => <SelectItem key={t} value={t}>{TAG_LABELS[t] ?? t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onSubmit} disabled={busy || text.length < 20 || !url.startsWith("http")}>Submit for review</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function inferScholarshipLevel(s: any): "undergraduate" | "postgraduate" | "phd" | "all" {
  if (s.level) {
    const v = String(s.level).toLowerCase();
    if (v.includes("phd") || v.includes("doctor")) return "phd";
    if (v.includes("master") || v.includes("post") || v.includes("graduate") && !v.includes("under")) return "postgraduate";
    if (v.includes("under") || v.includes("bachelor")) return "undergraduate";
    if (v.includes("all")) return "all";
  }
  const blob = `${s.name ?? ""} ${s.eligibility ?? ""} ${s.description ?? ""}`.toLowerCase();
  if (/phd|doctoral|doctorate/.test(blob)) return "phd";
  if (/master|msc|m\.s\.|mba|graduate|postgrad/.test(blob)) return "postgraduate";
  if (/undergrad|bachelor|b\.sc|b\.a\.|bsc|ba\b/.test(blob)) return "undergraduate";
  return "all";
}

const LEVEL_BADGE_DETAIL: Record<string, { label: string; cls: string }> = {
  undergraduate: { label: "Bachelor's", cls: "bg-emerald-500/15 text-emerald-700 ring-emerald-500/30 dark:text-emerald-300" },
  postgraduate:  { label: "Master's",   cls: "bg-blue-500/15 text-blue-700 ring-blue-500/30 dark:text-blue-300" },
  phd:           { label: "PhD",        cls: "bg-purple-500/15 text-purple-700 ring-purple-500/30 dark:text-purple-300" },
  all:           { label: "All levels", cls: "bg-amber-500/15 text-amber-700 ring-amber-500/30 dark:text-amber-300" },
};

function ScholarshipsByLevel({ scholarships }: { scholarships: any[] }) {
  const [lvl, setLvl] = useState<"undergraduate" | "postgraduate" | "phd" | "all" | "any">("undergraduate");
  const enriched = useMemo(() => scholarships.map((s) => ({ ...s, _level: inferScholarshipLevel(s) })), [scholarships]);
  const filtered = enriched.filter((s) => lvl === "any" || s._level === lvl || s._level === "all");
  const tabs: { v: typeof lvl; label: string }[] = [
    { v: "undergraduate", label: "Undergraduate" },
    { v: "postgraduate",  label: "Master's" },
    { v: "phd",           label: "PhD" },
    { v: "any",           label: "All" },
  ];
  if (scholarships.length === 0) return null;
  return (
    <Card title="Scholarships" icon={Award}>
      <div className="mb-4 inline-flex flex-wrap rounded-lg border border-border bg-card p-1 text-sm">
        {tabs.map((t) => (
          <button key={t.v} onClick={() => setLvl(t.v)}
            className={`rounded-md px-3 py-1.5 ${lvl === t.v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
            {t.label}
          </button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">No scholarships listed for this level. Try <b>All</b>.</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {filtered.map((s: any) => {
            const b = LEVEL_BADGE_DETAIL[s._level];
            return (
              <div key={s.name} className="rounded-lg border border-border p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="font-heading font-bold">{s.name}</div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${b.cls}`}>{b.label}</span>
                </div>
                <div className="mt-1 text-primary font-semibold">{s.amount}</div>
                <p className="mt-2 text-sm text-muted-foreground">{s.eligibility}</p>
                {s.deadline && <div className="mt-2 text-xs">Deadline: <b>{s.deadline}</b></div>}
                {s.url && <a href={s.url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-sm text-primary hover:underline">Apply <ExternalLink className="h-3 w-3" /></a>}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

// ===== Reference library for entrance exams =====
type ExamRef = {
  fullName: string;
  whatItTests: string;
  validity: string;
  maxScore?: string;
  registerUrl: string;
  officialPrep: { label: string; url: string };
  khan?: string;
  youtube: { name: string; subs: string; url: string }[];
  books: { title: string; author: string }[];
  prepTime: string;
  sampleQs: { q: string; a: string }[];
};

const EXAM_LIB: Record<string, ExamRef> = {
  SAT: {
    fullName: "Scholastic Assessment Test",
    whatItTests: "College-readiness test covering Reading, Writing & Language, and Math. Used by most US universities and many globally for undergraduate admission.",
    validity: "Scores valid for 5 years",
    maxScore: "1600",
    registerUrl: "https://satsuite.collegeboard.org/sat/registration",
    officialPrep: { label: "College Board / Bluebook", url: "https://satsuite.collegeboard.org/sat/preparation" },
    khan: "https://www.khanacademy.org/digital-sat",
    youtube: [
      { name: "SupertutorTV", subs: "300K+", url: "https://www.youtube.com/@SupertutorTV" },
      { name: "Scalar Learning", subs: "210K+", url: "https://www.youtube.com/@ScalarLearning" },
      { name: "TestPrep with Mr. Mike", subs: "120K+", url: "https://www.youtube.com/@MikeTestPrep" },
    ],
    books: [
      { title: "The Official SAT Study Guide", author: "College Board" },
      { title: "Erica Meltzer's Critical Reading", author: "Erica Meltzer" },
      { title: "PWN the SAT: Math Guide", author: "Mike McClenathan" },
    ],
    prepTime: "~3–6 months at 8–10 hrs/week to reach 1500+",
    sampleQs: [
      { q: "Math: If 3x − 7 = 2x + 5, what is x?", a: "x = 12" },
      { q: "Reading: 'The author's tone in lines 12–18 can best be described as…' (choose: A) skeptical B) reverent C) detached D) ironic", a: "A — skeptical (author questions the conclusion)" },
    ],
  },
  ACT: {
    fullName: "American College Testing",
    whatItTests: "US college-admission test covering English, Math, Reading, Science, and an optional essay. Accepted equivalently to the SAT.",
    validity: "Scores valid for 5 years",
    maxScore: "36",
    registerUrl: "https://www.act.org/content/act/en/products-and-services/the-act/registration.html",
    officialPrep: { label: "ACT Academy", url: "https://academy.act.org/" },
    khan: "https://www.khanacademy.org/test-prep",
    youtube: [
      { name: "SupertutorTV", subs: "300K+", url: "https://www.youtube.com/@SupertutorTV" },
      { name: "Magoosh", subs: "180K+", url: "https://www.youtube.com/@Magoosh" },
      { name: "PrepScholar", subs: "60K+", url: "https://www.youtube.com/@PrepScholarSATACT" },
    ],
    books: [
      { title: "The Official ACT Prep Guide", author: "ACT Inc." },
      { title: "For the Love of ACT Science", author: "Michael Cerro" },
      { title: "Ultimate Guide to the Math ACT", author: "Richard F. Corn" },
    ],
    prepTime: "~3 months at 6–8 hrs/week to reach 33+",
    sampleQs: [
      { q: "English: 'Their going to the museum tomorrow.' Choose the correct form.", a: "They're going (contraction of 'they are')" },
      { q: "Math: What is the slope of the line through (2, 3) and (5, 11)?", a: "(11−3)/(5−2) = 8/3" },
    ],
  },
  TOEFL: {
    fullName: "Test of English as a Foreign Language",
    whatItTests: "English proficiency for academic settings: Reading, Listening, Speaking, Writing. Required by most US/Canadian universities for non-native English speakers.",
    validity: "Scores valid for 2 years",
    maxScore: "120",
    registerUrl: "https://www.ets.org/toefl/test-takers/ibt/register.html",
    officialPrep: { label: "ETS TOEFL Prep", url: "https://www.ets.org/toefl/test-takers/ibt/prepare.html" },
    youtube: [
      { name: "TST Prep", subs: "270K+", url: "https://www.youtube.com/@TSTPrepTOEFL" },
      { name: "NoteFull TOEFL Mastery", subs: "330K+", url: "https://www.youtube.com/@NoteFullTOEFLMastery" },
      { name: "TOEFL TV (Official ETS)", subs: "190K+", url: "https://www.youtube.com/@TOEFLtv" },
    ],
    books: [
      { title: "Official Guide to the TOEFL iBT", author: "ETS" },
      { title: "TOEFL iBT Prep Plus", author: "Kaplan" },
      { title: "Barron's TOEFL iBT", author: "Pamela J. Sharpe" },
    ],
    prepTime: "~6–10 weeks at 8 hrs/week to reach 100+",
    sampleQs: [
      { q: "Reading inference: 'Despite the storm, the ship reached port on time.' What can be inferred?", a: "The ship overcame difficult conditions to stay on schedule." },
      { q: "Speaking: Describe a place you would like to visit and why (45 sec).", a: "Model answer covers: place, 2 specific reasons, a personal hook." },
    ],
  },
  IELTS: {
    fullName: "International English Language Testing System",
    whatItTests: "English proficiency in Listening, Reading, Writing, Speaking. Accepted by UK, Australia, Canada, NZ, and most universities worldwide.",
    validity: "Scores valid for 2 years",
    maxScore: "9.0",
    registerUrl: "https://www.ielts.org/book-a-test",
    officialPrep: { label: "IELTS.org Free Practice", url: "https://www.ielts.org/for-test-takers/sample-test-questions" },
    youtube: [
      { name: "IELTS Liz", subs: "1.6M+", url: "https://www.youtube.com/@ieltsliz" },
      { name: "IELTS Advantage", subs: "550K+", url: "https://www.youtube.com/@IELTSAdvantage" },
      { name: "E2 IELTS", subs: "780K+", url: "https://www.youtube.com/@e2ielts" },
    ],
    books: [
      { title: "Cambridge IELTS 18 (Academic)", author: "Cambridge UP" },
      { title: "The Official Cambridge Guide to IELTS", author: "Cambridge UP" },
      { title: "Barron's IELTS Superpack", author: "Lin Lougheed" },
    ],
    prepTime: "~6–8 weeks at 6–8 hrs/week to reach 7.0+",
    sampleQs: [
      { q: "Writing Task 1: The chart shows electricity production by source in 2010 vs 2020. Summarise (150 words).", a: "Open with overview, group similar sources, compare biggest change, end with one notable trend." },
      { q: "Speaking Part 2: Describe a book that influenced you (1–2 min).", a: "Cover: which book, when read, why it influenced you, one specific example." },
    ],
  },
  Duolingo: {
    fullName: "Duolingo English Test",
    whatItTests: "Adaptive online English test covering literacy, comprehension, conversation, and production. Accepted by 5,000+ universities including most US/UK schools.",
    validity: "Scores valid for 2 years",
    maxScore: "160",
    registerUrl: "https://englishtest.duolingo.com/applicants",
    officialPrep: { label: "Duolingo English Test Prep", url: "https://englishtest.duolingo.com/preparation" },
    youtube: [
      { name: "Duolingo English Test", subs: "120K+", url: "https://www.youtube.com/@DuolingoEnglishTest" },
      { name: "Teacher Luke DET", subs: "60K+", url: "https://www.youtube.com/results?search_query=teacher+luke+det" },
      { name: "ArguingWithAaron", subs: "40K+", url: "https://www.youtube.com/@ArguingWithAaron" },
    ],
    books: [
      { title: "DET Ready: The Complete Guide", author: "Arizio Sweeting" },
      { title: "Master the Duolingo English Test", author: "TST Prep" },
      { title: "The Duolingo Practice Book", author: "Self-published — community" },
    ],
    prepTime: "~3–4 weeks at 5 hrs/week to reach 120+",
    sampleQs: [
      { q: "Read & Complete: 'Cli__te ch__ge is one of the b__gest ch__lenges f__cing humanity.' Fill blanks.", a: "Climate change is one of the biggest challenges facing humanity." },
      { q: "Speaking sample (30s): 'Describe your hometown.'", a: "Open with location, 2 unique features, end with personal feeling." },
    ],
  },
  GRE: {
    fullName: "Graduate Record Examinations",
    whatItTests: "Graduate-school admissions test: Verbal Reasoning, Quantitative Reasoning, Analytical Writing. Required by many US master's and PhD programs.",
    validity: "Scores valid for 5 years",
    maxScore: "340 (V+Q) + 6.0 AWA",
    registerUrl: "https://www.ets.org/gre/test-takers/general-test/register.html",
    officialPrep: { label: "ETS POWERPREP", url: "https://www.ets.org/gre/test-takers/general-test/prepare.html" },
    youtube: [
      { name: "Gregmat", subs: "150K+", url: "https://www.youtube.com/@gregmat" },
      { name: "Magoosh GRE", subs: "180K+", url: "https://www.youtube.com/@Magoosh" },
      { name: "Manhattan Prep", subs: "70K+", url: "https://www.youtube.com/@ManhattanPrep" },
    ],
    books: [
      { title: "Official GRE Super Power Pack", author: "ETS" },
      { title: "Manhattan Prep GRE 5 lb Book", author: "Manhattan Prep" },
      { title: "GRE Vocabulary Flashcards", author: "Magoosh" },
    ],
    prepTime: "~2–4 months at 10 hrs/week to reach 325+",
    sampleQs: [
      { q: "Quant: If x² = 36, what are all possible values of x?", a: "x = 6 or x = −6" },
      { q: "Verbal: Choose 2 words for: 'Her argument was so ____ that few could find any flaw in it.' (cogent, fallacious, persuasive, tenuous, irrefutable, weak)", a: "cogent, irrefutable" },
    ],
  },
  GMAT: {
    fullName: "Graduate Management Admission Test",
    whatItTests: "Business school admissions test (MBA): Quantitative, Verbal, Data Insights. Adaptive computer test required by most top MBA programs.",
    validity: "Scores valid for 5 years",
    maxScore: "805 (GMAT Focus)",
    registerUrl: "https://www.mba.com/exams/gmat-exam/register",
    officialPrep: { label: "Official mba.com GMAT Prep", url: "https://www.mba.com/exams/gmat-exam/prepare" },
    youtube: [
      { name: "GMAT Ninja", subs: "85K+", url: "https://www.youtube.com/@GMATNinjaTutoring" },
      { name: "TTP GMAT", subs: "40K+", url: "https://www.youtube.com/@TargetTestPrepGMAT" },
      { name: "ExperT's Global", subs: "120K+", url: "https://www.youtube.com/@ExpertsGlobalMBA" },
    ],
    books: [
      { title: "The Official Guide for GMAT", author: "GMAC" },
      { title: "Manhattan Prep GMAT All-the-Quant", author: "Manhattan Prep" },
      { title: "PowerScore GMAT Critical Reasoning Bible", author: "David M. Killoran" },
    ],
    prepTime: "~3–5 months at 10–12 hrs/week to reach 700+",
    sampleQs: [
      { q: "Quant: A train travels 240km in 3 hours. What is its average speed in km/h?", a: "80 km/h" },
      { q: "Critical Reasoning: Identify the assumption in: 'Coffee improves productivity. So companies should provide free coffee.'", a: "That free coffee will be consumed enough to improve productivity (and that productivity is the company's goal)." },
    ],
  },
};

function statusFor(required: number | undefined, mine: number | undefined): { txt: string; cls: string } | null {
  if (!required || !mine) return null;
  if (mine >= required) return { txt: "✓ Competitive", cls: "text-emerald-600" };
  return { txt: "✗ Below requirement", cls: "text-rose-600" };
}

function buildUniExamList(uni: any): { key: string; req?: string; avg?: string; reqNum?: number }[] {
  const r = uni.admission_reqs ?? {};
  const list: { key: string; req?: string; avg?: string; reqNum?: number }[] = [];
  if (r.sat_min || r.sat) list.push({ key: "SAT", req: `${r.sat_min ?? r.sat}+`, avg: r.sat_avg ? String(r.sat_avg) : undefined, reqNum: Number(r.sat_min ?? r.sat) });
  if (r.act_min || r.act) list.push({ key: "ACT", req: `${r.act_min ?? r.act}+`, avg: r.act_avg ? String(r.act_avg) : undefined, reqNum: Number(r.act_min ?? r.act) });
  if (r.toefl) list.push({ key: "TOEFL", req: `${r.toefl}+`, reqNum: Number(r.toefl) });
  if (r.ielts) list.push({ key: "IELTS", req: `${r.ielts}+`, reqNum: Number(r.ielts) });
  if (r.duolingo) list.push({ key: "Duolingo", req: `${r.duolingo}+`, reqNum: Number(r.duolingo) });
  if (r.gre) list.push({ key: "GRE", req: `${r.gre}+`, reqNum: Number(r.gre) });
  if (r.gmat) list.push({ key: "GMAT", req: `${r.gmat}+`, reqNum: Number(r.gmat) });
  // also fold any uni.exams entries that aren't already covered
  (uni.exams ?? []).forEach((e: any) => {
    const k = Object.keys(EXAM_LIB).find((x) => x.toLowerCase() === String(e.name ?? "").toLowerCase());
    if (k && !list.find((l) => l.key === k)) list.push({ key: k, req: e.score_req });
  });
  // Fallback — at minimum show TOEFL + IELTS if international students apply
  if (list.length === 0) {
    list.push({ key: "TOEFL" }, { key: "IELTS" });
  }
  return list;
}

function Exams({ uni }: any) {
  const evalSum = useMemo(() => loadEvalSummary(), []);
  const exams = buildUniExamList(uni);
  const myScores: Record<string, number | undefined> = {
    SAT: evalSum?.tests.sat,
    TOEFL: evalSum?.tests.toefl,
    IELTS: evalSum?.tests.ielts,
  };

  // For universities with bespoke entrance exams (passed via uni.exams with sample_url / syllabus)
  const bespoke = (uni.exams ?? []).filter((e: any) => !EXAM_LIB[String(e.name).toUpperCase()]);

  return (
    <>
      <Card title="Entrance exams accepted at this university" icon={BookOpen}>
        <p className="text-sm text-muted-foreground">
          Each card shows {uni.name}'s requirement, average admitted score, official prep, top YouTube channels, recommended books, and sample questions.
        </p>
      </Card>

      {exams.map((row) => {
        const ref = EXAM_LIB[row.key];
        if (!ref) return null;
        const mine = myScores[row.key];
        const status = statusFor(row.reqNum, mine);
        return (
          <Card key={row.key} title={`${row.key} — ${ref.fullName}`} icon={BookOpen}>
            <p className="text-sm">{ref.whatItTests}</p>

            {/* Score requirement block */}
            <div className="mt-4 grid gap-3 md:grid-cols-4">
              <Stat label="Required" value={row.req ?? "Recommended"} highlight />
              <Stat label="Avg admitted" value={row.avg ?? "—"} />
              <Stat label="Your score" value={mine != null ? String(mine) : "Sign in / Evaluate"} />
              <div className="rounded-lg border border-border p-3">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Status</div>
                <div className={`mt-1 font-heading text-lg font-bold ${status?.cls ?? "text-muted-foreground"}`}>
                  {status?.txt ?? "Add your score"}
                </div>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span>Validity: <b className="text-foreground">{ref.validity}</b></span>
              {ref.maxScore && <span>· Max score: <b className="text-foreground">{ref.maxScore}</b></span>}
              <span>· Est. prep: <b className="text-foreground">{ref.prepTime}</b></span>
            </div>

            {/* Prep resources */}
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <div className="rounded-lg border border-border p-4">
                <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Official prep</div>
                <a href={ref.officialPrep.url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
                  {ref.officialPrep.label} <ExternalLink className="h-3 w-3" />
                </a>
                {ref.khan && (
                  <div className="mt-2">
                    <a href={ref.khan} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
                      Khan Academy (free) <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
                <a href={ref.registerUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block">
                  <Button size="sm"><ExternalLink className="mr-1 h-3 w-3" /> Register for {row.key}</Button>
                </a>
              </div>

              <div className="rounded-lg border border-border p-4">
                <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Top YouTube channels</div>
                <ul className="mt-2 space-y-1.5 text-sm">
                  {ref.youtube.map((y) => (
                    <li key={y.url} className="flex items-center justify-between gap-2">
                      <a href={y.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{y.name}</a>
                      <span className="text-xs text-muted-foreground">{y.subs}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-3 rounded-lg border border-border p-4">
              <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Recommended books</div>
              <ul className="mt-2 grid gap-1 text-sm md:grid-cols-3">
                {ref.books.map((b) => (
                  <li key={b.title} className="rounded border border-border bg-secondary/40 p-2">
                    <div className="font-semibold">{b.title}</div>
                    <div className="text-xs text-muted-foreground">{b.author}</div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Sample questions */}
            <div className="mt-3 rounded-lg border border-border bg-secondary/30 p-4">
              <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Sample questions</div>
              <div className="mt-2 space-y-3 text-sm">
                {ref.sampleQs.map((s, i) => (
                  <details key={i} className="rounded border border-border bg-background p-2">
                    <summary className="cursor-pointer font-semibold">{s.q}</summary>
                    <div className="mt-2 text-foreground/80"><b>Answer:</b> {s.a}</div>
                  </details>
                ))}
              </div>
            </div>
          </Card>
        );
      })}

      {/* University-specific entrance exams */}
      {bespoke.map((e: any) => (
        <Card key={e.name} title={`${e.name} — ${uni.name} entrance exam`} icon={BookOpen}>
          {e.what_it_tests && <p className="text-sm">{e.what_it_tests}</p>}
          {e.score_req && (
            <div className="mt-3"><span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary ring-1 ring-primary/30">Required: {e.score_req}</span></div>
          )}
          {e.syllabus && (
            <div className="mt-4">
              <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Syllabus breakdown</div>
              <ul className="mt-2 space-y-1 text-sm">
                {e.syllabus.map((s: any) => (
                  <li key={s.topic} className="flex justify-between rounded border border-border p-2">
                    <span>{s.topic}</span><span className="font-semibold">{s.weight}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            {e.sample_url && <a href={e.sample_url} target="_blank" rel="noopener noreferrer"><Button size="sm" variant="outline">Sample paper</Button></a>}
            {e.past_papers_url && <a href={e.past_papers_url} target="_blank" rel="noopener noreferrer"><Button size="sm" variant="outline">Past papers</Button></a>}
            {e.register_url && <a href={e.register_url} target="_blank" rel="noopener noreferrer"><Button size="sm"><ExternalLink className="mr-1 h-3 w-3" /> Register</Button></a>}
          </div>
        </Card>
      ))}
    </>
  );
}

function Sidebar({ uni }: any) {
  const { user } = useAuth();
  const { add, has } = useCompare();
  const inCompare = has(uni.slug);
  const save = async () => {
    if (!user) return toast.error("Log in to save");
    const { error } = await supabase.from("shortlist").insert({
      user_id: user.id, item_type: "university", item_id: uni.slug, item_name: uni.name, item_data: uni as any,
    });
    if (error) toast.error(error.code === "23505" ? "Already saved" : error.message);
    else toast.success(`Saved ${uni.name}`);
  };
  const addCmp = () => {
    if (inCompare) return toast.info("Already in compare");
    const ok = add({
      slug: uni.slug,
      name: uni.name,
      country: uni.country,
      countryFlag: uni.country_flag,
      qsRank: uni.qs_rank,
      logoUrl: uni.logo_url,
      imageUrl: uni.campus_image_url,
    });
    if (!ok) toast.error("Compare full (max 3)");
    else toast.success("Added to compare");
  };

  const share = async () => {
    try { await navigator.share({ title: uni.name, url: window.location.href }); }
    catch { await navigator.clipboard.writeText(window.location.href); toast.success("Link copied"); }
  };
  const nextDeadline = (uni.deadlines ?? []).find((d: any) => {
    const v = d.deadline ?? d.date;
    return v && !isNaN(new Date(v).getTime());
  }) ?? uni.deadlines?.[0];
  const evalSum = useMemo(() => loadEvalSummary(), []);
  return (
    <aside className="lg:sticky lg:top-32 lg:self-start">
      <div className="card-surface space-y-4 p-5">
        {evalSum ? <EvalMatchRing uni={uni} evalSum={evalSum} /> : user ? <MatchRing uni={uni} /> : (
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Get your match score in 2 minutes</div>
            <Button asChild className="mt-2 w-full bg-primary text-primary-foreground"><Link to="/evaluate">✨ Evaluate my profile</Link></Button>
          </div>
        )}
        <div className="grid grid-cols-3 gap-2">
          <Button variant="outline" size="sm" onClick={save}><Heart className="h-4 w-4" /></Button>
          <Button variant="outline" size="sm" onClick={addCmp} disabled={inCompare}><GitCompare className="h-4 w-4" /></Button>
          <Button variant="outline" size="sm" onClick={share}><Share2 className="h-4 w-4" /></Button>
        </div>
        {nextDeadline && <Countdown deadline={nextDeadline.deadline ?? nextDeadline.date} intake={nextDeadline.intake ?? nextDeadline.round ?? "Next intake"} />}
        {uni.application_url && <Button asChild className="w-full bg-primary text-primary-foreground"><a href={uni.application_url} target="_blank" rel="noopener noreferrer">Apply now <ExternalLink className="ml-2 h-3 w-3" /></a></Button>}
      </div>
    </aside>
  );
}

function EvalMatchRing({ uni, evalSum }: { uni: any; evalSum: EvalSummary }) {
  const r = uni.admission_reqs ?? {};
  let s = 50;
  if (r.min_gpa_us) s += (evalSum.converted.us4 - r.min_gpa_us) * 25;
  if (r.ielts && evalSum.tests.ielts) s += (evalSum.tests.ielts - r.ielts) * 10;
  if (r.sat_min && evalSum.tests.sat) s += (evalSum.tests.sat - r.sat_min) / 12;
  if (evalSum.targetCountries.length && evalSum.targetCountries.some(c => uni.country?.toLowerCase().includes(c.toLowerCase()))) s += 8;
  const score = Math.max(5, Math.min(99, Math.round(s)));
  const color = score >= 75 ? "text-emerald-600" : score >= 50 ? "text-amber-600" : "text-rose-600";
  return (
    <div className="text-center">
      <div className={`font-heading text-5xl font-extrabold ${color}`}>{score}%</div>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">Your match</div>
      <Link to="/evaluate" className="mt-1 inline-block text-[11px] text-primary hover:underline">based on your evaluation · update</Link>
    </div>
  );
}

function MatchRing({ uni }: any) {
  const { user } = useAuth();
  const [score, setScore] = useState<number | null>(null);
  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("hsc_gpa, ielts, toefl, sat, countries").eq("id", user.id).maybeSingle().then(({ data }) => {
      if (!data) return;
      const r = uni.admission_reqs ?? {};
      let s = 50, w = 1;
      if (data.hsc_gpa && r.min_gpa_us) { const target = usToBd(r.min_gpa_us); s += (data.hsc_gpa - target) * 20; w++; }
      if (data.ielts && r.ielts) { s += (data.ielts - r.ielts) * 10; w++; }
      if (data.sat && r.sat_min) { s += (data.sat - r.sat_min) / 10; w++; }
      if (data.countries?.includes(uni.country)) s += 10;
      setScore(Math.max(5, Math.min(99, Math.round(s))));
    });
  }, [user, uni]);
  if (score === null) return <div className="text-center text-xs text-muted-foreground">Calculating match…</div>;
  const color = score >= 75 ? "text-emerald-600" : score >= 50 ? "text-amber-600" : "text-rose-600";
  return (
    <div className="text-center">
      <div className={`font-heading text-5xl font-extrabold ${color}`}>{score}%</div>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">Your match</div>
    </div>
  );
}

function Countdown({ deadline, intake }: { deadline?: string; intake: string }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const i = setInterval(() => setNow(Date.now()), 60_000); return () => clearInterval(i); }, []);
  const target = deadline ? new Date(deadline).getTime() : NaN;
  const valid = !isNaN(target);
  const diff = valid ? target - now : 0;
  const inFuture = valid && diff > 0;
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff / 3600000) % 24);
  const m = Math.floor((diff / 60000) % 60);
  return (
    <div className="rounded-lg border border-border bg-secondary/40 p-3 text-center">
      <div className="text-xs text-muted-foreground">{intake}</div>
      <div className="mt-1 font-heading text-lg font-bold tabular-nums">
        {inFuture ? <>{d}d {h}h {m}m</> : (deadline ?? "TBA")}
      </div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {inFuture ? "until deadline" : "deadline"}
      </div>
    </div>
  );
}
