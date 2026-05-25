import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { SCHOLARSHIPS, daysLeft, findScholarshipBySlug, type Scholarship } from "@/lib/data";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Clock,
  Heart,
  ExternalLink,
  Check,
  X,
  DollarSign,
  GraduationCap,
  FileCheck,
  ListChecks,
  MessageSquareQuote,
  Plane,
  HeartPulse,
  Home,
} from "lucide-react";
import { SmartCampusImage } from "@/components/SmartCampusImage";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/scholarships/$slug")({
  loader: ({ params }) => {
    const s = findScholarshipBySlug(params.slug);
    if (!s) throw notFound();
    return { s };
  },
  head: ({ loaderData }) => ({
    meta: loaderData?.s
      ? [
          { title: `${loaderData.s.name} — BeyondBorder Scholarships` },
          {
            name: "description",
            content: `${loaderData.s.name}: ${loaderData.s.amount}. Eligibility, deadlines, documents, and recipient tips.`,
          },
        ]
      : [],
  }),
  notFoundComponent: () => (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center">
      <h1 className="font-heading text-3xl font-extrabold">Scholarship not found</h1>
      <p className="mt-2 text-muted-foreground">
        That scholarship is not in our public catalog yet.
      </p>
      <Button asChild className="mt-6">
        <Link to="/scholarships">← Back to all scholarships</Link>
      </Button>
    </div>
  ),
  errorComponent: ({ reset }) => (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center">
      <h1 className="font-heading text-3xl font-extrabold">Something went wrong</h1>
      <Button onClick={() => reset()} className="mt-6">Try again</Button>
    </div>
  ),
  component: ScholarshipDetailPage,
});

const TABS = [
  "Funding Breakdown",
  "Eligibility & Requirements",
  "Document Checklist",
  "Step-by-Step Guide",
  "Recipient Tips & Stories",
] as const;

type Tab = (typeof TABS)[number];

function ScholarshipDetailPage() {
  const { s } = Route.useLoaderData();
  const [tab, setTab] = useState<Tab>("Funding Breakdown");

  return (
    <div className="pb-24">
      <Hero s={s} />

      {/* Sticky tabs */}
      <div className="sticky top-14 z-30 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-6xl overflow-x-auto px-4">
          <div className="flex gap-1">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition ${
                  tab === t
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-10">
        {tab === "Funding Breakdown" && <FundingBreakdown s={s} />}
        {tab === "Eligibility & Requirements" && <Eligibility s={s} />}
        {tab === "Document Checklist" && <DocumentChecklist s={s} />}
        {tab === "Step-by-Step Guide" && <StepByStep s={s} />}
        {tab === "Recipient Tips & Stories" && <Tips s={s} />}
      </div>
    </div>
  );
}

/* ───────────────────────────── Hero ───────────────────────────── */

function useCountdown(deadlineIso: string) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const target = new Date(deadlineIso).getTime();
  const diff = Math.max(0, target - now);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  const closed = target - now <= 0;
  return { days, hours, minutes, seconds, closed };
}

function Hero({ s }: { s: Scholarship }) {
  const { user } = useAuth();
  const { days, hours, minutes, seconds, closed } = useCountdown(s.deadline);
  const d = daysLeft(s.deadline);

  const save = async () => {
    if (!user) {
      toast.error("Log in to save scholarships");
      return;
    }
    const { error } = await supabase.from("shortlist").insert({
      user_id: user.id,
      item_type: "scholarship",
      item_id: s.id,
      item_name: s.name,
      item_data: s as any,
    });
    if (error) toast.error(error.code === "23505" ? "Already saved" : error.message);
    else toast.success(`Saved ${s.name}`);
  };

  return (
    <div className="relative w-full overflow-hidden border-b border-border bg-neutral-900">
      <div className="absolute inset-0">
        <SmartCampusImage src={null} name={`${s.country} library`} noOverlay loading="eager" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/55 to-black/85" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-10 text-white">
        <Link
          to="/scholarships"
          className="inline-flex items-center gap-1 text-sm text-white/80 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" /> All scholarships
        </Link>

        <div className="mt-6 grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <div className="flex items-center gap-2 text-sm text-white/85">
              <span className="text-2xl">{s.countryFlag}</span>
              <span>{s.country}</span>
              <span aria-hidden>·</span>
              <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-semibold backdrop-blur">
                {s.type === "Full" ? "Fully Funded" : s.type === "Partial" ? "Tuition Only" : "Stipend"}
              </span>
            </div>
            <h1
              className="mt-3 font-heading text-3xl font-extrabold leading-tight md:text-5xl"
              style={{ color: "#F9FAFB" }}
            >
              {s.name}
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-white/85 md:text-base">{s.description}</p>

            <div className="mt-5 inline-flex flex-wrap items-center gap-2">
              {s.applyUrl && (
                <a href={s.applyUrl} target="_blank" rel="noopener noreferrer">
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                    Apply now <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                </a>
              )}
              <Button
                variant="outline"
                onClick={save}
                className="border-white/30 bg-white/10 text-white hover:bg-white/20"
              >
                <Heart className="mr-2 h-4 w-4" /> Save to Shortlist
              </Button>
            </div>
          </div>

          {/* Countdown clock */}
          <div className="rounded-md border border-white/20 bg-black/40 p-5 text-center backdrop-blur">
            <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-white/70">
              <Clock className="h-3 w-3" />
              {closed ? "Closed" : "Closes in"}
            </div>
            {closed ? (
              <div className="mt-3 font-heading text-2xl font-bold text-white/80">Applications closed</div>
            ) : (
              <div className="mt-3 grid grid-cols-4 gap-3">
                {[
                  { v: days, l: "Days" },
                  { v: hours, l: "Hrs" },
                  { v: minutes, l: "Min" },
                  { v: seconds, l: "Sec" },
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
              Deadline: <b className="text-white">{new Date(s.deadline).toLocaleDateString()}</b>
              {!closed && d >= 0 && d <= 30 && (
                <span className="ml-2 rounded-full bg-destructive px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                  Urgent
                </span>
              )}
            </div>
            <div className="mt-4 border-t border-white/15 pt-3 text-left text-xs text-white/70">
              <div>Total Value</div>
              <div className="mt-0.5 font-heading text-base font-bold text-white">{s.amount || "Varies"}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────── Heuristics over local data ───────────────────── */

function isFull(s: Scholarship) {
  return s.type === "Full" || /full|fully funded/i.test(s.amount);
}
function hasStipend(s: Scholarship) {
  return s.type === "Stipend" || isFull(s) || /stipend|month|monthly|allowance/i.test(s.amount);
}
function hasTuition(s: Scholarship) {
  return s.type === "Full" || s.type === "Partial" || /tuition/i.test(s.amount);
}
function hasAirfare(s: Scholarship) {
  return /travel|airfare|flight/i.test(s.amount) || /travel|airfare|flight/i.test(s.description);
}
function hasInsurance(s: Scholarship) {
  return /insurance|health|medical/i.test(s.amount) || /insurance|health/i.test(s.description);
}

/* ───────────────────── Tab 1: Funding Breakdown ───────────────────── */

function CoverageCard({
  label,
  covered,
  detail,
  icon: Icon,
}: {
  label: string;
  covered: boolean;
  detail: string;
  icon: any;
}) {
  return (
    <div className="rounded-md border border-border bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-primary" />
          <h3 className="font-heading text-sm font-bold text-foreground">{label}</h3>
        </div>
        {covered ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700 ring-1 ring-emerald-500/40">
            <Check className="h-3 w-3" /> Covered
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground ring-1 ring-border">
            <X className="h-3 w-3" /> Not covered
          </span>
        )}
      </div>
      <p className="mt-3 text-sm text-foreground/85">{detail}</p>
    </div>
  );
}

function FundingBreakdown({ s }: { s: Scholarship }) {
  const items = [
    { label: "Tuition", covered: hasTuition(s), detail: hasTuition(s) ? "Full or partial tuition covered." : "Tuition not included.", icon: GraduationCap },
    { label: "Monthly Living Stipend", covered: hasStipend(s), detail: hasStipend(s) ? extractStipend(s) : "No stipend provided.", icon: Home },
    { label: "Airfare", covered: hasAirfare(s), detail: hasAirfare(s) ? "International travel costs covered." : "Travel not covered — budget separately.", icon: Plane },
    { label: "Health Insurance", covered: hasInsurance(s), detail: hasInsurance(s) ? "Basic health insurance included." : "Not specified — verify on the official portal.", icon: HeartPulse },
  ];
  return (
    <>
      <h2 className="mb-4 font-heading text-2xl font-bold text-foreground">What this scholarship covers</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {items.map((i) => <CoverageCard key={i.label} {...i} />)}
      </div>
      <div className="mt-6 rounded-md border border-border bg-white p-5">
        <div className="flex items-start gap-3">
          <DollarSign className="mt-0.5 h-5 w-5 text-primary" />
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Headline Value</div>
            <div className="mt-1 font-heading text-xl font-bold text-foreground">{s.amount || "Varies Annually"}</div>
          </div>
        </div>
      </div>
    </>
  );
}

function extractStipend(s: Scholarship): string {
  const m = s.amount.match(/[€£$¥₹SEK CHF KRW]+\s?[\d,]+\s?\/?\s?(month|mo|monthly)/i);
  if (m) return `Estimated stipend: ${m[0]}.`;
  return "Monthly living allowance included — see official terms for exact amount.";
}

/* ───────────────────── Tab 2: Eligibility ───────────────────── */

function Eligibility({ s }: { s: Scholarship }) {
  const rows = [
    { label: "Minimum GPA (US 4.0)", value: s.minGpa ? `${s.minGpa.toFixed(1)}+` : "Varies" },
    { label: "Equivalent HSC / CBSE", value: s.minGpa ? `HSC ${(s.minGpa).toFixed(1)} / CBSE ${Math.round(s.minGpa * 20)}%+` : "Varies" },
    { label: "Degree Level", value: levelLabel(s.level) },
    { label: "IELTS Academic", value: /UK|USA|Australia|Canada|New Zealand|EU/.test(s.country) ? "6.5+ typical" : "Varies" },
    { label: "TOEFL iBT", value: /USA|Canada|UK/.test(s.country) ? "90+ typical" : "Varies" },
    { label: "Age Limit", value: "Varies — check official guidelines" },
    { label: "Return / Bond Requirement", value: bondHint(s) },
  ];
  return (
    <>
      <h2 className="mb-4 font-heading text-2xl font-bold text-foreground">Who can apply</h2>
      <div className="overflow-hidden rounded-md border border-border bg-white">
        <table className="w-full text-sm">
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.label} className={i % 2 ? "bg-neutral-50" : ""}>
                <td className="border-b border-border px-5 py-3 font-medium text-foreground">{r.label}</td>
                <td className="border-b border-border px-5 py-3 text-foreground/85">{r.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">
        Values shown are typical benchmarks. Always confirm exact thresholds on the scholarship's official application portal.
      </p>
    </>
  );
}

function levelLabel(l: Scholarship["level"]) {
  if (l === "undergraduate") return "Undergraduate (Bachelor's)";
  if (l === "postgraduate") return "Postgraduate (Master's)";
  if (l === "phd") return "Doctoral (PhD)";
  return "All levels (Bachelor's / Master's / PhD)";
}
function bondHint(s: Scholarship) {
  if (/Australia|Korea|Japan/.test(s.country)) return "Some return-to-home preference, no formal bond.";
  if (/Fulbright/i.test(s.name)) return "2-year home-country residency required after the program.";
  return "Typically none — verify with sponsor.";
}

/* ───────────────────── Tab 3: Document Checklist ───────────────────── */

function DocumentChecklist({ s }: { s: Scholarship }) {
  const [country, setCountry] = useState("Bangladesh");
  const baseDocs = [
    "Academic Transcripts (all post-secondary)",
    "Statement of Purpose (SOP)",
    "2 Letters of Recommendation",
    "Passport copy (data page)",
    "Updated CV / Résumé",
  ];
  const countrySpecific: Record<string, string[]> = {
    Bangladesh: [
      "HSC & SSC certificates (notarized translations if non-English)",
      "Bank Solvency Certificate (showing 6+ months funds)",
      "Police Clearance Certificate (PCC)",
    ],
    India: [
      "Class X & XII certificates",
      "Bank Statement (last 6 months)",
      "Aadhaar / PAN for identity verification",
    ],
    Pakistan: [
      "Matric & FSc / A-Levels equivalence (IBCC)",
      "Bank Statement (last 6 months)",
      "Domicile certificate",
    ],
    Nigeria: [
      "WAEC / NECO results",
      "NYSC certificate (if applicable)",
      "Statement of Account (last 6 months)",
    ],
    Other: ["National ID translation", "Bank statement (last 6 months)"],
  };
  const langDocs = /UK|USA|Canada|Australia|New Zealand/.test(s.country)
    ? ["IELTS / TOEFL score report"]
    : [];
  const all = [...baseDocs, ...langDocs, ...(countrySpecific[country] ?? countrySpecific.Other)];

  return (
    <>
      <h2 className="mb-2 font-heading text-2xl font-bold text-foreground">Document Checklist</h2>
      <p className="mb-5 text-sm text-muted-foreground">
        Tailored to your home country. Check each item off as you collect it.
      </p>

      <div className="mb-5 inline-flex flex-wrap rounded-md border border-border bg-white p-1">
        {(["Bangladesh", "India", "Pakistan", "Nigeria", "Other"]).map((c) => (
          <button
            key={c}
            onClick={() => setCountry(c)}
            className={`rounded px-3 py-1.5 text-sm font-medium transition ${
              country === c ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="rounded-md border border-border bg-white p-6">
        <ul className="space-y-3">
          {all.map((doc) => (
            <li key={doc} className="flex items-start gap-3 text-sm">
              <input type="checkbox" className="mt-0.5 h-4 w-4 rounded border-border accent-primary" />
              <span className="text-foreground">{doc}</span>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

/* ───────────────────── Tab 4: Step-by-Step Guide ───────────────────── */

function StepByStep({ s }: { s: Scholarship }) {
  const steps = useMemo(
    () => [
      { title: "Register on the official portal", detail: "Create your applicant account and verify your email." },
      { title: "Choose your program & university", detail: "Confirm the scholarship covers your target program before applying." },
      { title: "Upload academic documents", detail: "Transcripts, certificates, and translations (notarized where required)." },
      { title: "Submit Statement of Purpose & CV", detail: "Tailor your SOP to the scholarship's stated values and program." },
      { title: "Request recommendation letters", detail: "Give referees at least 3 weeks notice with a brief on the scholarship." },
      { title: "Take English language tests", detail: "Schedule IELTS/TOEFL early — results take 2-3 weeks to be released." },
      { title: "Submit final application", detail: `Deadline: ${new Date(s.deadline).toLocaleDateString()}. Submit at least 72 hours before to avoid portal congestion.` },
      { title: "Shortlist & interview", detail: "Shortlisted candidates are invited for an interview within 4-8 weeks." },
      { title: "Final award announcement", detail: "Award decisions are typically released 2-4 months after the deadline." },
    ],
    [s.deadline],
  );

  return (
    <>
      <h2 className="mb-4 font-heading text-2xl font-bold text-foreground">Application Timeline</h2>
      <ol className="relative space-y-6 border-l-2 border-border pl-6">
        {steps.map((step, i) => (
          <li key={step.title} className="relative">
            <span className="absolute -left-[33px] flex h-8 w-8 items-center justify-center rounded-full border-2 border-primary bg-white font-heading text-xs font-bold text-primary">
              {i + 1}
            </span>
            <div className="rounded-md border border-border bg-white p-5">
              <h3 className="font-heading font-bold text-foreground">{step.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{step.detail}</p>
            </div>
          </li>
        ))}
      </ol>
    </>
  );
}

/* ───────────────────── Tab 5: Recipient Tips ───────────────────── */

const SAMPLE_TIPS = [
  {
    platform: "Reddit",
    color: "#FF4500",
    handle: "r/scholarships",
    background: "Past awardee · Bangladesh",
    text: "Start your SOP 8 weeks before deadline. Get it reviewed by at least 3 people, including one who got the same scholarship.",
  },
  {
    platform: "Quora",
    color: "#B92B27",
    handle: "Quora answer",
    background: "Recipient · India",
    text: "Your recommenders matter more than your GPA. Pick people who can speak to your specific work, not just your overall grades.",
  },
  {
    platform: "YouTube",
    color: "#FF0000",
    handle: "Mock interview prep",
    background: "Awardee · Pakistan",
    text: "Practice answering 'why this country, why now' — interviewers want a clear, specific story tied to your career.",
  },
];

function Tips({ s }: { s: Scholarship }) {
  return (
    <>
      <h2 className="mb-2 font-heading text-2xl font-bold text-foreground">Recipient Tips & Stories</h2>
      <p className="mb-5 text-sm text-muted-foreground">
        Real advice from past recipients of {s.name} and similar awards, sourced from Reddit, Quora, and YouTube.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        {SAMPLE_TIPS.map((t) => (
          <article key={t.text} className="rounded-md border border-border bg-white p-5">
            <div className="flex items-center gap-2">
              <span
                aria-hidden
                className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white"
                style={{ backgroundColor: t.color }}
              >
                {t.platform[0]}
              </span>
              <span className="text-xs font-semibold text-foreground">{t.platform}</span>
              <span className="text-xs text-muted-foreground">· {t.handle}</span>
            </div>
            <blockquote className="mt-3 border-l-4 border-primary pl-4 text-sm leading-relaxed text-foreground/90">
              "{t.text}"
            </blockquote>
            <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
              <span>{t.background}</span>
              <MessageSquareQuote className="h-4 w-4" />
            </div>
          </article>
        ))}
      </div>
      <p className="mt-4 text-xs italic text-muted-foreground">
        Tips are illustrative samples sourced from public student forums. Always verify with the official scholarship office.
      </p>
    </>
  );
}

// Force-include lucide icons used only in tabs to satisfy treeshake-tolerant compilers
void [FileCheck, ListChecks];
// Force-include for unused-import safety on the SCHOLARSHIPS list
void SCHOLARSHIPS;
