// Heuristics that turn a legacy static Scholarship into the multi-POV shape
// the new hub/detail UI expects. When DB hydration backfills real data,
// the DB values override these guesses.
import { SCHOLARSHIPS, type Scholarship, daysLeft } from "@/lib/data";

export type CycleStatus = "active_open" | "closed_prep_mode" | "rolling_admissions";
export type FundingType = "fully_funded" | "tuition_waiver" | "partial_bursary" | "stipend_only";
export type ProviderType = "government" | "university_internal" | "private_corporate" | "ngo_foundation";
export type ProfileWeight = "merit" | "portfolio" | "professional";

export type EnrichedScholarship = Scholarship & {
  cycle_status: CycleStatus;
  funding_type: FundingType;
  provider_type: ProviderType;
  application_fee_usd: number;
  accepts_moi_waiver: boolean;
  academic_profile_weight: ProfileWeight;
  provider: string;
  prep_hint?: string;
  estimated_annual_usd: number;
};

const ENGLISH_NATIVE = /USA|UK|Canada|Australia|New Zealand|Ireland/i;
const PREP_MODE_NAMES = /Chevening|Fulbright|Gates Cambridge|Rhodes|Australia Awards|DAAD Masters|MEXT|KGSP|Swedish Institute|Erasmus Mundus|Schwarzman/i;
const GOV_NAMES = /Fulbright|Chevening|DAAD|MEXT|KGSP|Swedish Institute|Australia Awards|Finnish Government|Holland Scholarship|Korean Government|Japanese Government/i;
const NGO_NAMES = /Gates|Rhodes|Schwarzman|Aga Khan|Mastercard Foundation/i;
const UNI_NAMES = /Politecnico|ETH|Excellence|Erasmus Mundus|Stanford|Harvard/i;

function deriveProvider(name: string, country: string): string {
  if (/DAAD/i.test(name)) return "DAAD (German Academic Exchange Service)";
  if (/Fulbright/i.test(name)) return "U.S. Department of State";
  if (/Chevening/i.test(name)) return "UK Foreign Office (FCDO)";
  if (/Gates Cambridge/i.test(name)) return "Bill & Melinda Gates Foundation";
  if (/Rhodes/i.test(name)) return "Rhodes Trust";
  if (/MEXT/i.test(name)) return "Government of Japan (MEXT)";
  if (/KGSP|Korean Government/i.test(name)) return "Government of South Korea (NIIED)";
  if (/Swedish Institute/i.test(name)) return "Svenska Institutet";
  if (/Australia Awards/i.test(name)) return "Australian Government (DFAT)";
  if (/Finnish Government/i.test(name)) return "Finnish National Agency for Education";
  if (/Holland/i.test(name)) return "Nuffic + Dutch universities";
  if (/Politecnico/i.test(name)) return "Politecnico di Milano";
  if (/ETH/i.test(name)) return "ETH Zürich";
  if (/Erasmus/i.test(name)) return "European Commission (EACEA)";
  return `${country} sponsor`;
}

function deriveFunding(s: Scholarship): FundingType {
  if (s.type === "Full") return "fully_funded";
  if (s.type === "Partial") return /tuition/i.test(s.amount) ? "tuition_waiver" : "partial_bursary";
  return "stipend_only";
}

function deriveProvider_(name: string): ProviderType {
  if (GOV_NAMES.test(name)) return "government";
  if (NGO_NAMES.test(name)) return "ngo_foundation";
  if (UNI_NAMES.test(name)) return "university_internal";
  return "private_corporate";
}

function deriveCycle(s: Scholarship): { status: CycleStatus; hint?: string } {
  const d = daysLeft(s.deadline);
  // Rolling: Holland, ETH, certain uni internals tend to be rolling
  if (/Holland Scholarship|Excellence/i.test(s.name) && d > 120) {
    return { status: "rolling_admissions" };
  }
  if (PREP_MODE_NAMES.test(s.name) && d > 60) {
    const openIn = Math.max(1, d - 60);
    const openWhen = new Date(Date.now() + openIn * 86400000);
    const month = openWhen.toLocaleString("en", { month: "long", year: "numeric" });
    return {
      status: "closed_prep_mode",
      hint: `Portal opens ~${month}. Start lining up references and a draft SOP now.`,
    };
  }
  return { status: "active_open" };
}

function deriveProfile(s: Scholarship): ProfileWeight {
  if (/Erasmus|Rhodes|Schwarzman|Chevening/i.test(s.name)) return "professional";
  if (/Excellence|Politecnico|ETH/i.test(s.name)) return "merit";
  return "merit";
}

function deriveAnnualUsd(s: Scholarship): number {
  // Very rough best-effort parse from the amount string. Used for the budget switcher.
  if (s.type === "Full") return 35000;
  const m = s.amount.match(/([€£$])\s?([\d,]+)\s?(\/?yr|\/?year|one-time)?/i);
  if (m) {
    const num = parseInt(m[2].replace(/,/g, ""), 10);
    if (!Number.isNaN(num)) return /one-time/i.test(m[0]) ? Math.round(num / 2) : num;
  }
  if (/month/i.test(s.amount)) return 12000;
  return 5000;
}

export function enrich(s: Scholarship): EnrichedScholarship {
  const cycle = deriveCycle(s);
  return {
    ...s,
    cycle_status: cycle.status,
    prep_hint: cycle.hint,
    funding_type: deriveFunding(s),
    provider_type: deriveProvider_(s.name),
    application_fee_usd: 0,
    accepts_moi_waiver: !ENGLISH_NATIVE.test(s.country),
    academic_profile_weight: deriveProfile(s),
    provider: deriveProvider(s.name, s.country),
    estimated_annual_usd: deriveAnnualUsd(s),
  };
}

export const ENRICHED_SCHOLARSHIPS: EnrichedScholarship[] = SCHOLARSHIPS.map(enrich);

export function fundingLabel(f: FundingType): string {
  return f === "fully_funded"
    ? "Fully Funded"
    : f === "tuition_waiver"
    ? "Tuition Waiver"
    : f === "partial_bursary"
    ? "Partial Bursary"
    : "Stipend Only";
}

export function providerLabel(p: ProviderType): string {
  return p === "government"
    ? "Government"
    : p === "university_internal"
    ? "University Internal"
    : p === "private_corporate"
    ? "Private / Corporate"
    : "NGO / Foundation";
}
