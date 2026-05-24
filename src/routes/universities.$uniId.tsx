import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { UNIVERSITIES } from "@/lib/data";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useServerFn } from "@tanstack/react-start";
import { generateAiHacks, generateStudyPlan } from "@/lib/hacks.functions";
import { matchUniversity, type MatchResult } from "@/lib/matching";
import { bdToUs, bdToUk, bdToEcts } from "@/lib/gpa";
import { useCompare } from "@/lib/compare-store";
import { HackCard, type Hack } from "@/components/HackCard";
import { MatchBadge } from "@/components/MatchBadge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowLeft, ExternalLink, Heart, GitCompare, Sparkles, BookOpen, GraduationCap, Loader2 } from "lucide-react";

export const Route = createFileRoute("/universities/$uniId")({
  loader: ({ params }) => {
    const u = UNIVERSITIES.find((x) => x.id === params.uniId);
    if (!u) throw notFound();
    return { u };
  },
  head: ({ loaderData }) => ({
    meta: loaderData?.u ? [
      { title: `${loaderData.u.name} — BeyondBorder` },
      { name: "description", content: `Tuition, scholarships, admission tips & match score for ${loaderData.u.name}, ${loaderData.u.country}.` },
    ] : [],
  }),
  notFoundComponent: () => (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center">
      <h1 className="font-heading text-3xl font-extrabold">University not found</h1>
      <p className="mt-2 text-muted-foreground">It might not be in our directory yet.</p>
      <Button asChild className="mt-6"><Link to="/universities">← Back to all universities</Link></Button>
    </div>
  ),
  component: UniDetailPage,
});

function UniDetailPage() {
  const { u } = Route.useLoaderData();
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [hacks, setHacks] = useState<Hack[]>([]);
  const [aiHacks, setAiHacks] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [match, setMatch] = useState<MatchResult | null>(null);
  const { add, has } = useCompare();
  const inCompare = has(u.id);
  const getAi = useServerFn(generateAiHacks);

  useEffect(() => {
    supabase.from("university_hacks").select("*").eq("uni_id", u.id).order("upvotes", { ascending: false })
      .then(({ data }) => setHacks((data ?? []) as Hack[]));
    supabase.from("university_hacks_ai").select("content_md").eq("uni_id", u.id).maybeSingle()
      .then(({ data }) => { if (data) setAiHacks(data.content_md); });
  }, [u.id]);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle().then(({ data }) => {
      setProfile(data);
      if (data) setMatch(matchUniversity(u, data));
    });
  }, [user, u]);

  const generateAi = async () => {
    setLoadingAi(true);
    try {
      const res = await getAi({ data: { uniId: u.id, uniName: u.name, country: u.country } });
      setAiHacks(res.content);
      if (res.error) toast.error(res.content);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to generate");
    } finally {
      setLoadingAi(false);
    }
  };

  const saveToShortlist = async () => {
    if (!user) { toast.error("Log in to save"); return; }
    const { error } = await supabase.from("shortlist").insert({
      user_id: user.id, item_type: "university", item_id: u.id, item_name: u.name, item_data: u as any,
    });
    if (error) toast.error(error.code === "23505" ? "Already saved" : error.message);
    else toast.success(`Saved ${u.name}`);
  };

  const addToCompare = () => {
    if (inCompare) { toast.info("Already in compare"); return; }
    const ok = add(u.id);
    if (!ok) toast.error("Compare is full (max 3). Remove one first.");
    else toast.success(`Added ${u.name} to compare`);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Link to="/universities" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> All universities
      </Link>

      {/* Header */}
      <div className="card-surface mt-4 p-6 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="rounded-md bg-secondary px-3 py-1.5 font-heading font-bold text-foreground">#{u.qsRank}</div>
            <span className="text-4xl">{u.countryFlag}</span>
            <div>
              <h1 className="font-heading text-3xl font-extrabold leading-tight md:text-4xl">{u.name}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{u.country} · {u.programs.join(" · ")}</p>
              <span className="mt-2 inline-block rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary ring-1 ring-primary/30">{u.dealTag}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={saveToShortlist}><Heart className="mr-1 h-4 w-4" /> Save</Button>
            <Button variant="outline" size="sm" onClick={addToCompare} disabled={inCompare}>
              <GitCompare className="mr-1 h-4 w-4" /> {inCompare ? "In compare" : "Compare"}
            </Button>
          </div>
        </div>
        <p className="mt-5 text-base text-foreground/90">{u.blurb}</p>
      </div>

      {/* Match */}
      {user && match && (
        <div className="card-surface mt-4 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-heading text-xl font-extrabold">Your match</h2>
            <MatchBadge verdict={match.verdict} score={match.score} />
          </div>
          {match.reasons.length > 0 ? (
            <ul className="mt-4 space-y-2 text-sm">
              {match.reasons.map((r, i) => <li key={i} className="flex gap-2"><span className="text-primary">→</span>{r}</li>)}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">Complete your profile to see why this is or isn't a fit.</p>
          )}
        </div>
      )}
      {!user && (
        <div className="card-surface mt-4 flex items-center justify-between gap-4 p-5">
          <p className="text-sm text-muted-foreground">Log in to see how well YOUR profile matches this uni.</p>
          <Button asChild size="sm" className="bg-primary text-primary-foreground"><Link to="/auth" search={{ tab: "signup" }}>Sign up</Link></Button>
        </div>
      )}

      {/* Quick facts */}
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <Fact label="Tuition" value={u.tuition} />
        <Fact label="Deadline" value={u.deadline} />
        <Fact label="Min GPA (BD)" value={u.minGpa ? `${u.minGpa.toFixed(1)} / 5.0` : "—"}
              sub={u.minGpa ? `≈ US ${bdToUs(u.minGpa).toFixed(1)} · UK ${bdToUk(u.minGpa)} · ECTS ${bdToEcts(u.minGpa)}` : undefined} />
      </div>

      {/* Hacks */}
      <section className="mt-8">
        <div className="flex items-end justify-between">
          <h2 className="font-heading text-2xl font-extrabold flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" /> Admission hacks & tricks</h2>
          <span className="text-xs text-muted-foreground">{hacks.length} curated tips</span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">Insider knowledge sourced from Reddit, Quora, and official channels.</p>

        {hacks.length > 0 ? (
          <div className="mt-4 grid gap-3">{hacks.map((h) => <HackCard key={h.id} hack={h} />)}</div>
        ) : (
          <div className="card-surface mt-4 p-5 text-sm text-muted-foreground">
            No curated tips yet for this uni. Generate AI-synthesized insights below.
          </div>
        )}

        {/* AI fallback / supplement */}
        <div className="card-surface mt-4 border-violet-500/30 bg-violet-500/5 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-heading font-bold">AI-synthesized insights</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">Common patterns Aria has seen across forums & official guidance. Not direct quotes.</p>
            </div>
            <Button size="sm" onClick={generateAi} disabled={loadingAi} className="bg-violet-500 text-white hover:bg-violet-600">
              {loadingAi ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating…</> : (aiHacks ? "Regenerate" : "Generate")}
            </Button>
          </div>
          {aiHacks && (
            <div className="prose prose-sm prose-invert mt-4 max-w-none whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
              {aiHacks}
            </div>
          )}
        </div>
      </section>

      {/* Exam prep */}
      <ExamPrepSection uniName={u.name} country={u.country} profile={profile} />

      {/* Aria CTA */}
      {user && (
        <div className="card-surface mt-8 flex flex-wrap items-center justify-between gap-3 p-5">
          <div>
            <h3 className="font-heading font-bold">Want personalized advice?</h3>
            <p className="text-sm text-muted-foreground">Ask Aria anything about {u.name}.</p>
          </div>
          <Button asChild className="bg-primary text-primary-foreground"><Link to="/ask-ai">Ask Aria →</Link></Button>
        </div>
      )}
    </div>
  );
}

function Fact({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="card-surface p-4">
      <div className="text-xs uppercase text-muted-foreground">{label}</div>
      <div className="mt-1 font-heading text-lg font-bold">{value}</div>
      {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

function ExamPrepSection({ uniName, country, profile }: { uniName: string; country: string; profile: any }) {
  const exams = getRequiredExams(country);
  const [openExam, setOpenExam] = useState<string | null>(null);
  const [plan, setPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const getPlan = useServerFn(generateStudyPlan);

  if (exams.length === 0) return null;

  const makePlan = async (exam: string) => {
    setLoading(true); setOpenExam(exam); setPlan(null);
    try {
      const current = exam === "SAT" ? profile?.sat?.toString() : exam === "IELTS" ? profile?.ielts?.toString() : exam === "TOEFL" ? profile?.toefl?.toString() : undefined;
      const res = await getPlan({ data: { uniName, exam, currentScore: current, weeks: 12 } });
      setPlan(res.plan);
    } finally { setLoading(false); }
  };

  return (
    <section className="mt-8">
      <h2 className="font-heading text-2xl font-extrabold flex items-center gap-2"><BookOpen className="h-5 w-5 text-primary" /> Entrance exams & prep</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {exams.map((e) => (
          <div key={e.name} className="card-surface p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-heading font-bold">{e.name}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{e.desc}</p>
              </div>
              <a href={e.syllabus} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-xs inline-flex items-center gap-1">
                Syllabus <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <Button size="sm" variant="outline" className="mt-3 w-full" onClick={() => makePlan(e.name)} disabled={loading && openExam === e.name}>
              {loading && openExam === e.name ? <><Loader2 className="mr-2 h-3 w-3 animate-spin" />Building plan…</> : <><GraduationCap className="mr-2 h-3 w-3" /> Generate my study plan</>}
            </Button>
          </div>
        ))}
      </div>
      {plan && openExam && (
        <div className="card-surface mt-4 p-5">
          <h3 className="font-heading font-bold">Your {openExam} plan for {uniName}</h3>
          <div className="prose prose-sm prose-invert mt-3 max-w-none whitespace-pre-wrap text-sm">{plan}</div>
        </div>
      )}
    </section>
  );
}

function getRequiredExams(country: string): { name: string; desc: string; syllabus: string }[] {
  const sat = { name: "SAT", desc: "Most US unis require it. Score 1500+ for top tier.", syllabus: "https://satsuite.collegeboard.org/sat/whats-on-the-test" };
  const ielts = { name: "IELTS", desc: "Universally accepted English test. 6.5–7.0 typical.", syllabus: "https://www.ielts.org/for-test-takers/test-format" };
  const toefl = { name: "TOEFL", desc: "Alternative to IELTS, preferred by some US schools.", syllabus: "https://www.ets.org/toefl/test-takers/ibt/about.html" };
  if (country === "USA") return [sat, toefl, ielts];
  if (country === "UK" || country === "Australia") return [ielts];
  return [ielts, toefl];
}
