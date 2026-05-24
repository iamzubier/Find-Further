import type { University } from "./data";
import { bdToUs } from "./gpa";

export type Verdict = "Safety" | "Match" | "Reach" | "Long shot";

export type MatchResult = {
  score: number; // 0-100
  verdict: Verdict;
  reasons: string[];
};

export type ProfileLike = {
  hsc_gpa?: number | null;
  ssc_gpa?: number | null;
  ielts?: number | null;
  toefl?: number | null;
  sat?: number | null;
  countries?: string[] | null;
  program?: string | null;
  budget?: string | null;
};

const BUDGET_CAP_USD: Record<string, number> = {
  "Under $5k": 5000,
  "$5k–15k": 15000,
  "$15k–30k": 30000,
  "$30k+": 100000,
};

// Rough tuition-in-USD estimate per uni (heuristic, lightweight).
function estimateTuitionUsd(u: University): number {
  const t = u.tuition.toLowerCase();
  if (t.includes("€0") || t.includes("zero") || t.includes("$0")) return 0;
  if (t.includes("€350") || t.includes("free")) return 500;
  if (t.includes("€900") || t.includes("€2,000")) return 3000;
  if (t.includes("€10") || t.includes("€11") || t.includes("€12")) return 12000;
  if (t.includes("£26")) return 33000;
  if (t.includes("nok 130")) return 13000;
  if (t.includes("sek 310")) return 30000;
  if (t.includes("a$45")) return 30000;
  if (t.includes("s$17")) return 13000;
  if (t.includes("need-blind") || t.includes("if family")) return 0;
  return 20000;
}

export function matchUniversity(u: University, p: ProfileLike): MatchResult {
  const reasons: string[] = [];
  let score = 0;
  let weight = 0;

  // GPA fit (35%)
  if (p.hsc_gpa && u.minGpa) {
    weight += 35;
    const gap = p.hsc_gpa - u.minGpa;
    if (gap >= 0.3) {
      score += 35;
      reasons.push(`Your GPA ${p.hsc_gpa.toFixed(2)} ≈ US ${bdToUs(p.hsc_gpa).toFixed(1)} comfortably clears their ${u.minGpa.toFixed(1)} bar.`);
    } else if (gap >= 0) {
      score += 25;
      reasons.push(`Your GPA ${p.hsc_gpa.toFixed(2)} just meets the ${u.minGpa.toFixed(1)} cutoff — strong essays needed.`);
    } else if (gap >= -0.3) {
      score += 12;
      reasons.push(`Your GPA is slightly below their ${u.minGpa.toFixed(1)} minimum — reach territory.`);
    } else {
      reasons.push(`GPA gap of ${Math.abs(gap).toFixed(1)} below their cutoff — long shot.`);
    }
  }

  // Country fit (20%)
  if (p.countries && p.countries.length > 0) {
    weight += 20;
    if (p.countries.includes(u.country)) {
      score += 20;
      reasons.push(`${u.country} is on your target list.`);
    }
  }

  // Program fit (15%)
  if (p.program) {
    weight += 15;
    if (u.programs.includes(p.program)) {
      score += 15;
      reasons.push(`Offers ${p.program} — your intended major.`);
    }
  }

  // Test fit (15%) — rough thresholds
  if (p.ielts || p.toefl) {
    weight += 10;
    const ielts = p.ielts ?? 0;
    const toefl = p.toefl ?? 0;
    if (ielts >= 7.0 || toefl >= 100) {
      score += 10;
      reasons.push(`Your English scores (IELTS ${ielts || "—"} / TOEFL ${toefl || "—"}) exceed the typical bar.`);
    } else if (ielts >= 6.5 || toefl >= 90) {
      score += 7;
    } else if (ielts >= 6.0 || toefl >= 80) {
      score += 4;
    }
  }
  if (p.sat && (u.country === "USA" || u.qsRank <= 50)) {
    weight += 10;
    if (p.sat >= 1500) { score += 10; reasons.push(`SAT ${p.sat} is in the competitive range.`); }
    else if (p.sat >= 1400) score += 7;
    else if (p.sat >= 1300) score += 4;
  }

  // Budget fit (15%)
  if (p.budget && BUDGET_CAP_USD[p.budget] !== undefined) {
    weight += 15;
    const cap = BUDGET_CAP_USD[p.budget];
    const cost = estimateTuitionUsd(u);
    if (cost <= cap) {
      score += 15;
      if (cost === 0) reasons.push("Tuition is effectively zero — fits any budget.");
      else reasons.push(`Estimated tuition ~$${cost.toLocaleString()} fits your "${p.budget}" budget.`);
    } else if (cost <= cap * 1.5) {
      score += 7;
    }
  }

  const normalized = weight > 0 ? Math.round((score / weight) * 100) : 50;
  const verdict: Verdict =
    normalized >= 85 ? "Safety" :
    normalized >= 60 ? "Match" :
    normalized >= 35 ? "Reach" : "Long shot";

  return { score: normalized, verdict, reasons: reasons.slice(0, 3) };
}

export const VERDICT_STYLES: Record<Verdict, { bg: string; text: string; ring: string }> = {
  "Safety":    { bg: "bg-primary/15",    text: "text-primary",       ring: "ring-primary/30" },
  "Match":     { bg: "bg-sky-500/15",    text: "text-sky-400",       ring: "ring-sky-500/30" },
  "Reach":     { bg: "bg-amber-500/15",  text: "text-amber-400",     ring: "ring-amber-500/30" },
  "Long shot": { bg: "bg-rose-500/15",   text: "text-rose-400",      ring: "ring-rose-500/30" },
};
