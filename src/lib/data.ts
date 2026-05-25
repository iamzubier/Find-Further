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
  { id:"u1", name:"University of Helsinki", country:"Finland", countryFlag:"🇫🇮", qsRank:115, programs:["Computer Science","Data Science"], tuition:"€0 (EU/EEA & need-based waivers)", deadline:"Jan 15, 2026", dealTag:"Tuition Free", minGpa:4.5, blurb:"Finland's flagship — zero tuition with scholarship for top non-EU students.", campusImageUrl:"https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?w=800&q=80" },
  { id:"u2", name:"Aalto University", country:"Finland", countryFlag:"🇫🇮", qsRank:114, programs:["Engineering","Design","Business"], tuition:"€12,000 (often fully waived)", deadline:"Jan 8, 2026", dealTag:"Full Scholarship", minGpa:4.3, blurb:"Aalto's scholarship covers full tuition + €5k/year for strong applicants.", campusImageUrl:"https://images.unsplash.com/photo-1571260899304-425eee4c7efc?w=800&q=80" },
  { id:"u3", name:"Technical University of Munich", country:"Germany", countryFlag:"🇩🇪", qsRank:28, programs:["Engineering","Computer Science"], tuition:"€2,000/semester", deadline:"Jul 15, 2026", dealTag:"Low Tuition", minGpa:4.0, blurb:"Top 30 in the world. €2k/sem tuition (new fee), still a steal.", campusImageUrl:"https://images.unsplash.com/photo-1559117387-57db9e53b5f6?w=800&q=80" },
  { id:"u4", name:"RWTH Aachen", country:"Germany", countryFlag:"🇩🇪", qsRank:106, programs:["Engineering","Computer Science"], tuition:"€350/semester", deadline:"Jul 15, 2026", dealTag:"Tuition Free", minGpa:3.8, blurb:"Germany's engineering powerhouse. €350/semester admin fee only.", campusImageUrl:"https://images.unsplash.com/photo-1607237138185-eedd9c632b0b?w=800&q=80" },
  { id:"u5", name:"University of Oslo", country:"Norway", countryFlag:"🇳🇴", qsRank:117, programs:["Medicine","Economics","Computer Science"], tuition:"NOK 130,000/yr (waivers possible)", deadline:"Dec 1, 2025", dealTag:"Stipend Available", minGpa:4.2, blurb:"Free for EU; non-EU pays but Quota Scheme stipends still exist.", campusImageUrl:"https://images.unsplash.com/photo-1562774053-701939374585?w=800&q=80" },
  { id:"u6", name:"Politecnico di Milano", country:"Italy", countryFlag:"🇮🇹", qsRank:111, programs:["Architecture","Engineering","Design"], tuition:"€900–€4,000/yr (income-based)", deadline:"Apr 2, 2026", dealTag:"Low Tuition", minGpa:3.7, blurb:"World-class design + architecture. Tuition scales with family income.", campusImageUrl:"https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=800&q=80" },
  { id:"u7", name:"MIT", country:"USA", countryFlag:"🇺🇸", qsRank:1, programs:["Computer Science","Engineering"], tuition:"$0 if family income < $200k", deadline:"Jan 4, 2026", dealTag:"Need-blind Aid", minGpa:4.9, blurb:"Need-blind for internationals. Full ride if your family earns under $200k.", campusImageUrl:"https://images.unsplash.com/photo-1564981797816-1043664bf78d?w=800&q=80" },
  { id:"u8", name:"Harvard University", country:"USA", countryFlag:"🇺🇸", qsRank:4, programs:["Economics","Computer Science","Medicine"], tuition:"$0 if family income < $85k", deadline:"Jan 1, 2026", dealTag:"Need-blind Aid", minGpa:4.9, blurb:"Need-blind for ALL applicants. Zero tuition for low-income families.", campusImageUrl:"https://images.unsplash.com/photo-1607237138185-eedd9c632b0b?w=800&q=80" },
  { id:"u9", name:"Yale-NUS / NUS", country:"Singapore", countryFlag:"🇸🇬", qsRank:8, programs:["Business","Computer Science"], tuition:"S$17,500 (with MOE subsidy)", deadline:"Mar 15, 2026", dealTag:"Partial Aid", minGpa:4.5, blurb:"Singapore MOE Tuition Grant slashes fees ~75% with a 3-year work bond.", campusImageUrl:"https://images.unsplash.com/photo-1565967511849-76a60a516170?w=800&q=80" },
  { id:"u10", name:"University of Melbourne", country:"Australia", countryFlag:"🇦🇺", qsRank:13, programs:["Business","Computer Science","Medicine"], tuition:"A$45,000/yr", deadline:"Oct 31, 2025", dealTag:"Full Scholarship", minGpa:4.5, blurb:"Mel Intl Undergrad Scholarship: 100% tuition for top BD applicants.", campusImageUrl:"https://images.unsplash.com/photo-1571260899304-425eee4c7efc?w=800&q=80" },
  { id:"u11", name:"University of Amsterdam", country:"Netherlands", countryFlag:"🇳🇱", qsRank:60, programs:["Economics","Data Science","Business"], tuition:"€10,500/yr", deadline:"May 1, 2026", dealTag:"Partial Aid", minGpa:4.0, blurb:"Holland Scholarship knocks €5k off year-one for non-EU students.", campusImageUrl:"https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?w=800&q=80" },
  { id:"u12", name:"KTH Royal Institute of Technology", country:"Sweden", countryFlag:"🇸🇪", qsRank:73, programs:["Engineering","Computer Science"], tuition:"SEK 310,000/yr (waivers)", deadline:"Jan 15, 2026", dealTag:"Full Scholarship", minGpa:4.2, blurb:"KTH + Swedish Institute scholarships cover full tuition + living.", campusImageUrl:"https://images.unsplash.com/photo-1562774053-701939374585?w=800&q=80" },
  { id:"u13", name:"University of Edinburgh", country:"UK", countryFlag:"🇬🇧", qsRank:27, programs:["Computer Science","Medicine","Economics"], tuition:"£26,500/yr", deadline:"Jan 14, 2026", dealTag:"Partial Aid", minGpa:4.2, blurb:"Edinburgh Global scholarship: £5k–£10k/yr for international UG students.", campusImageUrl:"https://images.unsplash.com/photo-1486299267070-83823f5448dd?w=800&q=80" },
];


export type ScholarshipType = "Full" | "Partial" | "Stipend";
export type ScholarshipLevel = "undergraduate" | "postgraduate" | "phd" | "all";

export type Scholarship = {
  id: string;
  name: string;
  country: string;
  countryFlag: string;
  type: ScholarshipType;
  level: ScholarshipLevel;
  amount: string;
  minGpa?: number;
  deadline: string;
  description: string;
  applyUrl?: string;
};

export const SCHOLARSHIPS: Scholarship[] = [
  { id:"s1a", name:"Fulbright Foreign Student Program (Graduate)", country:"USA", countryFlag:"🇺🇸", type:"Full", level:"postgraduate", amount:"Full tuition + stipend + travel", minGpa:4.5, deadline:daysFromNow(45), description:"US government scholarship covering tuition, stipend, and travel for master's and PhD study at any US university." },
  { id:"s1b", name:"Fulbright Undergraduate Exchange", country:"USA", countryFlag:"🇺🇸", type:"Stipend", level:"undergraduate", amount:"Full funding for 1 academic year", minGpa:4.3, deadline:daysFromNow(50), description:"Non-degree undergraduate year-long exchange to a US college, fully funded by the US Department of State." },
  { id:"s2", name:"DAAD Undergraduate Scholarship", country:"Germany", countryFlag:"🇩🇪", type:"Stipend", level:"undergraduate", amount:"€934/month + insurance", minGpa:4.0, deadline:daysFromNow(20), description:"German Academic Exchange Service. Monthly stipend for full undergraduate degree at any German university." },
  { id:"s2b", name:"DAAD Masters Scholarship", country:"Germany", countryFlag:"🇩🇪", type:"Full", level:"postgraduate", amount:"€992/month + tuition + travel", minGpa:4.3, deadline:daysFromNow(90), description:"DAAD's flagship master's funding for international students in development-related fields." },
  { id:"s3", name:"Erasmus Mundus Joint Masters", country:"EU (multi)", countryFlag:"🇪🇺", type:"Full", level:"postgraduate", amount:"€1,400/month + tuition + travel", minGpa:4.2, deadline:daysFromNow(8), description:"Master's degree across 2–3 EU countries, fully funded. Highly competitive — apply early." },
  { id:"s4", name:"Chevening Scholarship", country:"UK", countryFlag:"🇬🇧", type:"Full", level:"postgraduate", amount:"Full tuition + £18k/yr stipend", minGpa:4.3, deadline:daysFromNow(60), description:"UK government's flagship master's award — covers tuition, flights, visa, monthly living costs. One-year master's only." },
  { id:"s5", name:"Finnish Government Scholarship Pool", country:"Finland", countryFlag:"🇫🇮", type:"Full", level:"all", amount:"100% tuition + €5,000/yr", minGpa:4.3, deadline:daysFromNow(35), description:"Available at most Finnish universities for bachelor's, master's, and doctoral applicants. Auto-considered when you apply." },
  { id:"s6", name:"Holland Scholarship", country:"Netherlands", countryFlag:"🇳🇱", type:"Partial", level:"all", amount:"€5,000 one-time", minGpa:4.0, deadline:daysFromNow(85), description:"Dutch government + 70 universities. One-shot bonus available to both bachelor's and master's non-EU students." },
  { id:"s7", name:"Swedish Institute Scholarship", country:"Sweden", countryFlag:"🇸🇪", type:"Full", level:"postgraduate", amount:"Full tuition + SEK 12k/month", minGpa:4.4, deadline:daysFromNow(120), description:"Master's-only programme for international students from selected countries; covers tuition and living." },
  { id:"s8", name:"Politecnico Excellence Award", country:"Italy", countryFlag:"🇮🇹", type:"Partial", level:"undergraduate", amount:"€11,000/yr", minGpa:4.5, deadline:daysFromNow(150), description:"Politecnico di Milano covers tuition + part of living for top admitted undergraduate students." },
  { id:"s9", name:"Australia Awards Scholarship", country:"Australia", countryFlag:"🇦🇺", type:"Full", level:"all", amount:"Full tuition + A$30k/yr", minGpa:4.4, deadline:daysFromNow(180), description:"Australian government funds full bachelor's, master's, or PhD for selected developing-country students." },
  { id:"s10", name:"KGSP — Korean Government Scholarship", country:"South Korea", countryFlag:"🇰🇷", type:"Full", level:"all", amount:"Tuition + KRW 900k/month + airfare", minGpa:4.2, deadline:daysFromNow(70), description:"Full funding for undergraduate, master's, and PhD study in Korea including a year of Korean language training." },
  { id:"s11", name:"MEXT — Japanese Government Scholarship", country:"Japan", countryFlag:"🇯🇵", type:"Full", level:"all", amount:"Tuition + ¥117k/month + airfare", minGpa:4.3, deadline:daysFromNow(95), description:"Japan's flagship scholarship for undergraduate, master's, and PhD study at any Japanese university." },
  { id:"s12", name:"Gates Cambridge Scholarship", country:"UK", countryFlag:"🇬🇧", type:"Full", level:"postgraduate", amount:"Full tuition + £20k/yr stipend", minGpa:4.7, deadline:daysFromNow(110), description:"Postgraduate (master's and PhD) scholarship at the University of Cambridge — fully funded, highly selective." },
  { id:"s13", name:"Rhodes Scholarship", country:"UK", countryFlag:"🇬🇧", type:"Full", level:"postgraduate", amount:"Full tuition + £18.5k/yr stipend", minGpa:4.6, deadline:daysFromNow(40), description:"World's oldest international graduate scholarship — postgraduate study at the University of Oxford." },
  { id:"s14", name:"ETH Excellence Masters", country:"Switzerland", countryFlag:"🇨🇭", type:"Full", level:"postgraduate", amount:"CHF 12k/semester + tuition", minGpa:4.5, deadline:daysFromNow(75), description:"ETH Zürich's master's-only excellence scholarship covering full tuition and living." },
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

export function scholarshipSlug(s: { id: string; name: string }): string {
  const base = s.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
  return `${base}-${s.id}`;
}

export function findScholarshipBySlug(slug: string): Scholarship | undefined {
  return SCHOLARSHIPS.find((s) => scholarshipSlug(s) === slug);
}

export const WTF_FACTS = [
  { flag:"🇫🇮", country:"Finland", tag:"Tuition Free", image:"https://images.unsplash.com/photo-1559551409-dadc959f76b8?w=800&q=80", fact:"Finland charges ZERO tuition — even for international students at most public unis with scholarship.", filter:{ country:"Finland" } },
  { flag:"🇩🇪", country:"Germany", tag:"Tuition Free", image:"https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=800&q=80", fact:"Public German universities charge under €400/semester. World-top engineering, basically free.", filter:{ country:"Germany" } },
  { flag:"🇳🇴", country:"Norway", tag:"Stipend Available", image:"https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80", fact:"Norway has NO tuition AND offers living stipends through the Quota Scheme.", filter:{ country:"Norway" } },
  { flag:"🇮🇹", country:"Italy", tag:"Low Tuition", image:"https://images.unsplash.com/photo-1515542622106-078bda69f7ff?w=800&q=80", fact:"Politecnico di Milano charges as low as €900/year — and it's QS top 120.", filter:{ country:"Italy" } },
  { flag:"🇺🇸", country:"USA", tag:"Need-blind Aid", image:"https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?w=800&q=80", fact:"200+ US unis offer need-blind full aid to internationals. Harvard, MIT, Yale, Princeton all included.", filter:{ country:"USA" } },
  { flag:"🇦🇺", country:"Australia", tag:"Full Scholarship", image:"https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&q=80", fact:"Australia Awards + Melbourne Intl Scholarships offer full packages for international undergrads.", filter:{ country:"Australia" } },
];
