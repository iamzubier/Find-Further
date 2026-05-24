import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { getUniDetail, submitTip } from "@/lib/uni-detail.functions";
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
import { Heart, GitCompare, Share2, ExternalLink, ArrowLeft, MapPin, Calendar, GraduationCap, DollarSign, BookOpen, Lightbulb, Award, Search, ThumbsUp } from "lucide-react";
import { toast } from "sonner";

const detailQuery = (slug: string) => queryOptions({
  queryKey: ["uni-detail", slug],
  queryFn: () => getUniDetail({ data: { slug } }),
});

export const Route = createFileRoute("/universities/$slug")({
  loader: async ({ params, context }) => {
    const data = await context.queryClient.ensureQueryData(detailQuery(params.slug));
    if (!data.uni) throw notFound();
    return data;
  },
  head: ({ loaderData }) => ({
    meta: loaderData?.uni ? [
      { title: `${loaderData.uni.name} — Admissions, Tuition & Hacks | BeyondBorder` },
      { name: "description", content: `Complete guide to ${loaderData.uni.name}, ${loaderData.uni.country}: tuition, scholarships, deadlines, real student tips, BD GPA conversions.` },
      { property: "og:image", content: loaderData.uni.campus_image_url ?? "" },
    ] : [],
  }),
  notFoundComponent: () => (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center">
      <h1 className="font-heading text-3xl font-extrabold">University not in detail catalog</h1>
      <p className="mt-2 text-muted-foreground">We have rich pages for 30 top universities. More coming.</p>
      <Button asChild className="mt-6"><Link to="/universities">← Browse all universities</Link></Button>
    </div>
  ),
  component: UniDetailPage,
});

const TABS = ["Overview","Admissions","Tuition & Aid","Programs","How To Get In","Entrance Exams"] as const;

function UniDetailPage() {
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery(detailQuery(slug));
  const uni = data.uni!;
  const [tab, setTab] = useState<typeof TABS[number]>("Overview");

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
          {tab === "How To Get In" && <Tips uni={uni} tips={data.tips} />}
          {tab === "Entrance Exams" && <Exams uni={uni} />}
        </main>
        <Sidebar uni={uni} />
      </div>
    </div>
  );
}

function Hero({ uni }: { uni: any }) {
  return (
    <div className="relative h-[420px] w-full overflow-hidden">
      <img src={uni.campus_image_url} alt={`${uni.name} campus`} className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/30" />
      <div className="absolute inset-x-0 top-0 p-4">
        <Link to="/universities" className="inline-flex items-center gap-1 text-sm text-white/80 hover:text-white">
          <ArrowLeft className="h-4 w-4" /> All universities
        </Link>
      </div>
      <div className="absolute inset-x-0 bottom-0 mx-auto max-w-6xl px-4 pb-8">
        <div className="flex flex-wrap items-end gap-5">
          {uni.logo_url && (
            <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-white p-3 shadow-2xl ring-1 ring-white/20">
              <img src={uni.logo_url} alt={`${uni.name} logo`} className="max-h-full max-w-full" onError={(e) => { (e.target as HTMLImageElement).style.display='none'; }} />
            </div>
          )}
          <div className="text-white">
            <h1 className="font-heading text-4xl font-extrabold leading-tight md:text-5xl">{uni.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-white/85">
              <span className="text-xl">{uni.country_flag}</span>
              <span><MapPin className="mr-1 inline h-3.5 w-3.5" />{uni.city}, {uni.country}</span>
              {uni.qs_rank && <span className="rounded-full bg-primary px-3 py-0.5 font-bold text-primary-foreground">QS #{uni.qs_rank}</span>}
              {uni.founded_year && <span>Founded {uni.founded_year}</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
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
      <Card title="Campus Life">
        <p className="leading-relaxed text-foreground/90">{uni.campus_life}</p>
      </Card>
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
      <Card title="Location">
        <a href={uni.official_url} target="_blank" rel="noopener noreferrer" className="mb-3 inline-flex">
          <Button variant="outline" size="sm"><ExternalLink className="mr-2 h-3 w-3" /> Official Website</Button>
        </a>
        <div className="aspect-video overflow-hidden rounded-lg border border-border">
          <iframe
            title={`Map of ${uni.name}`}
            src={`https://www.google.com/maps?q=${encodeURIComponent(uni.maps_query)}&output=embed`}
            className="h-full w-full" loading="lazy"
          />
        </div>
      </Card>
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
      <Card title="Deadlines" icon={Calendar}>
        <div className="grid gap-3">
          {uni.deadlines?.map((d: any) => (
            <div key={d.intake} className="rounded-lg border border-border p-4">
              <div className="font-semibold">{d.intake}</div>
              <div className="mt-1 text-sm text-muted-foreground">Apply by <span className="font-medium text-foreground">{d.deadline}</span> · Decision: {d.decision}</div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">Avg. processing time: {uni.processing_time}</p>
      </Card>
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
      <Card title="Scholarships" icon={Award}>
        <div className="grid gap-3 md:grid-cols-2">
          {uni.scholarships?.map((s: any) => (
            <div key={s.name} className="rounded-lg border border-border p-4">
              <div className="font-heading font-bold">{s.name}</div>
              <div className="mt-1 text-primary font-semibold">{s.amount}</div>
              <p className="mt-2 text-sm text-muted-foreground">{s.eligibility}</p>
              <div className="mt-2 text-xs">Deadline: <b>{s.deadline}</b></div>
              {s.url && <a href={s.url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-sm text-primary hover:underline">Apply <ExternalLink className="h-3 w-3" /></a>}
            </div>
          ))}
        </div>
      </Card>
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

const PLATFORM_BADGES: Record<string, { label: string; class: string; emoji: string }> = {
  reddit:   { label: "Reddit",  class: "bg-orange-500/15 text-orange-700 ring-orange-500/30", emoji: "🔶" },
  quora:    { label: "Quora",   class: "bg-red-500/15 text-red-700 ring-red-500/30",          emoji: "🅀" },
  youtube:  { label: "YouTube", class: "bg-rose-500/15 text-rose-700 ring-rose-500/30",       emoji: "▶" },
  forum:    { label: "Forum",   class: "bg-blue-500/15 text-blue-700 ring-blue-500/30",       emoji: "💬" },
  official: { label: "Official",class: "bg-emerald-500/15 text-emerald-700 ring-emerald-500/30", emoji: "✓" },
};
const TAGS = ["All","Academics","ECA","Scholarship","Strategy","CampusLife","FinancialAid"];

const COUNTRY_NAMES: Record<string, string> = {
  BD: "Bangladesh", IN: "India", PK: "Pakistan", LK: "Sri Lanka", NP: "Nepal",
  CN: "China", NG: "Nigeria", AE: "UAE", MY: "Malaysia",
};

function Tips({ uni, tips }: any) {
  const [tag, setTag] = useState("All");
  const evalSum = useMemo(() => loadEvalSummary(), []);
  const homeCountry = evalSum?.country;
  const homeName = homeCountry ? COUNTRY_NAMES[homeCountry] : null;
  const [onlyMine, setOnlyMine] = useState(false);
  const { user } = useAuth();
  let filtered = tag === "All" ? tips : tips.filter((t: any) => t.tag === tag);
  if (onlyMine && homeName) {
    const needle = homeName.toLowerCase();
    filtered = filtered.filter((t: any) =>
      t.tip_text?.toLowerCase().includes(needle) ||
      t.source_url?.toLowerCase().includes(needle.replace(/\s+/g, ""))
    );
  }
  return (
    <>
      <Card title="Real tips from students and communities 🎯" icon={Lightbulb}>
        <p className="mb-4 text-sm text-muted-foreground">Curated from Reddit, Quora, YouTube and college forums.</p>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {TAGS.map(t => (
            <button key={t} onClick={() => setTag(t)}
              className={`rounded-full px-3 py-1 text-xs font-medium ring-1 ${tag===t ? "bg-primary text-primary-foreground ring-primary" : "bg-secondary text-foreground ring-border"}`}>
              {t}
            </button>
          ))}
          {homeName && (
            <button onClick={() => setOnlyMine(v => !v)}
              className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${onlyMine ? "bg-emerald-600 text-white ring-emerald-600" : "bg-emerald-500/10 text-emerald-700 ring-emerald-500/30"}`}>
              🌍 Tips mentioning {homeName}
            </button>
          )}
          <SubmitTip uniSlug={uni.slug} disabled={!user} />
        </div>
        <div className="grid gap-3">
          {filtered.map((t: any) => {
            const b = PLATFORM_BADGES[t.source_platform] ?? PLATFORM_BADGES.forum;
            return (
              <div key={t.id} className="rounded-lg border border-border p-4">
                <p className="text-sm leading-relaxed">{t.tip_text}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 ring-1 ${b.class}`}>{b.emoji} {b.label}</span>
                  <span className="rounded-full bg-secondary px-2 py-0.5">{t.tag}</span>
                  {t.source_upvotes > 0 && <span className="inline-flex items-center gap-1 text-muted-foreground"><ThumbsUp className="h-3 w-3" /> {t.source_upvotes.toLocaleString()}</span>}
                  {t.posted_at && <span className="text-muted-foreground">{new Date(t.posted_at).toLocaleDateString()}</span>}
                  {t.source_url && <a href={t.source_url} target="_blank" rel="noopener noreferrer" className="ml-auto inline-flex items-center gap-1 text-primary hover:underline">Source <ExternalLink className="h-3 w-3" /></a>}
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && <p className="text-sm text-muted-foreground">No tips for this tag yet.</p>}
        </div>
        <p className="mt-4 text-xs italic text-muted-foreground">Tips are sourced from public community posts. Always verify with official university sources.</p>
      </Card>
    </>
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
      if (res.ok) { toast.success("Tip submitted for review — thanks!"); setOpen(false); setText(""); setUrl(""); }
      else toast.error(res.error ?? "Failed");
    } catch (e: any) { toast.error(e?.message ?? "Failed"); }
    finally { setBusy(false); }
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" disabled={disabled} title={disabled ? "Log in to submit" : ""}>+ Submit a tip you found</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Submit a tip</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Textarea placeholder="Paste the tip (20-1000 chars)" value={text} onChange={e=>setText(e.target.value)} rows={4} />
          <Input placeholder="Source URL (https://...)" value={url} onChange={e=>setUrl(e.target.value)} />
          <div className="grid grid-cols-2 gap-2">
            <Select value={platform} onValueChange={setPlatform}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{Object.keys(PLATFORM_BADGES).map(p => <SelectItem key={p} value={p}>{PLATFORM_BADGES[p].label}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={tag} onValueChange={setTag}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{TAGS.slice(1).map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
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

function Exams({ uni }: any) {
  return (
    <Card title="Entrance exams & prep" icon={BookOpen}>
      <div className="grid gap-4">
        {uni.exams?.map((e: any) => (
          <div key={e.name} className="rounded-lg border border-border p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h3 className="font-heading font-bold">{e.name}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{e.what_it_tests}</p>
              </div>
              <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary ring-1 ring-primary/30">{e.score_req}</span>
            </div>
            {e.next_dates?.length > 0 && <div className="mt-3 text-xs"><b>Next dates:</b> {e.next_dates.join(" · ")}</div>}
            <div className="mt-3 flex flex-wrap gap-2">
              {e.register_url && <a href={e.register_url} target="_blank" rel="noopener noreferrer"><Button size="sm" variant="outline"><ExternalLink className="mr-1 h-3 w-3" /> Register</Button></a>}
              {e.sample_url && <a href={e.sample_url} target="_blank" rel="noopener noreferrer"><Button size="sm" variant="outline">Sample paper</Button></a>}
              {(e.prep_links ?? []).slice(0,3).map((url: string, i: number) => (
                <a key={url} href={url} target="_blank" rel="noopener noreferrer"><Button size="sm" variant="ghost">Prep {i+1}</Button></a>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Card>
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
    if (!add(uni.slug)) toast.error("Compare full (max 3)");
    else toast.success("Added to compare");
  };
  const share = async () => {
    try { await navigator.share({ title: uni.name, url: window.location.href }); }
    catch { await navigator.clipboard.writeText(window.location.href); toast.success("Link copied"); }
  };
  const nextDeadline = uni.deadlines?.[0];
  return (
    <aside className="lg:sticky lg:top-32 lg:self-start">
      <div className="card-surface space-y-4 p-5">
        {user ? <MatchRing uni={uni} /> : (
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Build your profile to see your match score</div>
            <Button asChild className="mt-2 w-full"><Link to="/auth" search={{ tab: "signup" }}>Sign up</Link></Button>
          </div>
        )}
        <div className="grid grid-cols-3 gap-2">
          <Button variant="outline" size="sm" onClick={save}><Heart className="h-4 w-4" /></Button>
          <Button variant="outline" size="sm" onClick={addCmp} disabled={inCompare}><GitCompare className="h-4 w-4" /></Button>
          <Button variant="outline" size="sm" onClick={share}><Share2 className="h-4 w-4" /></Button>
        </div>
        {nextDeadline && <Countdown deadline={nextDeadline.deadline} intake={nextDeadline.intake} />}
        <Button asChild className="w-full bg-primary text-primary-foreground"><a href={uni.application_url} target="_blank" rel="noopener noreferrer">Apply now <ExternalLink className="ml-2 h-3 w-3" /></a></Button>
      </div>
    </aside>
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

function Countdown({ deadline, intake }: { deadline: string; intake: string }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const i = setInterval(() => setNow(Date.now()), 60_000); return () => clearInterval(i); }, []);
  const target = new Date(deadline).getTime();
  const diff = Math.max(0, target - now);
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff / 3600000) % 24);
  const m = Math.floor((diff / 60000) % 60);
  return (
    <div className="rounded-lg border border-border bg-secondary/40 p-3 text-center">
      <div className="text-xs text-muted-foreground">{intake}</div>
      <div className="mt-1 font-heading text-lg font-bold tabular-nums">{d}d {h}h {m}m</div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">until deadline</div>
    </div>
  );
}
