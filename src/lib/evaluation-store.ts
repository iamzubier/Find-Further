// Client-side cache of the user's latest evaluation summary.
// Used everywhere we want to show inline curriculum conversion / "your chances".
import type { CurriculumId, RawGrade, ConvertedGrades } from "./curriculum";

export type EvalSummary = {
  country: string;
  curriculum: CurriculumId;
  raw: RawGrade;
  converted: ConvertedGrades;
  tests: { ielts?: number; toefl?: number; sat?: number; act?: number; duolingo?: number };
  targetCountries: string[];
  score: number;
  ts: number;
};

const KEY = "bb_eval_v1";

export function saveEvalSummary(s: EvalSummary) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {}
}

export function loadEvalSummary(): EvalSummary | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as EvalSummary;
  } catch { return null; }
}

export function clearEvalSummary() {
  try { localStorage.removeItem(KEY); } catch {}
}
