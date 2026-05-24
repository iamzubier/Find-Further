// Universal curriculum conversion engine.
// 10 source curriculums → 7 target systems.
// All conversions return a unified `ConvertedGrades` object so any UI can render them.

export type CurriculumId =
  | "BD_HSC"
  | "CBSE"
  | "ICSE"
  | "PK_FSC"
  | "A_LEVELS"
  | "IB"
  | "US_GPA"
  | "GAOKAO"
  | "ABITUR"
  | "CA_GPA";

export type CountryCode =
  | "BD" | "IN" | "PK" | "LK" | "NP"
  | "GB" | "DE" | "FR" | "NL" | "SE" | "FI" | "NO" | "DK" | "CH" | "IT" | "ES" | "AT"
  | "US" | "CA" | "MX" | "BR"
  | "CN" | "JP" | "KR" | "SG" | "MY" | "HK" | "ID" | "TH" | "VN" | "PH"
  | "AU" | "NZ"
  | "AE" | "SA" | "QA" | "EG" | "NG" | "KE" | "ZA"
  | "OTHER";

export const COUNTRIES: { code: CountryCode; name: string; flag: string }[] = [
  { code: "BD", name: "Bangladesh", flag: "🇧🇩" },
  { code: "IN", name: "India", flag: "🇮🇳" },
  { code: "PK", name: "Pakistan", flag: "🇵🇰" },
  { code: "LK", name: "Sri Lanka", flag: "🇱🇰" },
  { code: "NP", name: "Nepal", flag: "🇳🇵" },
  { code: "CN", name: "China", flag: "🇨🇳" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧" },
  { code: "DE", name: "Germany", flag: "🇩🇪" },
  { code: "US", name: "United States", flag: "🇺🇸" },
  { code: "CA", name: "Canada", flag: "🇨🇦" },
  { code: "AU", name: "Australia", flag: "🇦🇺" },
  { code: "SG", name: "Singapore", flag: "🇸🇬" },
  { code: "MY", name: "Malaysia", flag: "🇲🇾" },
  { code: "AE", name: "UAE", flag: "🇦🇪" },
  { code: "NG", name: "Nigeria", flag: "🇳🇬" },
  { code: "OTHER", name: "Other", flag: "🌍" },
];

export const CURRICULUMS: Record<CurriculumId, { label: string; scale: string }> = {
  BD_HSC: { label: "Bangladesh HSC/SSC (out of 5.00)", scale: "GPA /5.0" },
  CBSE: { label: "India CBSE (percentage)", scale: "% /100" },
  ICSE: { label: "India ICSE/ISC (percentage)", scale: "% /100" },
  PK_FSC: { label: "Pakistan FSc / Matric (percentage)", scale: "% /100" },
  A_LEVELS: { label: "Cambridge/Edexcel A-Levels", scale: "Grades A*–E" },
  IB: { label: "IB Diploma (out of 45)", scale: "/45" },
  US_GPA: { label: "US GPA (out of 4.0)", scale: "/4.0" },
  GAOKAO: { label: "China Gaokao (out of 750)", scale: "/750" },
  ABITUR: { label: "German Abitur (1.0 best – 4.0 pass)", scale: "1.0–4.0" },
  CA_GPA: { label: "Canadian GPA (out of 4.0)", scale: "/4.0" },
};

export const COUNTRY_CURRICULUMS: Record<CountryCode, CurriculumId[]> = {
  BD: ["BD_HSC", "A_LEVELS", "IB"],
  IN: ["CBSE", "ICSE", "IB"],
  PK: ["PK_FSC", "A_LEVELS", "IB"],
  LK: ["A_LEVELS", "IB"],
  NP: ["A_LEVELS", "IB"],
  CN: ["GAOKAO", "IB", "A_LEVELS"],
  GB: ["A_LEVELS", "IB"],
  DE: ["ABITUR", "IB"],
  US: ["US_GPA", "IB", "A_LEVELS"],
  CA: ["CA_GPA", "IB", "A_LEVELS"],
  AU: ["A_LEVELS", "IB"],
  SG: ["A_LEVELS", "IB"],
  MY: ["A_LEVELS", "IB"],
  AE: ["A_LEVELS", "IB", "CBSE"],
  NG: ["A_LEVELS", "IB"],
  FR: ["IB", "A_LEVELS"], NL: ["IB", "A_LEVELS"], SE: ["IB", "A_LEVELS"],
  FI: ["IB", "A_LEVELS"], NO: ["IB", "A_LEVELS"], DK: ["IB", "A_LEVELS"],
  CH: ["IB", "A_LEVELS"], IT: ["IB"], ES: ["IB"], AT: ["IB", "ABITUR"],
  MX: ["IB"], BR: ["IB"],
  JP: ["IB", "A_LEVELS"], KR: ["IB", "A_LEVELS"], HK: ["A_LEVELS", "IB"],
  ID: ["A_LEVELS", "IB"], TH: ["A_LEVELS", "IB"], VN: ["A_LEVELS", "IB"],
  PH: ["A_LEVELS", "IB"], NZ: ["A_LEVELS", "IB"],
  SA: ["A_LEVELS", "IB"], QA: ["A_LEVELS", "IB"], EG: ["A_LEVELS", "IB"],
  KE: ["A_LEVELS", "IB"], ZA: ["A_LEVELS", "IB"],
  OTHER: ["IB", "A_LEVELS", "US_GPA"],
};

// A grade in any source curriculum is reduced to a normalized 0–4.0 US-equivalent first.
// All other targets derive from that anchor.

export type RawGrade =
  | { curriculum: "BD_HSC"; hscGpa: number; sscGpa?: number }
  | { curriculum: "CBSE" | "ICSE" | "PK_FSC"; percentage: number }
  | { curriculum: "A_LEVELS"; grades: string[] /* ["A*","A","B"] */ }
  | { curriculum: "IB"; points: number /* /45 */ }
  | { curriculum: "US_GPA" | "CA_GPA"; gpa: number /* /4.0 */ }
  | { curriculum: "GAOKAO"; score: number /* /750 */ }
  | { curriculum: "ABITUR"; grade: number /* 1.0 best – 4.0 pass */ };

export type ConvertedGrades = {
  us4: number;          // /4.0
  uk: string;           // First / 2:1 / 2:2 / Third
  german: number;       // 1.0 – 5.0
  ects: string;         // A – F
  au7: number;          // /7.0
  ca4: number;          // /4.0
  percent: number;      // /100
};

const A_LEVEL_POINTS: Record<string, number> = {
  "A*": 56, "A": 48, "B": 40, "C": 32, "D": 24, "E": 16,
};

function normalizeToUs4(raw: RawGrade): number {
  switch (raw.curriculum) {
    case "BD_HSC": {
      const g = raw.hscGpa;
      if (g >= 5.0) return 4.0;
      if (g >= 4.5) return 3.7;
      if (g >= 4.0) return 3.3;
      if (g >= 3.5) return 3.0;
      if (g >= 3.0) return 2.7;
      return Math.max(0, +(g * 0.7).toFixed(2));
    }
    case "CBSE":
    case "ICSE":
    case "PK_FSC": {
      const p = raw.percentage;
      if (p >= 90) return 4.0;
      if (p >= 85) return 3.9;
      if (p >= 80) return 3.7;
      if (p >= 75) return 3.5;
      if (p >= 70) return 3.3;
      if (p >= 65) return 3.0;
      if (p >= 60) return 2.7;
      if (p >= 50) return 2.3;
      return Math.max(0, +(p / 25).toFixed(2));
    }
    case "A_LEVELS": {
      // Use top-3 UCAS-style points, then map.
      const pts = raw.grades
        .map(g => A_LEVEL_POINTS[g.toUpperCase()] ?? 0)
        .sort((a, b) => b - a)
        .slice(0, 3)
        .reduce((a, b) => a + b, 0);
      if (pts >= 144) return 4.0;     // A*A*A*
      if (pts >= 128) return 3.9;     // A*AA
      if (pts >= 120) return 3.7;     // AAA
      if (pts >= 112) return 3.5;     // AAB
      if (pts >= 96)  return 3.3;     // BBB
      if (pts >= 80)  return 3.0;     // BCC
      if (pts >= 64)  return 2.7;     // CCC
      return Math.max(0, +(pts / 36).toFixed(2));
    }
    case "IB": {
      const p = raw.points;
      if (p >= 42) return 4.0;
      if (p >= 38) return 3.9;
      if (p >= 35) return 3.7;
      if (p >= 32) return 3.5;
      if (p >= 30) return 3.3;
      if (p >= 28) return 3.0;
      if (p >= 24) return 2.7;
      return Math.max(0, +(p / 11).toFixed(2));
    }
    case "US_GPA":
    case "CA_GPA":
      return Math.min(4.0, Math.max(0, raw.gpa));
    case "GAOKAO": {
      const s = raw.score;
      if (s >= 680) return 4.0;
      if (s >= 650) return 3.9;
      if (s >= 620) return 3.7;
      if (s >= 590) return 3.5;
      if (s >= 560) return 3.3;
      if (s >= 530) return 3.0;
      if (s >= 500) return 2.7;
      if (s >= 450) return 2.3;
      return Math.max(0, +(s / 175).toFixed(2));
    }
    case "ABITUR": {
      // 1.0 best, 4.0 pass, 5.0+ fail
      const g = raw.grade;
      if (g <= 1.3) return 4.0;
      if (g <= 1.7) return 3.9;
      if (g <= 2.0) return 3.7;
      if (g <= 2.5) return 3.5;
      if (g <= 3.0) return 3.3;
      if (g <= 3.5) return 3.0;
      if (g <= 4.0) return 2.5;
      return 1.5;
    }
  }
}

export function convertToAll(raw: RawGrade): ConvertedGrades {
  const us4 = +normalizeToUs4(raw).toFixed(2);
  const percent = Math.round(us4 * 22.5 + 10); // rough anchor: 4.0→100, 3.0→77, 2.0→55
  const uk =
    us4 >= 3.7 ? "First Class" :
    us4 >= 3.3 ? "2:1 (Upper Second)" :
    us4 >= 2.7 ? "2:2 (Lower Second)" :
    "Third Class";
  const german =
    us4 >= 3.9 ? 1.2 :
    us4 >= 3.7 ? 1.5 :
    us4 >= 3.3 ? 2.0 :
    us4 >= 3.0 ? 2.5 :
    us4 >= 2.7 ? 3.0 : 3.5;
  const ects =
    us4 >= 3.7 ? "A" :
    us4 >= 3.3 ? "B" :
    us4 >= 2.7 ? "C" :
    us4 >= 2.3 ? "D" : "E";
  const au7 = +(Math.min(7, us4 * 1.75)).toFixed(1);
  const ca4 = us4;
  return { us4, uk, german, ects, au7, ca4, percent: Math.min(100, percent) };
}

export function formatRawGrade(raw: RawGrade): string {
  switch (raw.curriculum) {
    case "BD_HSC": return `HSC ${raw.hscGpa.toFixed(2)}/5.00`;
    case "CBSE": return `CBSE ${raw.percentage}%`;
    case "ICSE": return `ICSE/ISC ${raw.percentage}%`;
    case "PK_FSC": return `FSc ${raw.percentage}%`;
    case "A_LEVELS": return `A-Levels ${raw.grades.join(" ")}`;
    case "IB": return `IB ${raw.points}/45`;
    case "US_GPA": return `US GPA ${raw.gpa.toFixed(2)}/4.0`;
    case "CA_GPA": return `Canadian GPA ${raw.gpa.toFixed(2)}/4.0`;
    case "GAOKAO": return `Gaokao ${raw.score}/750`;
    case "ABITUR": return `Abitur ${raw.grade.toFixed(1)}`;
  }
}

/** One-line summary used inline next to any GPA requirement. */
export function conversionLine(raw: RawGrade): string {
  const c = convertToAll(raw);
  return `${formatRawGrade(raw)} = US ${c.us4.toFixed(2)}/4.0 · UK ${c.uk} · German ${c.german.toFixed(1)} · ECTS ${c.ects}`;
}

/** Show requirement vs the student's grade in their own system. */
export function requirementInStudentSystem(
  requiredUs4: number,
  studentCurriculum: CurriculumId,
): string {
  // Inverse mapping — show the threshold expressed in the student's curriculum.
  switch (studentCurriculum) {
    case "BD_HSC": {
      const bd = requiredUs4 >= 4.0 ? 5.0 : requiredUs4 >= 3.7 ? 4.5 : requiredUs4 >= 3.3 ? 4.0 : 3.5;
      return `HSC ${bd.toFixed(1)}+/5.00`;
    }
    case "CBSE":
    case "ICSE":
    case "PK_FSC": {
      const p = Math.round(requiredUs4 >= 4.0 ? 90 : requiredUs4 >= 3.7 ? 85 : requiredUs4 >= 3.3 ? 78 : 70);
      return `${p}%+`;
    }
    case "A_LEVELS":
      return requiredUs4 >= 3.9 ? "A*AA+" : requiredUs4 >= 3.7 ? "AAA" : requiredUs4 >= 3.3 ? "AAB" : "BBB";
    case "IB":
      return requiredUs4 >= 3.9 ? "38/45+" : requiredUs4 >= 3.7 ? "35/45" : requiredUs4 >= 3.3 ? "32/45" : "28/45";
    case "GAOKAO":
      return requiredUs4 >= 3.9 ? "650/750+" : requiredUs4 >= 3.7 ? "620/750" : requiredUs4 >= 3.3 ? "580/750" : "530/750";
    case "ABITUR":
      return requiredUs4 >= 3.9 ? "Abitur ≤1.5" : requiredUs4 >= 3.7 ? "≤2.0" : requiredUs4 >= 3.3 ? "≤2.5" : "≤3.0";
    case "US_GPA":
    case "CA_GPA":
      return `${requiredUs4.toFixed(1)}/4.0`;
  }
}

export const COUNTRY_OPTIONS = [
  { code: "US", name: "USA", flag: "🇺🇸" },
  { code: "GB", name: "UK", flag: "🇬🇧" },
  { code: "DE", name: "Germany", flag: "🇩🇪" },
  { code: "CA", name: "Canada", flag: "🇨🇦" },
  { code: "AU", name: "Australia", flag: "🇦🇺" },
  { code: "NL", name: "Netherlands", flag: "🇳🇱" },
  { code: "SE", name: "Sweden", flag: "🇸🇪" },
  { code: "FI", name: "Finland", flag: "🇫🇮" },
  { code: "NO", name: "Norway", flag: "🇳🇴" },
  { code: "DK", name: "Denmark", flag: "🇩🇰" },
  { code: "CH", name: "Switzerland", flag: "🇨🇭" },
  { code: "FR", name: "France", flag: "🇫🇷" },
  { code: "IT", name: "Italy", flag: "🇮🇹" },
  { code: "ES", name: "Spain", flag: "🇪🇸" },
  { code: "JP", name: "Japan", flag: "🇯🇵" },
  { code: "KR", name: "S. Korea", flag: "🇰🇷" },
  { code: "SG", name: "Singapore", flag: "🇸🇬" },
  { code: "MY", name: "Malaysia", flag: "🇲🇾" },
  { code: "CN", name: "China", flag: "🇨🇳" },
];
