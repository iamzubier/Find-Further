export type DealTag =
  | "Tuition Free"
  | "Need-blind Aid"
  | "Stipend Available"
  | "Low Tuition"
  | "Full Scholarship"
  | "Partial Aid";

export type University = {
  id: string;
  name: string;
  country: string;
  countryFlag: string;
  qsRank: number;
  programs: string[];
  tuition: string;
  deadline: string;
  dealTag: DealTag;
  minGpa?: number; // BD 5.0 scale
  blurb: string;
  campusImageUrl?: string;
};


export const COUNTRIES = [
  "USA", "UK", "Germany", "Finland", "Norway",
  "Australia", "Italy", "Netherlands", "Sweden",
] as const;

export const PROGRAMS = [
  "Computer Science", "Engineering", "Business", "Medicine",
  "Data Science", "Architecture", "Economics", "Design",
] as const;

export const UNIVERSITIES: University[] = [
  { id:"u1", name:"University of Helsinki", country:"Finland", countryFlag:"🇫🇮", qsRank:115, programs:["Computer Science","Data Science"], tuition:"€0 (EU/EEA & need-based waivers)", deadline:"Jan 15, 2026", dealTag:"Tuition Free", minGpa:4.5, blurb:"Finland's flagship — zero tuition with scholarship for top non-EU students." },
  { id:"u2", name:"Aalto University", country:"Finland", countryFlag:"🇫🇮", qsRank:114, programs:["Engineering","Design","Business"], tuition:"€12,000 (often fully waived)", deadline:"Jan 8, 2026", dealTag:"Full Scholarship", minGpa:4.3, blurb:"Aalto's scholarship covers full tuition + €5k/year for strong applicants." },
  { id:"u3", name:"Technical University of Munich", country:"Germany", countryFlag:"🇩🇪", qsRank:28, programs:["Engineering","Computer Science"], tuition:"€2,000/semester", deadline:"Jul 15, 2026", dealTag:"Low Tuition", minGpa:4.0, blurb:"Top 30 in the world. €2k/sem tuition (new fee), still a steal." },
  { id:"u4", name:"RWTH Aachen", country:"Germany", countryFlag:"🇩🇪", qsRank:106, programs:["Engineering","Computer Science"], tuition:"€350/semester", deadline:"Jul 15, 2026", dealTag:"Tuition Free", minGpa:3.8, blurb:"Germany's engineering powerhouse. €350/semester admin fee only." },
  { id:"u5", name:"University of Oslo", country:"Norway", countryFlag:"🇳🇴", qsRank:117, programs:["Medicine","Economics","Computer Science"], tuition:"NOK 130,000/yr (waivers possible)", deadline:"Dec 1, 2025", dealTag:"Stipend Available", minGpa:4.2, blurb:"Free for EU; non-EU pays but Quota Scheme stipends still exist." },
  { id:"u6", name:"Politecnico di Milano", country:"Italy", countryFlag:"🇮🇹", qsRank:111, programs:["Architecture","Engineering","Design"], tuition:"€900–€4,000/yr (income-based)", deadline:"Apr 2, 2026", dealTag:"Low Tuition", minGpa:3.7, blurb:"World-class design + architecture. Tuition scales with family income." },
  { id:"u7", name:"MIT", country:"USA", countryFlag:"🇺🇸", qsRank:1, programs:["Computer Science","Engineering"], tuition:"$0 if family income < $200k", deadline:"Jan 4, 2026", dealTag:"Need-blind Aid", minGpa:4.9, blurb:"Need-blind for internationals. Full ride if your family earns under $200k." },
  { id:"u8", name:"Harvard University", country:"USA", countryFlag:"🇺🇸", qsRank:4, programs:["Economics","Computer Science","Medicine"], tuition:"$0 if family income < $85k", deadline:"Jan 1, 2026", dealTag:"Need-blind Aid", minGpa:4.9, blurb:"Need-blind for ALL applicants. Zero tuition for low-income families." },
  { id:"u9", name:"Yale-NUS / NUS", country:"Singapore", countryFlag:"🇸🇬", qsRank:8, programs:["Business","Computer Science"], tuition:"S$17,500 (with MOE subsidy)", deadline:"Mar 15, 2026", dealTag:"Partial Aid", minGpa:4.5, blurb:"Singapore MOE Tuition Grant slashes fees ~75% with a 3-year work bond." },
  { id:"u10", name:"University of Melbourne", country:"Australia", countryFlag:"🇦🇺", qsRank:13, programs:["Business","Computer Science","Medicine"], tuition:"A$45,000/yr", deadline:"Oct 31, 2025", dealTag:"Full Scholarship", minGpa:4.5, blurb:"Mel Intl Undergrad Scholarship: 100% tuition for top BD applicants." },
  { id:"u11", name:"University of Amsterdam", country:"Netherlands", countryFlag:"🇳🇱", qsRank:60, programs:["Economics","Data Science","Business"], tuition:"€10,500/yr", deadline:"May 1, 2026", dealTag:"Partial Aid", minGpa:4.0, blurb:"Holland Scholarship knocks €5k off year-one for non-EU students." },
  { id:"u12", name:"KTH Royal Institute of Technology", country:"Sweden", countryFlag:"🇸🇪", qsRank:73, programs:["Engineering","Computer Science"], tuition:"SEK 310,000/yr (waivers)", deadline:"Jan 15, 2026", dealTag:"Full Scholarship", minGpa:4.2, blurb:"KTH + Swedish Institute scholarships cover full tuition + living." },
  { id:"u13", name:"University of Edinburgh", country:"UK", countryFlag:"🇬🇧", qsRank:27, programs:["Computer Science","Medicine","Economics"], tuition:"£26,500/yr", deadline:"Jan 14, 2026", dealTag:"Partial Aid", minGpa:4.2, blurb:"Edinburgh Global scholarship: £5k–£10k/yr for international UG students." },
];

export type ScholarshipType = "Full" | "Partial" | "Stipend";

export type Scholarship = {
  id: string;
  name: string;
  country: string;
  countryFlag: string;
  type: ScholarshipType;
  amount: string;
  minGpa?: number;
  deadline: string; // ISO date
  description: string;
  applyUrl?: string;
};

export const SCHOLARSHIPS: Scholarship[] = [
  { id:"s1", name:"Fulbright Foreign Student Program", country:"USA", countryFlag:"🇺🇸", type:"Full", amount:"Full tuition + stipend + travel", minGpa:4.5, deadline:daysFromNow(45), description:"Prestigious US government scholarship covering everything for graduate study — but undergrads can apply via specific tracks." },
  { id:"s2", name:"DAAD Undergraduate Scholarship", country:"Germany", countryFlag:"🇩🇪", type:"Stipend", amount:"€934/month + insurance", minGpa:4.0, deadline:daysFromNow(20), description:"German Academic Exchange Service. Monthly stipend for full UG degree at any German uni." },
  { id:"s3", name:"Erasmus Mundus Joint Masters", country:"EU (multi)", countryFlag:"🇪🇺", type:"Full", amount:"€1,400/month + tuition + travel", minGpa:4.2, deadline:daysFromNow(8), description:"Study in 2–3 EU countries, fully funded. Highly competitive — apply early." },
  { id:"s4", name:"Chevening Scholarship", country:"UK", countryFlag:"🇬🇧", type:"Full", amount:"Full tuition + £18k/yr stipend", minGpa:4.3, deadline:daysFromNow(60), description:"UK government's flagship — covers tuition, flights, visa, monthly living costs." },
  { id:"s5", name:"Finnish Government Scholarship Pool", country:"Finland", countryFlag:"🇫🇮", type:"Full", amount:"100% tuition + €5,000/yr", minGpa:4.3, deadline:daysFromNow(35), description:"Available at most Finnish unis. Auto-considered when you apply." },
  { id:"s6", name:"Holland Scholarship", country:"Netherlands", countryFlag:"🇳🇱", type:"Partial", amount:"€5,000 one-time", minGpa:4.0, deadline:daysFromNow(85), description:"Awarded by Dutch govt + 70 unis. One-shot bonus to take the sting off tuition." },
  { id:"s7", name:"Swedish Institute Scholarship", country:"Sweden", countryFlag:"🇸🇪", type:"Full", amount:"Full tuition + SEK 12k/month", minGpa:4.4, deadline:daysFromNow(120), description:"For master's mainly, but feeder UG programs at KTH/Lund consider strong international applicants." },
  { id:"s8", name:"Politecnico Excellence Award", country:"Italy", countryFlag:"🇮🇹", type:"Partial", amount:"€11,000/yr", minGpa:4.5, deadline:daysFromNow(150), description:"Politecnico di Milano covers tuition + part of living for top admitted UG students." },
  { id:"s9", name:"Australia Awards Scholarship", country:"Australia", countryFlag:"🇦🇺", type:"Full", amount:"Full tuition + A$30k/yr", minGpa:4.4, deadline:daysFromNow(180), description:"Australian govt funds full UG/PG for selected developing-country students, BD included." },
];

function daysFromNow(d: number): string {
  const t = new Date();
  t.setDate(t.getDate() + d);
  return t.toISOString().slice(0, 10);
}

export function daysLeft(iso: string): number {
  const t = new Date(iso).getTime();
  const now = Date.now();
  return Math.ceil((t - now) / (1000 * 60 * 60 * 24));
}

export const WTF_FACTS = [
  { flag:"🇫🇮", country:"Finland", tag:"Tuition Free", fact:"Finland charges ZERO tuition — even for international students at most public unis with scholarship.", filter:{ country:"Finland" } },
  { flag:"🇩🇪", country:"Germany", tag:"Tuition Free", fact:"Public German universities charge under €400/semester. World-top engineering, basically free.", filter:{ country:"Germany" } },
  { flag:"🇳🇴", country:"Norway", tag:"Stipend Available", fact:"Norway has NO tuition AND offers living stipends through the Quota Scheme.", filter:{ country:"Norway" } },
  { flag:"🇮🇹", country:"Italy", tag:"Low Tuition", fact:"Politecnico di Milano charges as low as €900/year — and it's QS top 120.", filter:{ country:"Italy" } },
  { flag:"🇺🇸", country:"USA", tag:"Need-blind Aid", fact:"200+ US unis offer need-blind full aid to internationals. Harvard, MIT, Yale, Princeton all included.", filter:{ country:"USA" } },
  { flag:"🇦🇺", country:"Australia", tag:"Full Scholarship", fact:"Australia Awards + Melbourne Intl Scholarships offer full packages for BD undergrads.", filter:{ country:"Australia" } },
];
