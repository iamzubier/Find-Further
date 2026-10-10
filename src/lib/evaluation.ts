import type { ConvertedGrades } from "./curriculum";

export type TestScores = {
  ielts?: number; toefl?: number; duolingo?: number; pte?: number;
  sat?: number; act?: number;
};

export type EvalInput = {
  converted: ConvertedGrades;
  tests: TestScores;
  ecaText: string;
  targetCountries: string[];
  budget?: string;
  scholarshipNeed?: string;
  intendedMajor?: string;
};

export type ScoreBreakdown = {
  academic: number;     // /35
  language: number;     // /20
  standardized: number; // /15
  eca: number;          // /15
  completeness: number; // /15
  total: number;        // /100
  strengths: string[];
  weaknesses: string[];
  improvements: string[];
};

export function scoreProfile(p: EvalInput): ScoreBreakdown {
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const improvements: string[] = [];

  // Academic (35)
  let academic = Math.round((p.converted.us4 / 4.0) * 35);
  if (p.converted.us4 >= 3.8) strengths.push(`Excellent grades — US ${p.converted.us4.toFixed(2)}/4.0 puts you in top-tier admit range.`);
  else if (p.converted.us4 >= 3.3) strengths.push(`Solid grades — US ${p.converted.us4.toFixed(2)}/4.0 opens most ranked universities.`);
  else { weaknesses.push(`Grades (US ${p.converted.us4.toFixed(2)}/4.0) are below the top-100 threshold.`); improvements.push("Target universities in 100–300 QS range or strengthen with high test scores."); }

  // Language (20)
  let language = 0;
  const ielts = p.tests.ielts ?? 0;
  const toefl = p.tests.toefl ?? 0;
  const duo = p.tests.duolingo ?? 0;
  if (ielts >= 7.5 || toefl >= 105 || duo >= 130) { language = 20; strengths.push("Top-band English score — accepted at any university."); }
  else if (ielts >= 7.0 || toefl >= 100 || duo >= 120) language = 17;
  else if (ielts >= 6.5 || toefl >= 90 || duo >= 110) language = 13;
  else if (ielts >= 6.0 || toefl >= 80) { language = 8; weaknesses.push("English score below 7.0 — many top programs require higher."); improvements.push("Retake IELTS aiming for 7.0+ overall, no band below 6.5."); }
  else { language = 0; weaknesses.push("No qualifying English test score on file."); improvements.push("Book IELTS or Duolingo within 6 weeks — required for visa and admission."); }

  // Standardized (15)
  let standardized = 0;
  if (p.tests.sat && p.tests.sat >= 1500) { standardized = 15; strengths.push(`SAT ${p.tests.sat} is in the competitive Ivy/MIT range.`); }
  else if (p.tests.sat && p.tests.sat >= 1400) standardized = 12;
  else if (p.tests.sat && p.tests.sat >= 1300) standardized = 8;
  else if (p.tests.act && p.tests.act >= 33) standardized = 15;
  else if (p.tests.act && p.tests.act >= 30) standardized = 11;
  else { standardized = 5; if (p.targetCountries.includes("US")) improvements.push("US applications strongly benefit from SAT 1400+ or ACT 30+."); }

  // ECA (15) — keyword heuristic
  const eca = p.ecaText.toLowerCase();
  let ecaScore = 0;
  const ecaKeywords = ["olympiad","founder","president","captain","national","international","award","winner","gold","silver","research","published","internship","volunteer","leader","organized","champion","mun","debate"];
  const hits = ecaKeywords.filter(k => eca.includes(k)).length;
  ecaScore = Math.min(15, hits * 2 + Math.min(5, Math.floor(p.ecaText.length / 120)));
  if (ecaScore >= 12) strengths.push("Strong ECA — leadership and recognition will stand out.");
  else if (ecaScore < 6) { weaknesses.push("ECA section is thin — top universities expect depth and leadership."); improvements.push("Add specifics: roles held, scale (school/national), measurable outcomes, awards."); }

  // Completeness (15)
  let completeness = 0;
  if (p.converted.us4 > 0) completeness += 4;
  if (p.tests.ielts || p.tests.toefl || p.tests.duolingo) completeness += 4;
  if (p.tests.sat || p.tests.act) completeness += 2;
  if (p.ecaText.length > 80) completeness += 2;
  if (p.targetCountries.length) completeness += 1;
  if (p.intendedMajor) completeness += 1;
  if (p.budget) completeness += 1;

  const total = academic + language + standardized + ecaScore + completeness;
  return { academic, language, standardized, eca: ecaScore, completeness, total, strengths, weaknesses, improvements };
}

export type MatchedUni = {
  slug: string;
  name: string;
  country: string;
  city: string | null;
  qs_rank: number | null;
  logo_url: string | null;
  campus_image_url: string | null;
  tuition_display: string | null;
    matchPct: number;
  coverage: number;   // 0–1: how much of the score rests on verified data
  gpaKnown: boolean;
  reasons: string[];
  meetsGpa: boolean;
};

/** Match a fetched university_detail row against the evaluation input. */
type Reqs = { min_gpa_us?: number; ielts?: number; toefl?: number; sat_min?: number };

/** Match a fetched university_detail row against the evaluation input.
 *  Only criteria the university has verified data for are scored;
 *  `coverage` says how much of the score rests on real data. */
export function matchUniversity(uni: {
  slug: string; name: string; country: string; city: string | null;
  qs_rank: number | null; logo_url: string | null; campus_image_url: string | null;
  admission_reqs: Reqs | null;
  tuition: { display?: string; per_year_usd?: number } | null;
  scholarships?: unknown[] | null;
}, p: EvalInput): MatchedUni {
  const reasons: string[] = [];
  const reqs: Reqs = uni.admission_reqs ?? {};
  const MAX_WEIGHT = 90;
  let score = 0;
  let weight = 0;

  // Grades (35): only when the university's minimum is known
  const gpaKnown = typeof reqs.min_gpa_us === "number";
  let meetsGpa = false;
  if (gpaKnown) {
    const reqGpa = reqs.min_gpa_us as number;
    const gap = p.converted.us4 - reqGpa;
    weight += 35;
    meetsGpa = gap >= 0;
    if (gap >= 0.3) { score += 35; reasons.push(`Your US ${p.converted.us4.toFixed(2)} comfortably clears their ${reqGpa.toFixed(1)} bar.`); }
    else if (gap >= 0) { score += 26; reasons.push(`Your grade meets their ${reqGpa.toFixed(1)} minimum.`); }
    else if (gap >= -0.3) { score += 12; reasons.push(`Grade slightly below ${reqGpa.toFixed(1)}: reach.`); }
    else { reasons.push(`Grade is well below their ${reqGpa.toFixed(1)} bar.`); }
  }

  // English (20): only when an English requirement is known
  const reqIelts = typeof reqs.ielts === "number" ? reqs.ielts : null;
  const reqToefl = typeof reqs.toefl === "number" ? reqs.toefl : null;
  if (reqIelts !== null || reqToefl !== null) {
    weight += 20;
    const ielts = p.tests.ielts ?? 0;
    const toefl = p.tests.toefl ?? 0;
    const meetsEnglish =
      (reqIelts !== null && ielts >= reqIelts) || (reqToefl !== null && toefl >= reqToefl);
    if (meetsEnglish) { score += 20; reasons.push("English score meets their requirement."); }
    else if (reqIelts !== null && ielts > 0 && ielts >= reqIelts - 0.5) { score += 12; reasons.push(`English is within 0.5 of their IELTS ${reqIelts}.`); }
    else if (ielts || toefl) reasons.push("English score is below their requirement.");
    else reasons.push("No English test on file yet, and they require one.");
  }

  // SAT (15): only when they set a minimum
  if (typeof reqs.sat_min === "number") {
    weight += 15;
    if (p.tests.sat && p.tests.sat >= reqs.sat_min) score += 15;
    else if (p.tests.sat) reasons.push(`SAT is below their ${reqs.sat_min} minimum.`);
    else reasons.push(`They expect SAT ${reqs.sat_min}+ and none is on file.`);
  }

  // Budget (15): only when the student gave a budget and the cost is known
  const cost = uni.tuition?.per_year_usd;
  if (p.budget && typeof cost === "number") {
    weight += 15;
    const cap =
      p.budget === "Fully Funded" ? 1000 :
      p.budget === "Under $5k" ? 5000 :
      p.budget === "$5k–15k" ? 15000 :
      p.budget === "$15k–30k" ? 30000 : 100000;
    if (cost <= cap) { score += 15; if (cost < 1000) reasons.push("Tuition is effectively free."); }
    else if (cost <= cap * 1.5) { score += 7; reasons.push("Tuition is above your budget, but close."); }
    else reasons.push("Tuition is well above your budget.");
  }

  // Scholarships (5): only when the student needs one and we know the list
  if ((p.scholarshipNeed === "yes" || p.scholarshipNeed === "nice") && Array.isArray(uni.scholarships)) {
    weight += 5;
    if (uni.scholarships.length > 0) { score += 5; reasons.push("Scholarships available."); }
  }

  const matchPct = weight > 0 ? Math.round((score / weight) * 100) : 0;
  return {
    slug: uni.slug, name: uni.name, country: uni.country, city: uni.city,
    qs_rank: uni.qs_rank, logo_url: uni.logo_url, campus_image_url: uni.campus_image_url,
    tuition_display: uni.tuition?.display ?? null,
    matchPct, coverage: +(weight / MAX_WEIGHT).toFixed(2), gpaKnown,
    reasons: reasons.slice(0, 3), meetsGpa,
  };
}

export function countryToCode(country: string): string {
  const map: Record<string, string> = {
    "United States": "US", "USA": "US", "United Kingdom": "GB", "UK": "GB",
    "Germany": "DE", "Canada": "CA", "Australia": "AU", "Netherlands": "NL",
    "Sweden": "SE", "Finland": "FI", "Norway": "NO", "Denmark": "DK",
    "Switzerland": "CH", "France": "FR", "Italy": "IT", "Spain": "ES",
    "Japan": "JP", "South Korea": "KR", "Singapore": "SG", "Malaysia": "MY",
    "China": "CN",
  };
  return map[country] ?? country;
}
