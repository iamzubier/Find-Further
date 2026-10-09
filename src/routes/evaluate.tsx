import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  COUNTRIES, CURRICULUMS, COUNTRY_CURRICULUMS, COUNTRY_OPTIONS,
  convertToAll,
  type CountryCode, type CurriculumId, type RawGrade, type ConvertedGrades,
} from "@/lib/curriculum";
import { computeEvaluation, saveEvaluation } from "@/lib/evaluation.functions";
import { scoreProfile, type ScoreBreakdown, type MatchedUni } from "@/lib/evaluation";
import { useAuth } from "@/lib/auth";
import { saveEvalSummary } from "@/lib/evaluation-store";
import { CheckCircle2, AlertTriangle, Lightbulb, Share2, Loader2, Save } from "lucide-react";
import { SmartLogo } from "@/components/SmartLogo";
import { SmartCampusImage } from "@/components/SmartCampusImage";

export const Route = createFileRoute("/evaluate")({
  head: () => ({
    meta: [
      { title: "Evaluate My Profile — FindFurther" },
      { name: "description", content: "Free profile evaluation for international students. Converts your grades to US, UK, German, and ECTS scales and matches you to universities worldwide." },
      { property: "og:title", content: "Evaluate My Profile — FindFurther" },
      { property: "og:description", content: "Get your study-abroad profile scored in 2 minutes. Works for any curriculum." },
    ],
  }),
  component: EvaluatePage,
});

type FormState = {
  country: CountryCode | "";
  curriculum: CurriculumId | "";
  hscGpa: string; sscGpa: string;
  percentage: string;
  aLevels: string[];
  ibPoints: string;
  usGpa: string;
  gaokao: string;
  abitur: string;
  ielts: string; toefl: string; duolingo: string; pte: string;
  sat: string; act: string;
  targetCountries: string[];
  intendedMajor: string;
  intake: string;
  budget: string;
  scholarshipNeed: string;
  ecaText: string;
};

const EMPTY: FormState = {
  country: "", curriculum: "",
  hscGpa: "", sscGpa: "",
  percentage: "",
  aLevels: ["", "", "", ""],
  ibPoints: "", usGpa: "", gaokao: "", abitur: "",
  ielts: "", toefl: "", duolingo: "", pte: "", sat: "", act: "",
  targetCountries: [], intendedMajor: "", intake: "", budget: "", scholarshipNeed: "",
  ecaText: "",
};

function buildRawGrade(f: FormState): RawGrade | null {
  switch (f.curriculum) {
    case "BD_HSC":
      return f.hscGpa ? { curriculum: "BD_HSC", hscGpa: +f.hscGpa, sscGpa: f.sscGpa ? +f.sscGpa : undefined } : null;
    case "CBSE": case "ICSE": case "PK_FSC":
      return f.percentage ? { curriculum: f.curriculum, percentage: +f.percentage } : null;
    case "A_LEVELS": {
      const grades = f.aLevels.filter(Boolean);
      return grades.length ? { curriculum: "A_LEVELS", grades } : null;
    }
    case "IB":
      return f.ibPoints ? { curriculum: "IB", points: +f.ibPoints } : null;
    case "US_GPA": case "CA_GPA":
      return f.usGpa ? { curriculum: f.curriculum, gpa: +f.usGpa } : null;
    case "GAOKAO":
      return f.gaokao ? { curriculum: "GAOKAO", score: +f.gaokao } : null;
    case "ABITUR":
      return f.abitur ? { curriculum: "ABITUR", grade: +f.abitur } : null;
    default: return null;
  }
}

function buildTests(f: FormState) {
  return {
    ielts: f.ielts ? +f.ielts : undefined,
    toefl: f.toefl ? +f.toefl : undefined,
    duolingo: f.duolingo ? +f.duolingo : undefined,
    pte: f.pte ? +f.pte : undefined,
    sat: f.sat ? +f.sat : undefined,
    act: f.act ? +f.act : undefined,
  };
}

function EvaluatePage() {
  const [f, setF] = useState<FormState>(EMPTY);
  const [matches, setMatches] = useState<MatchedUni[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const computeFn = useServerFn(computeEvaluation);
  const saveFn = useServerFn(saveEvaluation);
  const { user } = useAuth();
  const nav = useNavigate();

  const raw = useMemo(() => buildRawGrade(f), [f]);
  const converted = useMemo<ConvertedGrades | null>(() => raw ? convertToAll(raw) : null, [raw]);

  // Live local score
  const breakdown = useMemo<ScoreBreakdown>(() => {
    if (!converted) {
      return { academic: 0, language: 0, standardized: 0, eca: 0, completeness: 0, total: 0, strengths: [], weaknesses: ["Fill in your grades to get started."], improvements: [] };
    }
    return scoreProfile({
      converted,
      tests: buildTests(f),
      ecaText: f.ecaText,
      targetCountries: f.targetCountries,
      budget: f.budget || undefined,
      scholarshipNeed: f.scholarshipNeed || undefined,
      intendedMajor: f.intendedMajor || undefined,
    });
  }, [converted, f]);

  // Debounced server call for matched universities
  useEffect(() => {
    if (!raw || !converted || f.targetCountries.length === 0) {
      setMatches([]);
      return;
    }
    setLoadingMatches(true);
    const t = setTimeout(async () => {
      try {
        const res = await computeFn({
          data: {
            home_country: f.country || "Unknown",
            curriculum_type: f.curriculum,
            grades_raw: raw,
            tests: buildTests(f),
            target_countries: f.targetCountries,
            intended_major: f.intendedMajor || null,
            intake: f.intake || null,
            budget: f.budget || null,
            scholarship_need: f.scholarshipNeed || null,
            eca_text: f.ecaText || null,
          },
        });
        setMatches(res.matches);
      } catch {
        // silent for live preview
      } finally {
        setLoadingMatches(false);
      }
    }, 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [raw, f.targetCountries.join("|"), f.budget, f.ielts, f.toefl, f.duolingo, f.sat, f.act, f.intendedMajor]);

  const save = useMutation({
    mutationFn: async () => {
      if (!raw) throw new Error("Please fill in your grades before saving.");
      if (!f.country || !f.curriculum) throw new Error("Pick your country and curriculum first.");
      return saveFn({
        data: {
          home_country: f.country, curriculum_type: f.curriculum, grades_raw: raw,
          tests: buildTests(f),
          target_countries: f.targetCountries, intended_major: f.intendedMajor || null,
          intake: f.intake || null, budget: f.budget || null,
          scholarship_need: f.scholarshipNeed || null, eca_text: f.ecaText || null,
        },
      });
    },
    onSuccess: (data) => {
      if (converted) {
        saveEvalSummary({
          country: f.country, curriculum: f.curriculum as CurriculumId,
          raw: raw!, converted,
          tests: { ielts: f.ielts ? +f.ielts : undefined, toefl: f.toefl ? +f.toefl : undefined, sat: f.sat ? +f.sat : undefined, act: f.act ? +f.act : undefined, duolingo: f.duolingo ? +f.duolingo : undefined },
          targetCountries: f.targetCountries,
          score: breakdown.total, ts: Date.now(),
        });
      }
      toast.success("Profile saved.");
      nav({ to: "/evaluate/results/$id", params: { id: data.id } });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <header className="mb-8 border-b border-border pb-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Free · Any curriculum · Live results</p>
        <h1 className="mt-2 font-heading text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">Evaluate My Profile</h1>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">Enter your academic history and goals on the left. Your score, conversions, and a live ranked list of matched universities appear on the right as you type.</p>
      </header>

      <div className="grid gap-8 lg:grid-cols-5">
        {/* LEFT — FORM */}
        <div className="space-y-6 lg:col-span-3">
          <Section step={1} title="Origin & Curriculum">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Where are you from?">
                <Select value={f.country} onValueChange={(v) => setF({ ...f, country: v as CountryCode, curriculum: "" })}>
                  <SelectTrigger><SelectValue placeholder="Choose your country…" /></SelectTrigger>
                  <SelectContent>{COUNTRIES.map(c => <SelectItem key={c.code} value={c.code}>{c.flag} {c.name}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Curriculum">
                <Select value={f.curriculum} onValueChange={(v) => setF({ ...f, curriculum: v as CurriculumId })} disabled={!f.country}>
                  <SelectTrigger><SelectValue placeholder={f.country ? "Choose your curriculum…" : "Pick a country first"} /></SelectTrigger>
                  <SelectContent>{(f.country ? COUNTRY_CURRICULUMS[f.country as CountryCode] : []).map(c => <SelectItem key={c} value={c}>{CURRICULUMS[c].label}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
            </div>

            {f.curriculum && (
              <div className="mt-5 border-t border-border pt-5">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Enter your grades · {CURRICULUMS[f.curriculum].label}</p>
                <GradeInputs f={f} setF={setF} />
                {converted && (
                  <div className="mt-4 rounded border border-primary/30 bg-primary/5 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary">Live conversion</p>
                    <p className="mt-1 text-sm font-medium text-foreground">
                      US GPA <b>{converted.us4.toFixed(2)}</b>/4.0 · UK <b>{converted.uk}</b> · German <b>{converted.german.toFixed(1)}</b> · ECTS <b>{converted.ects}</b> · AU <b>{converted.au7.toFixed(1)}</b>/7.0
                    </p>
                  </div>
                )}
              </div>
            )}
          </Section>

          <Section step={2} title="Test Scores" subtitle="Leave blank if not taken">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <Field label="IELTS (0–9)"><Input type="number" step="0.5" max={9} value={f.ielts} onChange={e => setF({ ...f, ielts: e.target.value })} placeholder="—" /></Field>
              <Field label="TOEFL iBT (0–120)"><Input type="number" max={120} value={f.toefl} onChange={e => setF({ ...f, toefl: e.target.value })} placeholder="—" /></Field>
              <Field label="Duolingo (10–160)"><Input type="number" max={160} value={f.duolingo} onChange={e => setF({ ...f, duolingo: e.target.value })} placeholder="—" /></Field>
              <Field label="PTE (10–90)"><Input type="number" max={90} value={f.pte} onChange={e => setF({ ...f, pte: e.target.value })} placeholder="—" /></Field>
              <Field label="SAT (400–1600)"><Input type="number" max={1600} value={f.sat} onChange={e => setF({ ...f, sat: e.target.value })} placeholder="—" /></Field>
              <Field label="ACT (1–36)"><Input type="number" max={36} value={f.act} onChange={e => setF({ ...f, act: e.target.value })} placeholder="—" /></Field>
            </div>
          </Section>

          <Section step={3} title="Study Goals">
            <div>
              <p className="mb-2 text-sm font-medium text-foreground">Target countries</p>
              <div className="flex flex-wrap gap-2">
                {COUNTRY_OPTIONS.map(c => {
                  const on = f.targetCountries.includes(c.code);
                  return (
                    <button key={c.code} type="button"
                      onClick={() => setF({ ...f, targetCountries: on ? f.targetCountries.filter(x => x !== c.code) : [...f.targetCountries, c.code] })}
                      className={`rounded-md border px-3 py-1.5 text-sm transition ${on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-heading text-foreground hover:bg-secondary"}`}>
                      {c.flag} {c.name}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="Intended major"><Input value={f.intendedMajor} onChange={e => setF({ ...f, intendedMajor: e.target.value })} placeholder="e.g. Computer Science" /></Field>
              <Field label="Intake">
                <Select value={f.intake} onValueChange={(v) => setF({ ...f, intake: v })}>
                  <SelectTrigger><SelectValue placeholder="When?" /></SelectTrigger>
                  <SelectContent>{["Fall 2026","Spring 2027","Fall 2027","Later"].map(x => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Annual budget">
                <Select value={f.budget} onValueChange={(v) => setF({ ...f, budget: v })}>
                  <SelectTrigger><SelectValue placeholder="Tuition budget" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Under $5k">Under $5k</SelectItem>
                    <SelectItem value="$5k–15k">$5k – $15k</SelectItem>
                    <SelectItem value="$15k–30k">$15k – $30k</SelectItem>
                    <SelectItem value="$30k+">$30k+</SelectItem>
                    <SelectItem value="Fully Funded">Fully Funded only</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Need scholarship?">
                <Select value={f.scholarshipNeed} onValueChange={(v) => setF({ ...f, scholarshipNeed: v })}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent><SelectItem value="yes">Yes, essential</SelectItem><SelectItem value="nice">Nice to have</SelectItem><SelectItem value="no">Not needed</SelectItem></SelectContent>
                </Select>
              </Field>
            </div>
          </Section>

          <Section step={4} title="Extracurriculars (ECA)" subtitle="Roles, awards, scale, outcomes. Be specific.">
            <Textarea rows={7} maxLength={4000} value={f.ecaText} onChange={e => setF({ ...f, ecaText: e.target.value })}
              placeholder='e.g. "Captain of school debate team, 1st place at National MUN 2024, organized a 200-student coding bootcamp, published research on..."' />
            <div className="mt-2 flex justify-between text-xs text-muted-foreground">
              <span>{f.ecaText.length < 100 ? `Add ${100 - f.ecaText.length} more chars for full ECA credit.` : "Good depth — counts toward your ECA score."}</span>
              <span>{f.ecaText.length}/4000</span>
            </div>
          </Section>

          <div className="rounded-md border border-border bg-heading p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-heading text-lg font-bold text-foreground">Save my profile</p>
                <p className="text-xs text-muted-foreground">{user ? "Stored to your account so you can return anytime." : "Sign up to save your matches and revisit later."}</p>
              </div>
              {user ? (
                <Button onClick={() => save.mutate()} disabled={save.isPending || !raw} className="min-w-[180px]">
                  {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="mr-2 h-4 w-4" /> Save My Profile</>}
                </Button>
              ) : (
                <Button asChild className="min-w-[180px]"><Link to="/auth" search={{ tab: "signup" }}>Sign up to save</Link></Button>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT — STICKY LIVE RESULTS */}
        <aside className="lg:col-span-2">
          <div className="lg:sticky lg:top-6 space-y-4">
            <ScorePanel breakdown={breakdown} converted={converted} />
            <FeedbackPanel breakdown={breakdown} />
            <MatchesPanel matches={matches} loading={loadingMatches} hasTargets={f.targetCountries.length > 0} converted={converted} />
          </div>
        </aside>
      </div>
    </div>
  );
}

/* ---------------- Form helpers ---------------- */

function Section({ step, title, subtitle, children }: { step: number; title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-md border border-border bg-heading p-6 shadow-sm">
      <header className="mb-5 flex items-baseline gap-3 border-b border-border pb-3">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{step}</span>
        <div>
          <h2 className="font-heading text-xl font-bold text-foreground">{title}</h2>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
      </header>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function GradeInputs({ f, setF }: { f: FormState; setF: (u: FormState) => void }) {
  const c = f.curriculum;
  if (c === "BD_HSC") return (
    <div className="grid grid-cols-2 gap-4">
      <Field label="HSC GPA (out of 5.00)"><Input type="number" step="0.01" max={5} value={f.hscGpa} onChange={e => setF({ ...f, hscGpa: e.target.value })} placeholder="e.g. 4.75" /></Field>
      <Field label="SSC GPA (optional)"><Input type="number" step="0.01" max={5} value={f.sscGpa} onChange={e => setF({ ...f, sscGpa: e.target.value })} placeholder="e.g. 5.00" /></Field>
    </div>
  );
  if (c === "CBSE" || c === "ICSE" || c === "PK_FSC") return (
    <Field label={`${c === "PK_FSC" ? "FSc/Matric" : c} percentage`}>
      <Input type="number" max={100} value={f.percentage} onChange={e => setF({ ...f, percentage: e.target.value })} placeholder="e.g. 88" />
    </Field>
  );
  if (c === "A_LEVELS") return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">A-Level grades (up to 4)</p>
      <div className="grid grid-cols-4 gap-2">
        {f.aLevels.map((g, i) => (
          <Select key={i} value={g} onValueChange={(v) => { const a = [...f.aLevels]; a[i] = v === "_" ? "" : v; setF({ ...f, aLevels: a }); }}>
            <SelectTrigger><SelectValue placeholder="–" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="_">—</SelectItem>
              {["A*","A","B","C","D","E"].map(x => <SelectItem key={x} value={x}>{x}</SelectItem>)}
            </SelectContent>
          </Select>
        ))}
      </div>
    </div>
  );
  if (c === "IB") return <Field label="IB Diploma points (out of 45)"><Input type="number" max={45} value={f.ibPoints} onChange={e => setF({ ...f, ibPoints: e.target.value })} placeholder="e.g. 38" /></Field>;
  if (c === "US_GPA" || c === "CA_GPA") return <Field label={`${c === "US_GPA" ? "US" : "Canadian"} GPA (out of 4.0)`}><Input type="number" step="0.01" max={4} value={f.usGpa} onChange={e => setF({ ...f, usGpa: e.target.value })} placeholder="e.g. 3.8" /></Field>;
  if (c === "GAOKAO") return <Field label="Gaokao total (out of 750)"><Input type="number" max={750} value={f.gaokao} onChange={e => setF({ ...f, gaokao: e.target.value })} placeholder="e.g. 620" /></Field>;
  if (c === "ABITUR") return <Field label="Abitur grade (1.0 best – 4.0 pass)"><Input type="number" step="0.1" min={1} max={6} value={f.abitur} onChange={e => setF({ ...f, abitur: e.target.value })} placeholder="e.g. 1.8" /></Field>;
  return null;
}

/* ---------------- Right column panels ---------------- */

function ScorePanel({ breakdown, converted }: { breakdown: ScoreBreakdown; converted: ConvertedGrades | null }) {
  const pct = Math.max(0, Math.min(100, breakdown.total));
  const r = 52;
  const c = 2 * Math.PI * r;
  const dash = (pct / 100) * c;
  return (
    <div className="rounded-md border border-border bg-heading p-6 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Live Profile Score</p>
      <div className="mt-4 flex items-center gap-5">
        <div className="relative">
          <svg width="128" height="128" viewBox="0 0 128 128">
            <circle cx="64" cy="64" r={r} stroke="var(--border)" strokeWidth="10" fill="none" />
            <circle cx="64" cy="64" r={r} stroke="var(--primary)" strokeWidth="10" fill="none"
              strokeLinecap="round" strokeDasharray={`${dash} ${c}`} transform="rotate(-90 64 64)"
              style={{ transition: "stroke-dasharray 400ms ease" }} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-heading text-3xl font-extrabold text-foreground">{pct}</span>
            <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">/ 100</span>
          </div>
        </div>
        <div className="flex-1 space-y-1.5 text-xs">
          <Bar label="Academic" v={breakdown.academic} max={35} />
          <Bar label="Language" v={breakdown.language} max={20} />
          <Bar label="Standardized" v={breakdown.standardized} max={15} />
          <Bar label="ECA" v={breakdown.eca} max={15} />
          <Bar label="Completeness" v={breakdown.completeness} max={15} />
        </div>
      </div>
      {converted && (
        <p className="mt-4 border-t border-border pt-3 text-xs text-muted-foreground">
          US <b className="text-foreground">{converted.us4.toFixed(2)}</b>/4.0 · UK <b className="text-foreground">{converted.uk}</b> · DE <b className="text-foreground">{converted.german.toFixed(1)}</b> · ECTS <b className="text-foreground">{converted.ects}</b>
        </p>
      )}
    </div>
  );
}

function Bar({ label, v, max }: { label: string; v: number; max: number }) {
  const pct = Math.round((v / max) * 100);
  return (
    <div>
      <div className="flex justify-between text-[11px]"><span className="text-muted-foreground">{label}</span><span className="font-semibold text-foreground">{v}/{max}</span></div>
      <div className="mt-0.5 h-1 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} /></div>
    </div>
  );
}

function FeedbackPanel({ breakdown }: { breakdown: ScoreBreakdown }) {
  return (
    <div className="space-y-3">
      <Alert tone="good" Icon={CheckCircle2} title="Strong Points" items={breakdown.strengths} empty="Add grades to surface your strengths." />
      <Alert tone="bad" Icon={AlertTriangle} title="Weak Points" items={breakdown.weaknesses} empty="Nothing flagged yet." />
      <Alert tone="warn" Icon={Lightbulb} title="To Improve" items={breakdown.improvements} empty="No suggestions yet." />
    </div>
  );
}

function Alert({ tone, Icon, title, items, empty }: { tone: "good" | "bad" | "warn"; Icon: typeof CheckCircle2; title: string; items: string[]; empty: string }) {
  const cls = tone === "good" ? "border-accent bg-accent text-accent"
    : tone === "bad" ? "border-rose-300 bg-rose-50 text-rose-900"
    : "border-earth bg-earth text-earth";
  const iconCls = tone === "good" ? "text-accent" : tone === "bad" ? "text-rose-700" : "text-earth";
  return (
    <div className={`rounded-md border p-4 ${cls}`}>
      <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide"><Icon className={`h-4 w-4 ${iconCls}`} /> {title}</p>
      {items.length === 0 ? <p className="mt-2 text-xs opacity-70">{empty}</p> : (
        <ul className="mt-2 space-y-1 text-xs leading-relaxed">{items.map((s, i) => <li key={i}>• {s}</li>)}</ul>
      )}
    </div>
  );
}

function MatchesPanel({ matches, loading, hasTargets, converted }: { matches: MatchedUni[]; loading: boolean; hasTargets: boolean; converted: ConvertedGrades | null }) {
  return (
    <div className="rounded-md border border-border bg-heading p-5 shadow-sm">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <p className="font-heading text-base font-bold text-foreground">Matched Universities {matches.length > 0 && <span className="ml-1 text-xs font-normal text-muted-foreground">({matches.length})</span>}</p>
        {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
      </div>
      {!hasTargets && <p className="mt-3 text-xs text-muted-foreground">Pick target countries to see matches.</p>}
      {hasTargets && matches.length === 0 && !loading && <p className="mt-3 text-xs text-muted-foreground">No matches yet — adjust your filters or grades.</p>}
      <div className="mt-3 max-h-[60vh] space-y-3 overflow-y-auto pr-1">
        {matches.slice(0, 12).map(m => <MatchRow key={m.slug} m={m} converted={converted} />)}
      </div>
    </div>
  );
}

function MatchRow({ m, converted }: { m: MatchedUni; converted: ConvertedGrades | null }) {
  return (
    <div className="overflow-hidden rounded border border-border bg-heading">
      <div className="relative h-20 bg-muted">
        <SmartCampusImage src={m.campus_image_url} name={m.name} noOverlay />
        <div className="absolute inset-0 bg-gradient-to-t from-background/70 to-transparent" />
        <div className="absolute right-2 top-2 rounded bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">{m.matchPct}% match</div>
        <div className="absolute bottom-1.5 left-2"><SmartLogo name={m.name} logoUrl={m.logo_url} size={28} /></div>
      </div>
      <div className="p-3">
        <p className="line-clamp-1 text-sm font-semibold text-foreground">{m.name}</p>
        <p className="text-[11px] text-muted-foreground">{m.city ? `${m.city}, ` : ""}{m.country}{m.qs_rank ? ` · QS #${m.qs_rank}` : ""}</p>
        {converted && (
          <p className="mt-1.5 text-[11px] text-foreground">
            {m.meetsGpa
              ? <>Your US {converted.us4.toFixed(2)} meets requirement <CheckCircle2 className="inline h-3 w-3 text-accent" /></>
              : <span className="text-rose-700">Your US {converted.us4.toFixed(2)} below typical requirement</span>}
          </p>
        )}
        <div className="mt-2 flex items-center justify-between">
          {m.tuition_display ? <Badge variant="outline" className="text-[10px]">{m.tuition_display}</Badge> : <span />}
          <Link to="/universities/$slug" params={{ slug: m.slug }} className="text-[11px] font-semibold text-primary hover:underline">View Details →</Link>
        </div>
      </div>
    </div>
  );
}

/* ----------------------------- RESULTS (legacy view for shared links) ----------------------------- */

export function ResultsView({
  result, canSave, onSave, saving, onReset,
}: {
  result: { converted: ConvertedGrades; breakdown: ScoreBreakdown; matches: MatchedUni[] };
  canSave: boolean;
  onSave?: () => void;
  saving?: boolean;
  onReset?: () => void;
}) {
  const { converted, breakdown, matches } = result;
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">Your evaluation</p>
          <h1 className="mt-1 font-heading text-4xl font-extrabold text-foreground">Profile score: <span className="text-primary">{breakdown.total}/100</span></h1>
          <p className="mt-2 text-sm text-muted-foreground">US <b>{converted.us4.toFixed(2)}</b>/4.0 · UK <b>{converted.uk}</b> · German <b>{converted.german.toFixed(1)}</b> · ECTS <b>{converted.ects}</b> · AU <b>{converted.au7.toFixed(1)}</b>/7.0</p>
        </div>
        <div className="flex gap-2">
          {onReset && <Button variant="outline" onClick={onReset}>Edit answers</Button>}
          {canSave && onSave && (
            <Button onClick={onSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Share2 className="mr-2 h-4 w-4" /> Save & share</>}
            </Button>
          )}
          {!canSave && (<Button asChild><Link to="/auth" search={{ tab: "signup" }}>Sign up to save</Link></Button>)}
        </div>
      </header>

      <section className="mt-8 grid gap-3 sm:grid-cols-5">
        <ScoreTile label="Academic" value={breakdown.academic} max={35} />
        <ScoreTile label="Language" value={breakdown.language} max={20} />
        <ScoreTile label="Standardized" value={breakdown.standardized} max={15} />
        <ScoreTile label="ECA" value={breakdown.eca} max={15} />
        <ScoreTile label="Completeness" value={breakdown.completeness} max={15} />
      </section>

      <section className="mt-6 grid gap-3 md:grid-cols-3">
        <Alert tone="good" Icon={CheckCircle2} title="Strong Points" items={breakdown.strengths} empty="—" />
        <Alert tone="bad" Icon={AlertTriangle} title="Weak Points" items={breakdown.weaknesses} empty="—" />
        <Alert tone="warn" Icon={Lightbulb} title="To Improve" items={breakdown.improvements} empty="—" />
      </section>

      <section className="mt-10">
        <h2 className="font-heading text-2xl font-bold text-foreground">Matched universities <span className="text-sm font-normal text-muted-foreground">({matches.length})</span></h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {matches.map(m => <MatchRow key={m.slug} m={m} converted={converted} />)}
        </div>
      </section>
    </div>
  );
}

function ScoreTile({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div className="rounded-md border border-border bg-heading p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 font-heading text-2xl font-bold text-foreground">{value}<span className="text-sm font-normal text-muted-foreground">/{max}</span></p>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary" style={{ width: `${pct}%` }} /></div>
    </div>
  );
}
