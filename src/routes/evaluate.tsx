import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  COUNTRIES, CURRICULUMS, COUNTRY_CURRICULUMS, COUNTRY_OPTIONS,
  convertToAll,
  type CountryCode, type CurriculumId, type RawGrade, type ConvertedGrades,
} from "@/lib/curriculum";
import { computeEvaluation, saveEvaluation } from "@/lib/evaluation.functions";
import type { ScoreBreakdown, MatchedUni } from "@/lib/evaluation";
import { useAuth } from "@/lib/auth";
import { saveEvalSummary } from "@/lib/evaluation-store";
import { ArrowRight, CheckCircle2, AlertTriangle, Lightbulb, Share2, Loader2 } from "lucide-react";

export const Route = createFileRoute("/evaluate")({
  head: () => ({
    meta: [
      { title: "Evaluate My Profile — BeyondBorder" },
      { name: "description", content: "Free profile evaluation for international students. Converts your grades to US, UK, German, and ECTS scales and matches you to universities worldwide." },
      { property: "og:title", content: "Evaluate My Profile — BeyondBorder" },
      { property: "og:description", content: "Get your study-abroad profile scored in 2 minutes. Works for any curriculum." },
    ],
  }),
  component: EvaluatePage,
});

type Step = 1 | 2 | 3 | 4 | 5;

type FormState = {
  country: CountryCode | "";
  curriculum: CurriculumId | "";
  // raw grade fields (curriculum-specific, only the relevant ones are used)
  hscGpa: string; sscGpa: string;
  percentage: string;
  aLevels: string[]; // up to 4
  ibPoints: string;
  usGpa: string;
  gaokao: string;
  abitur: string;
  // tests
  ielts: string; toefl: string; duolingo: string; pte: string;
  sat: string; act: string;
  // goals
  targetCountries: string[];
  intendedMajor: string;
  intake: string;
  budget: string;
  scholarshipNeed: string;
  // eca
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

function EvaluatePage() {
  const [step, setStep] = useState<Step>(1);
  const [f, setF] = useState<FormState>(EMPTY);
  const [result, setResult] = useState<{ converted: ConvertedGrades; breakdown: ScoreBreakdown; matches: MatchedUni[] } | null>(null);
  const computeFn = useServerFn(computeEvaluation);
  const saveFn = useServerFn(saveEvaluation);
  const { user } = useAuth();
  const nav = useNavigate();

  const raw = useMemo(() => buildRawGrade(f), [f]);
  const liveConversion = useMemo(() => raw ? convertToAll(raw) : null, [raw]);

  const compute = useMutation({
    mutationFn: async () => {
      if (!raw) throw new Error("Please fill out your grades first.");
      const payload = {
        home_country: f.country,
        curriculum_type: f.curriculum,
        grades_raw: raw,
        tests: {
          ielts: f.ielts ? +f.ielts : undefined,
          toefl: f.toefl ? +f.toefl : undefined,
          duolingo: f.duolingo ? +f.duolingo : undefined,
          pte: f.pte ? +f.pte : undefined,
          sat: f.sat ? +f.sat : undefined,
          act: f.act ? +f.act : undefined,
        },
        target_countries: f.targetCountries,
        intended_major: f.intendedMajor || null,
        intake: f.intake || null,
        budget: f.budget || null,
        scholarship_need: f.scholarshipNeed || null,
        eca_text: f.ecaText || null,
      };
      return computeFn({ data: payload });
    },
    onSuccess: (data) => {
      setResult(data);
      saveEvalSummary({
        country: f.country, curriculum: f.curriculum as CurriculumId,
        raw: raw!, converted: data.converted,
        tests: {
          ielts: f.ielts ? +f.ielts : undefined, toefl: f.toefl ? +f.toefl : undefined,
          sat: f.sat ? +f.sat : undefined, act: f.act ? +f.act : undefined,
          duolingo: f.duolingo ? +f.duolingo : undefined,
        },
        targetCountries: f.targetCountries,
        score: data.breakdown.total, ts: Date.now(),
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const save = useMutation({
    mutationFn: async () => {
      if (!raw) throw new Error("Missing grades.");
      return saveFn({
        data: {
          home_country: f.country, curriculum_type: f.curriculum, grades_raw: raw,
          tests: {
            ielts: f.ielts ? +f.ielts : undefined, toefl: f.toefl ? +f.toefl : undefined,
            duolingo: f.duolingo ? +f.duolingo : undefined, pte: f.pte ? +f.pte : undefined,
            sat: f.sat ? +f.sat : undefined, act: f.act ? +f.act : undefined,
          },
          target_countries: f.targetCountries, intended_major: f.intendedMajor || null,
          intake: f.intake || null, budget: f.budget || null,
          scholarship_need: f.scholarshipNeed || null, eca_text: f.ecaText || null,
        },
      });
    },
    onSuccess: (data) => { toast.success("Saved! Share the link with anyone."); nav({ to: "/evaluate/results/$id", params: { id: data.id } }); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (result) {
    return (
      <ResultsView
        result={result}
        canSave={!!user}
        onSave={() => save.mutate()}
        saving={save.isPending}
        onReset={() => { setResult(null); setStep(1); }}
      />
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <header className="mb-8">
        <p className="text-sm font-semibold text-primary">Free · 2 minutes · Any curriculum</p>
        <h1 className="mt-2 font-heading text-4xl font-extrabold">Evaluate My Profile</h1>
        <p className="mt-2 text-sm text-muted-foreground">Get your study-abroad profile scored out of 100, with grade conversions to US, UK, German and ECTS scales — and a ranked list of universities that match.</p>
      </header>

      <ProgressBar step={step} />

      <Card className="mt-6 p-6">
        {step === 1 && <StepOrigin f={f} setF={setF} onNext={() => setStep(2)} />}
        {step === 2 && <StepGrades f={f} setF={setF} liveConversion={liveConversion} onBack={() => setStep(1)} onNext={() => setStep(3)} />}
        {step === 3 && <StepTests f={f} setF={setF} onBack={() => setStep(2)} onNext={() => setStep(4)} />}
        {step === 4 && <StepGoals f={f} setF={setF} onBack={() => setStep(3)} onNext={() => setStep(5)} />}
        {step === 5 && <StepEca f={f} setF={setF} onBack={() => setStep(4)} onSubmit={() => compute.mutate()} submitting={compute.isPending} />}
      </Card>
    </div>
  );
}

function ProgressBar({ step }: { step: Step }) {
  const labels = ["Origin", "Grades", "Tests", "Goals", "ECA"];
  return (
    <div className="flex items-center gap-2">
      {labels.map((l, i) => (
        <div key={l} className="flex flex-1 items-center gap-2">
          <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${i + 1 <= step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{i + 1}</div>
          <span className={`hidden text-xs sm:inline ${i + 1 === step ? "font-semibold text-foreground" : "text-muted-foreground"}`}>{l}</span>
        </div>
      ))}
    </div>
  );
}

function StepOrigin({ f, setF, onNext }: { f: FormState; setF: (u: FormState) => void; onNext: () => void }) {
  const curriculums = f.country ? COUNTRY_CURRICULUMS[f.country as CountryCode] : [];
  return (
    <div className="space-y-5">
      <h2 className="text-lg font-bold">Where are you from?</h2>
      <div>
        <label className="text-sm font-medium">Your country</label>
        <Select value={f.country} onValueChange={(v) => setF({ ...f, country: v as CountryCode, curriculum: "" })}>
          <SelectTrigger className="mt-1"><SelectValue placeholder="Choose your country…" /></SelectTrigger>
          <SelectContent>{COUNTRIES.map(c => <SelectItem key={c.code} value={c.code}>{c.flag} {c.name}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div>
        <label className="text-sm font-medium">Your curriculum</label>
        <Select value={f.curriculum} onValueChange={(v) => setF({ ...f, curriculum: v as CurriculumId })} disabled={!f.country}>
          <SelectTrigger className="mt-1"><SelectValue placeholder={f.country ? "Choose your curriculum…" : "Pick a country first"} /></SelectTrigger>
          <SelectContent>{curriculums.map(c => <SelectItem key={c} value={c}>{CURRICULUMS[c].label}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="pt-2">
        <Button onClick={onNext} disabled={!f.country || !f.curriculum} className="w-full">Continue <ArrowRight className="ml-2 h-4 w-4" /></Button>
      </div>
    </div>
  );
}

function StepGrades({ f, setF, liveConversion, onBack, onNext }: { f: FormState; setF: (u: FormState) => void; liveConversion: ConvertedGrades | null; onBack: () => void; onNext: () => void }) {
  const c = f.curriculum;
  return (
    <div className="space-y-5">
      <h2 className="text-lg font-bold">Your academic grades</h2>
      <p className="text-xs text-muted-foreground">{CURRICULUMS[c as CurriculumId]?.label}</p>

      {c === "BD_HSC" && (
        <div className="grid grid-cols-2 gap-4">
          <Field label="HSC GPA (out of 5.00)"><Input type="number" step="0.01" max={5} value={f.hscGpa} onChange={e => setF({ ...f, hscGpa: e.target.value })} placeholder="e.g. 4.75" /></Field>
          <Field label="SSC GPA (optional)"><Input type="number" step="0.01" max={5} value={f.sscGpa} onChange={e => setF({ ...f, sscGpa: e.target.value })} placeholder="e.g. 5.00" /></Field>
        </div>
      )}
      {(c === "CBSE" || c === "ICSE" || c === "PK_FSC") && (
        <Field label={`${c === "PK_FSC" ? "FSc/Matric" : c} percentage`}>
          <Input type="number" max={100} value={f.percentage} onChange={e => setF({ ...f, percentage: e.target.value })} placeholder="e.g. 88" />
        </Field>
      )}
      {c === "A_LEVELS" && (
        <div>
          <p className="mb-2 text-sm font-medium">Your A-Level grades (up to 4)</p>
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
      )}
      {c === "IB" && (
        <Field label="IB Diploma points (out of 45)">
          <Input type="number" max={45} value={f.ibPoints} onChange={e => setF({ ...f, ibPoints: e.target.value })} placeholder="e.g. 38" />
        </Field>
      )}
      {(c === "US_GPA" || c === "CA_GPA") && (
        <Field label={`${c === "US_GPA" ? "US" : "Canadian"} GPA (out of 4.0)`}>
          <Input type="number" step="0.01" max={4} value={f.usGpa} onChange={e => setF({ ...f, usGpa: e.target.value })} placeholder="e.g. 3.8" />
        </Field>
      )}
      {c === "GAOKAO" && (
        <Field label="Gaokao total (out of 750)">
          <Input type="number" max={750} value={f.gaokao} onChange={e => setF({ ...f, gaokao: e.target.value })} placeholder="e.g. 620" />
        </Field>
      )}
      {c === "ABITUR" && (
        <Field label="Abitur grade (1.0 best – 4.0 pass)">
          <Input type="number" step="0.1" min={1} max={6} value={f.abitur} onChange={e => setF({ ...f, abitur: e.target.value })} placeholder="e.g. 1.8" />
        </Field>
      )}

      {liveConversion && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">Live conversion</p>
          <p className="mt-1 text-sm font-medium text-foreground">
            US GPA <b>{liveConversion.us4.toFixed(2)}</b>/4.0 · UK <b>{liveConversion.uk}</b> · German <b>{liveConversion.german.toFixed(1)}</b> · ECTS <b>{liveConversion.ects}</b> · AU <b>{liveConversion.au7.toFixed(1)}</b>/7.0
          </p>
        </div>
      )}

      <div className="flex justify-between pt-2">
        <Button variant="outline" onClick={onBack}>Back</Button>
        <Button onClick={onNext} disabled={!liveConversion}>Continue <ArrowRight className="ml-2 h-4 w-4" /></Button>
      </div>
    </div>
  );
}

function StepTests({ f, setF, onBack, onNext }: { f: FormState; setF: (u: FormState) => void; onBack: () => void; onNext: () => void }) {
  return (
    <div className="space-y-5">
      <h2 className="text-lg font-bold">Test scores (optional but recommended)</h2>
      <p className="text-xs text-muted-foreground">Add any you've taken — we'll show which ones your target unis accept.</p>
      <div className="grid grid-cols-2 gap-4">
        <Field label="IELTS (0–9)"><Input type="number" step="0.5" max={9} value={f.ielts} onChange={e => setF({ ...f, ielts: e.target.value })} /></Field>
        <Field label="TOEFL iBT (0–120)"><Input type="number" max={120} value={f.toefl} onChange={e => setF({ ...f, toefl: e.target.value })} /></Field>
        <Field label="Duolingo (10–160)"><Input type="number" max={160} value={f.duolingo} onChange={e => setF({ ...f, duolingo: e.target.value })} /></Field>
        <Field label="PTE Academic (10–90)"><Input type="number" max={90} value={f.pte} onChange={e => setF({ ...f, pte: e.target.value })} /></Field>
        <Field label="SAT (400–1600)"><Input type="number" max={1600} value={f.sat} onChange={e => setF({ ...f, sat: e.target.value })} /></Field>
        <Field label="ACT (1–36)"><Input type="number" max={36} value={f.act} onChange={e => setF({ ...f, act: e.target.value })} /></Field>
      </div>
      <div className="flex justify-between pt-2">
        <Button variant="outline" onClick={onBack}>Back</Button>
        <Button onClick={onNext}>Continue <ArrowRight className="ml-2 h-4 w-4" /></Button>
      </div>
    </div>
  );
}

function StepGoals({ f, setF, onBack, onNext }: { f: FormState; setF: (u: FormState) => void; onBack: () => void; onNext: () => void }) {
  const toggleCountry = (code: string) => {
    setF({ ...f, targetCountries: f.targetCountries.includes(code) ? f.targetCountries.filter(c => c !== code) : [...f.targetCountries, code] });
  };
  return (
    <div className="space-y-5">
      <h2 className="text-lg font-bold">Where do you want to study?</h2>
      <div>
        <p className="mb-2 text-sm font-medium">Target countries (pick any)</p>
        <div className="flex flex-wrap gap-2">
          {COUNTRY_OPTIONS.map(c => (
            <button key={c.code} type="button" onClick={() => toggleCountry(c.code)}
              className={`rounded-full border px-3 py-1.5 text-sm transition ${f.targetCountries.includes(c.code) ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-secondary"}`}>
              {c.flag} {c.name}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
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
            <SelectContent>{["Under $5k","$5k–15k","$15k–30k","$30k+"].map(x => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="Need scholarship?">
          <Select value={f.scholarshipNeed} onValueChange={(v) => setF({ ...f, scholarshipNeed: v })}>
            <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
            <SelectContent><SelectItem value="yes">Yes, essential</SelectItem><SelectItem value="nice">Nice to have</SelectItem><SelectItem value="no">Not needed</SelectItem></SelectContent>
          </Select>
        </Field>
      </div>
      <div className="flex justify-between pt-2">
        <Button variant="outline" onClick={onBack}>Back</Button>
        <Button onClick={onNext}>Continue <ArrowRight className="ml-2 h-4 w-4" /></Button>
      </div>
    </div>
  );
}

function StepEca({ f, setF, onBack, onSubmit, submitting }: { f: FormState; setF: (u: FormState) => void; onBack: () => void; onSubmit: () => void; submitting: boolean }) {
  const count = f.ecaText.length;
  return (
    <div className="space-y-5">
      <h2 className="text-lg font-bold">Extracurriculars & achievements</h2>
      <p className="text-xs text-muted-foreground">Be specific: roles, scale (school/national/international), recognition, outcomes. Example: "Captain of school debate team, won 1st place in national MUN 2024, organized a 200-student coding bootcamp."</p>
      <Textarea rows={8} maxLength={4000} value={f.ecaText} onChange={e => setF({ ...f, ecaText: e.target.value })} placeholder="List your activities, leadership roles, awards, internships, volunteer work, research, etc." />
      <p className="text-xs text-muted-foreground">{count}/4000 characters</p>
      <div className="flex justify-between pt-2">
        <Button variant="outline" onClick={onBack} disabled={submitting}>Back</Button>
        <Button onClick={onSubmit} disabled={submitting} className="min-w-[160px]">
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Evaluate me <ArrowRight className="ml-2 h-4 w-4" /></>}
        </Button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <div className="mt-1">{children}</div>
    </div>
  );
}

/* ----------------------------- RESULTS ----------------------------- */

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
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-primary">Your evaluation</p>
          <h1 className="mt-1 font-heading text-4xl font-extrabold">Profile score: <span className="text-primary">{breakdown.total}/100</span></h1>
          <p className="mt-2 text-sm text-muted-foreground">US <b>{converted.us4.toFixed(2)}</b>/4.0 · UK <b>{converted.uk}</b> · German <b>{converted.german.toFixed(1)}</b> · ECTS <b>{converted.ects}</b> · AU <b>{converted.au7.toFixed(1)}</b>/7.0</p>
        </div>
        <div className="flex gap-2">
          {onReset && <Button variant="outline" onClick={onReset}>Edit answers</Button>}
          {canSave && onSave && (
            <Button onClick={onSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Share2 className="mr-2 h-4 w-4" /> Save & share</>}
            </Button>
          )}
          {!canSave && (
            <Button asChild><Link to="/auth" search={{ tab: "signup" }}>Sign up to save</Link></Button>
          )}
        </div>
      </header>

      <section className="mt-8 grid gap-4 sm:grid-cols-5">
        <ScoreCard label="Academic" value={breakdown.academic} max={35} />
        <ScoreCard label="Language" value={breakdown.language} max={20} />
        <ScoreCard label="Standardized" value={breakdown.standardized} max={15} />
        <ScoreCard label="ECA" value={breakdown.eca} max={15} />
        <ScoreCard label="Completeness" value={breakdown.completeness} max={15} />
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-3">
        <FeedbackBlock title="What's strong" tone="good" items={breakdown.strengths} Icon={CheckCircle2} />
        <FeedbackBlock title="What's weak" tone="bad" items={breakdown.weaknesses} Icon={AlertTriangle} />
        <FeedbackBlock title="What to improve" tone="warn" items={breakdown.improvements} Icon={Lightbulb} />
      </section>

      <section className="mt-10">
        <h2 className="font-heading text-2xl font-bold">Matched universities <span className="text-sm font-normal text-muted-foreground">({matches.length})</span></h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {matches.map(m => <UniMatchCard key={m.slug} m={m} />)}
        </div>
      </section>
    </div>
  );
}

function ScoreCard({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}<span className="text-sm font-normal text-muted-foreground">/{max}</span></p>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
        <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function FeedbackBlock({ title, tone, items, Icon }: { title: string; tone: "good" | "bad" | "warn"; items: string[]; Icon: typeof CheckCircle2 }) {
  const toneClass = tone === "good" ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400" : tone === "bad" ? "border-rose-500/30 bg-rose-500/5 text-rose-700 dark:text-rose-400" : "border-amber-500/30 bg-amber-500/5 text-amber-700 dark:text-amber-400";
  return (
    <div className={`rounded-xl border p-4 ${toneClass}`}>
      <p className="flex items-center gap-2 text-sm font-bold"><Icon className="h-4 w-4" /> {title}</p>
      {items.length === 0 ? <p className="mt-2 text-xs opacity-80">—</p> : (
        <ul className="mt-2 space-y-1.5 text-sm text-foreground">
          {items.map((s, i) => <li key={i}>• {s}</li>)}
        </ul>
      )}
    </div>
  );
}

function UniMatchCard({ m }: { m: MatchedUni }) {
  return (
    <Link to="/universities/$slug" params={{ slug: m.slug }} className="group block overflow-hidden rounded-xl border border-border bg-card transition hover:shadow-lg">
      <div className="relative h-32 bg-muted">
        {m.campus_image_url && <img src={m.campus_image_url} alt="" className="h-full w-full object-cover" loading="lazy" />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <div className="absolute right-2 top-2 rounded-full bg-emerald-500 px-2.5 py-1 text-xs font-bold text-white">{m.matchPct}% match</div>
        {m.logo_url && <img src={m.logo_url} alt="" className="absolute bottom-2 left-2 h-10 w-10 rounded bg-white p-1" />}
      </div>
      <div className="p-3">
        <p className="line-clamp-1 font-semibold text-foreground group-hover:text-primary">{m.name}</p>
        <p className="text-xs text-muted-foreground">{m.city ? `${m.city}, ` : ""}{m.country} {m.qs_rank ? `· QS #${m.qs_rank}` : ""}</p>
        <div className="mt-2 flex flex-wrap gap-1">
          {m.meetsGpa ? <Badge className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/20">GPA ✓</Badge> : <Badge variant="outline" className="text-rose-600">GPA reach</Badge>}
          {m.tuition_display && <Badge variant="outline" className="text-xs">{m.tuition_display}</Badge>}
        </div>
        {m.reasons[0] && <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{m.reasons[0]}</p>}
      </div>
    </Link>
  );
}
