import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

type Json = string | number | boolean | null | Json[] | { [key: string]: Json | undefined };

export type ScholarshipDetailDto = {
  id: string;
  slug: string;
  name: string;
  provider: string | null;
  host_country: string | null;
  description: string | null;
  funding_type: string | null;
  provider_type: string | null;
  cycle_status: string | null;
  degree_level: string | null;
  annual_value_usd: number | null;
  amount_display: string | null;
  allowance_breakdown: Json | null;
  upfront_costs_covered: Json | null;
  hidden_costs_for_student: string | null;
  hidden_obligations: string | null;
  application_fee_usd: number | null;
  accepts_moi_waiver: boolean | null;
  academic_profile_weight: string | null;
  deadline: string | null;
  expected_next_open_month: string | null;
  official_url: string | null;
  required_documents_checklist: string[] | null;
  insider_tips: string[] | null;
  hydrated_at: string | null;
  banner_image_url: string | null;
  avg_gpa_recipients: string | null;
  avg_ielts_recipients: string | null;
};

export const getScholarshipDetail = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) => z.object({ slug: z.string().min(1).max(120) }).parse(d))
  .handler(async ({ data }) => {
    const { data: scholarship, error } = await supabaseAdmin
      .from("scholarships")
      .select("*")
      .eq("slug", data.slug)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!scholarship) return null;

    const dto: ScholarshipDetailDto = {
      id: scholarship.id,
      slug: scholarship.slug ?? data.slug,
      name: scholarship.name ?? "Scholarship",
      provider: scholarship.provider,
      host_country: scholarship.host_country,
      description: scholarship.description,
      funding_type: scholarship.funding_type,
      provider_type: scholarship.provider_type,
      cycle_status: scholarship.cycle_status,
      degree_level: scholarship.degree_level,
      annual_value_usd: scholarship.annual_value_usd,
      amount_display: scholarship.amount_display,
      allowance_breakdown: (scholarship.allowance_breakdown as Json | null) ?? null,
      upfront_costs_covered: (scholarship.upfront_costs_covered as Json | null) ?? null,
      hidden_costs_for_student: scholarship.hidden_costs_for_student,
      hidden_obligations: scholarship.hidden_obligations,
      application_fee_usd: scholarship.application_fee_usd,
      accepts_moi_waiver: scholarship.accepts_moi_waiver,
      academic_profile_weight: scholarship.academic_profile_weight,
      deadline: scholarship.deadline,
      expected_next_open_month: scholarship.expected_next_open_month,
      official_url: scholarship.official_url,
      required_documents_checklist: Array.isArray(scholarship.required_documents_checklist)
        ? scholarship.required_documents_checklist.filter((item): item is string => typeof item === "string")
        : null,
      insider_tips: Array.isArray(scholarship.insider_tips)
        ? scholarship.insider_tips.filter((item): item is string => typeof item === "string")
        : null,
      hydrated_at: scholarship.hydrated_at,
      banner_image_url: scholarship.banner_image_url,
      avg_gpa_recipients: scholarship.avg_gpa_recipients,
      avg_ielts_recipients: scholarship.avg_ielts_recipients,
    };

    return dto;
  });