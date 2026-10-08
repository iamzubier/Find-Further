import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GraduationCap, Target, BarChart3, Trophy, Check, Sparkles, ChevronLeft, ChevronRight } from "lucide-react";
import { gpaConversionLine } from "@/lib/gpa";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Your profile — FindFurther" }, { name: "robots", content: "noindex" }] }),
  component: ProfilePage,
});

const BD_BOARDS = ["Dhaka","Chittagong","Rajshahi","Khulna","Barishal","Sylhet","Comilla","Dinajpur","Jessore","Madrasah","Technical"];
const A_LEVEL_BOARDS = ["Cambridge (CIE)","Edexcel","AQA","Other"];
const COUNTRIES_FULL = ["USA","UK","Germany","Finland","Norway","Australia","Italy","Netherlands","Sweden","Canada","Japan","South Korea"];
const PROGRAMS = ["Computer Science","Engineering","Business","Medicine","Data Science","Architecture","Economics","Design"];
const INTAKES = ["Fall 2026","Spring 2027","Fall 2027","Spring 2028"];
const BUDGETS = ["$0–$2k","$2k–$10k","$10k–$25k","$25k+"];

const SECTIONS = [
  { id: "academic", label: "Academic", icon: GraduationCap },
  { id: "goals", label: "Goals", icon: Target },
  { id: "scores", label: "Test Scores", icon: BarChart3 },
  { id: "eca", label: "ECA", icon: Trophy },
] as const;

function ProfilePage() {
  const { user } = useAuth();
  const [section, setSection] = useState<typeof SECTIONS[number]["id"]>("academic");
  const [p, setP] = useState<any>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle().then(({ data }) => setP(data ?? {}));
  }, [user]);

  const set = (k: string, v: any) => setP((prev: any) => ({ ...prev, [k]: v }));

  const strength = useMemo(() => {
    const fields = ["name","education_level","ssc_gpa","ssc_board","hsc_gpa","hsc_board","medium","program","intake","budget","ielts","eca","countries"];
    let f = 0;
    for (const k of fields) {
      const v = (p as any)[k];
      if (Array.isArray(v) ? v.length > 0 : v !== undefined && v !== null && v !== "") f++;
    }
    return Math.round((f / fields.length) * 100);
  }, [p]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const payload = { ...p, id: user.id };
    const { error } = await supabase.from("profiles").upsert(payload);
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("✓ Saved");
  };

  const sectionIdx = SECTIONS.findIndex(s => s.id === section);
  const prev = () => sectionIdx > 0 && setSection(SECTIONS[sectionIdx - 1].id);
  const next = () => sectionIdx < SECTIONS.length - 1 && setSection(SECTIONS[sectionIdx + 1].id);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl font-extrabold md:text-4xl">Your profile</h1>
          <p className="mt-1 text-sm text-muted-foreground">The more we know, the better your matches.</p>
        </div>
        <StrengthBar value={strength} />
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-[220px_1fr]">
        <aside className="card-surface h-fit p-3">
          <div className="mb-3 px-3 pt-2 text-xs uppercase tracking-wide text-muted-foreground">Sections</div>
          <nav className="space-y-1">
            {SECTIONS.map(s => {
              const Icon = s.icon;
              const active = s.id === section;
              return (
                <button key={s.id} onClick={() => setSection(s.id)}
                  className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                    active ? "bg-primary/15 text-primary" : "text-foreground/80 hover:bg-secondary"
                  }`}>
                  <Icon className="h-4 w-4" /> {s.label}
                </button>
              );
            })}
          </nav>
          <div className="mt-4 border-t border-border p-3">
            <StrengthBar value={strength} mini />
          </div>
        </aside>

        <div className="card-surface p-6 md:p-8">
          {section === "academic" && <AcademicSection p={p} set={set} />}
          {section === "goals" && <GoalsSection p={p} set={set} />}
          {section === "scores" && <ScoresSection p={p} set={set} />}
          {section === "eca" && <EcaSection p={p} set={set} />}

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6">
            <Button variant="outline" onClick={prev} disabled={sectionIdx === 0}>
              <ChevronLeft className="mr-1 h-4 w-4" /> Previous
            </Button>
            <div className="flex gap-2">
              <Button onClick={save} disabled={saving} className="bg-primary text-primary-foreground hover:bg-primary/90">
                {saving ? "Saving…" : <><Check className="mr-2 h-4 w-4" /> Save</>}
              </Button>
              <Button variant="outline" onClick={next} disabled={sectionIdx === SECTIONS.length - 1}>
                Next <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StrengthBar({ value, mini }: { value: number; mini?: boolean }) {
  return (
    <div className={mini ? "" : "w-full md:w-72"}>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Profile strength</span>
        <span className="font-semibold text-primary">{value}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-secondary">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function Section({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="font-heading text-xl font-extrabold">{title}</h2>
      {sub && <p className="mt-1 text-sm text-muted-foreground">{sub}</p>}
      <div className="mt-5 grid gap-4">{children}</div>
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 md:grid-cols-2">{children}</div>;
}

function F({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function AcademicSection({ p, set }: any) {
  const conv = gpaConversionLine(p.hsc_gpa);
  return (
    <Section title="Academic" sub="Your school results — both SSC and HSC (or O/A levels).">
      <Row>
        <F label="SSC GPA (out of 5.00)"><Input type="number" step="0.01" max={5} value={p.ssc_gpa ?? ""} onChange={e => set("ssc_gpa", e.target.value ? +e.target.value : null)} placeholder="e.g. 5.00" /></F>
        <F label="SSC Board">
          <Select value={p.ssc_board ?? ""} onValueChange={v => set("ssc_board", v)}>
            <SelectTrigger><SelectValue placeholder="Pick board" /></SelectTrigger>
            <SelectContent>{BD_BOARDS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
          </Select>
        </F>
      </Row>
      <F label="SSC Subjects (main)"><Input value={p.ssc_subjects ?? ""} onChange={e => set("ssc_subjects", e.target.value)} placeholder="e.g. Science group, Physics, Higher Math…" /></F>
      <Row>
        <F label="HSC GPA / A-level grades"><Input value={p.hsc_gpa ?? ""} onChange={e => set("hsc_gpa", e.target.value ? +e.target.value : null)} placeholder="e.g. 4.80 or A*A*A" /></F>
        <F label="HSC Board / Curriculum">
          <Select value={p.hsc_board ?? ""} onValueChange={v => set("hsc_board", v)}>
            <SelectTrigger><SelectValue placeholder="Pick" /></SelectTrigger>
            <SelectContent>{[...BD_BOARDS, ...A_LEVEL_BOARDS].map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
          </Select>
        </F>
      </Row>
      <F label="HSC Subjects"><Input value={p.hsc_subjects ?? ""} onChange={e => set("hsc_subjects", e.target.value)} placeholder="e.g. Physics, Chemistry, Higher Math, ICT" /></F>
      <F label="Medium of instruction">
        <Select value={p.medium ?? ""} onValueChange={v => set("medium", v)}>
          <SelectTrigger><SelectValue placeholder="Pick" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Bangla medium">Bangla medium</SelectItem>
            <SelectItem value="English medium">English medium</SelectItem>
            <SelectItem value="English version">English version</SelectItem>
          </SelectContent>
        </Select>
      </F>
      {conv && <div className="rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-xs text-foreground">📊 {conv}</div>}
    </Section>
  );
}

function GoalsSection({ p, set }: any) {
  const countries: string[] = p.countries ?? [];
  const toggle = (c: string) => set("countries", countries.includes(c) ? countries.filter(x => x !== c) : [...countries, c]);
  return (
    <Section title="Goals" sub="Where you want to go and what you want to study.">
      <F label="Target countries (pick any)">
        <div className="flex flex-wrap gap-2">
          {COUNTRIES_FULL.map(c => {
            const on = countries.includes(c);
            return <button key={c} type="button" onClick={() => toggle(c)} className={`rounded-full px-3 py-1.5 text-sm ${on ? "bg-primary text-primary-foreground" : "border border-border bg-secondary text-foreground hover:border-primary/40"}`}>{c}</button>;
          })}
        </div>
      </F>
      <Row>
        <F label="Program">
          <Select value={p.program ?? ""} onValueChange={v => set("program", v)}>
            <SelectTrigger><SelectValue placeholder="Pick" /></SelectTrigger>
            <SelectContent>{PROGRAMS.map(x => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent>
          </Select>
        </F>
        <F label="Target intake">
          <Select value={p.intake ?? ""} onValueChange={v => set("intake", v)}>
            <SelectTrigger><SelectValue placeholder="Pick" /></SelectTrigger>
            <SelectContent>{INTAKES.map(x => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent>
          </Select>
        </F>
      </Row>
      <F label="Budget (per year)">
        <div className="flex flex-wrap gap-2">
          {BUDGETS.map(b => {
            const on = p.budget === b;
            return <button key={b} type="button" onClick={() => set("budget", b)} className={`rounded-full px-3 py-1.5 text-sm ${on ? "bg-primary text-primary-foreground" : "border border-border bg-secondary text-foreground hover:border-primary/40"}`}>{b}</button>;
          })}
        </div>
      </F>
      <F label="Scholarship need">
        <div className="flex flex-wrap gap-2">
          {["Full","Partial","Don't need"].map(b => {
            const on = p.scholarship_need === b;
            return <button key={b} type="button" onClick={() => set("scholarship_need", b)} className={`rounded-full px-3 py-1.5 text-sm ${on ? "bg-primary text-primary-foreground" : "border border-border bg-secondary text-foreground hover:border-primary/40"}`}>{b}</button>;
          })}
        </div>
      </F>
    </Section>
  );
}

function ScoresSection({ p, set }: any) {
  return (
    <Section title="Test Scores" sub="">
      <div className="rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-xs text-foreground">
        💡 Haven't taken a test yet? Leave it blank — we'll still find matches.
      </div>
      <Row>
        <F label="IELTS (0–9)"><Input type="number" step="0.5" max={9} value={p.ielts ?? ""} onChange={e => set("ielts", e.target.value ? +e.target.value : null)} /></F>
        <F label="TOEFL (0–120)"><Input type="number" max={120} value={p.toefl ?? ""} onChange={e => set("toefl", e.target.value ? +e.target.value : null)} /></F>
      </Row>
      <Row>
        <F label="SAT (400–1600)"><Input type="number" max={1600} value={p.sat ?? ""} onChange={e => set("sat", e.target.value ? +e.target.value : null)} /></F>
        <F label="ACT (1–36)"><Input type="number" max={36} value={p.act ?? ""} onChange={e => set("act", e.target.value ? +e.target.value : null)} /></F>
      </Row>
    </Section>
  );
}

function EcaSection({ p, set }: any) {
  const text: string = p.eca ?? "";
  const count = text.length;
  const feedback = count === 0 ? "" :
    count < 150 ? "Add more detail for better AI analysis" :
    count < 400 ? "Getting there — be specific about role, impact, dates" :
    "Good amount of detail ✓";
  return (
    <Section title="ECA & extracurriculars" sub="List clubs, leadership, awards, sports, volunteering, internships, projects.">
      <Textarea
        value={text} onChange={(e) => set("eca", e.target.value)} rows={8}
        placeholder={"e.g. President of Robotics Club (2024–present) — led team of 12 to national runners-up at NRC.\nVolunteer math tutor at Bidyanondo (60+ hours).\nBuilt a Bangla OCR Android app, 500+ downloads."}
      />
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{count} characters</span><span>{feedback}</span>
      </div>
      <div className="card-surface mt-2 flex items-start gap-3 p-4">
        <div className="rounded-full bg-primary/15 p-2"><Sparkles className="h-4 w-4 text-primary" /></div>
        <div>
          <div className="font-heading text-sm font-extrabold">AI evaluation</div>
          <p className="text-xs text-muted-foreground">Once you save, Aria will evaluate how relevant your ECA is to your intended major. Ask her in the AI tab.</p>
        </div>
      </div>
    </Section>
  );
}
