import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { fetchCountryBannerImage } from "@/lib/image-fetch.server";

const InputSchema = z.object({
  slug: z.string().min(1).max(160),
  name: z.string().min(1).max(300).optional(),
  country: z.string().min(1).max(120).optional(),
});

const AI_TOOL = {
  type: "function" as const,
  function: {
    name: "return_scholarship_profile",
    description: "Return verified, multi-POV 2026 funding details for the named scholarship.",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string" },
        provider: { type: "string", description: "Organisation funding the award (e.g. 'DAAD', 'University of Toronto', 'Rhodes Trust')." },
        host_country: { type: "string" },
        description: { type: "string", description: "2–4 sentence neutral summary of who the scholarship is for and what it covers." },
        funding_type: { type: "string", enum: ["fully_funded", "tuition_waiver", "partial_bursary", "stipend_only"] },
        provider_type: { type: "string", enum: ["government", "university_internal", "private_corporate", "ngo_foundation"] },
        cycle_status: { type: "string", enum: ["active_open", "closed_prep_mode", "rolling_admissions"] },
        degree_level: { type: "string", description: "undergraduate, postgraduate, phd, diploma, or all." },
        annual_value_usd: { type: ["integer", "null"], description: "Best estimate of total annual value to the student in USD." },
        amount_display: { type: "string", description: "Human-readable award value, e.g. 'Full tuition + €992/mo stipend'." },
        allowance_breakdown: {
          type: "object",
          properties: {
            monthly_stipend_usd: { type: ["integer", "null"] },
            airfare: { type: "boolean" },
            insurance: { type: "boolean" },
            books_allowance: { type: "boolean" },
            settling_in: { type: "boolean" },
          },
        },
        upfront_costs_covered: {
          type: "object",
          properties: {
            application_fee_waiver: { type: "boolean" },
            visa_fees: { type: "boolean" },
            airfare: { type: "boolean" },
            health_insurance: { type: "boolean" },
          },
        },
        hidden_costs_for_student: { type: "string", description: "Realistic out-of-pocket the student must still pay (e.g. €11,900 blocked account, local health surcharge)." },
        hidden_obligations: { type: "string", description: "Strings attached: return bond, GPA maintenance, TA hours, etc." },
        application_fee_usd: { type: "integer" },
        accepts_moi_waiver: { type: "boolean", description: "Whether an MOI letter substitutes for IELTS/TOEFL." },
        academic_profile_weight: { type: "string", description: "e.g. 'High GPA required', 'Holistic portfolio focus', 'Work-experience weighted'." },
        exact_deadline_date: { type: ["string", "null"], description: "YYYY-MM-DD if open; null if not in cycle." },
        expected_next_open_month: { type: ["string", "null"], description: "e.g. 'October 2026' if currently closed." },
        official_url: { type: ["string", "null"] },
        eligible_countries: { type: "array", items: { type: "string" } },
        required_documents_checklist: { type: "array", items: { type: "string" } },
        insider_reddit_hacks: { type: "array", items: { type: "string" }, description: "3–6 short tactical tips from Reddit/Quora/past awardees." },
        banner_image_url: { type: ["string", "null"], description: "Direct, high-resolution public image URL of the host country (iconic landmark, skyline, or campus). Prefer Wikimedia Commons (upload.wikimedia.org) or official press URLs. Must end in .jpg/.jpeg/.png/.webp. Return null if none is found." },
      },
      required: [
        "name",
        "provider",
        "host_country",
        "description",
        "funding_type",
        "provider_type",
        "cycle_status",
        "amount_display",
        "academic_profile_weight",
      ],
      additionalProperties: false,
    },
  },
};

function slugToName(slug: string): string {
  return slug
    .split(/[-_]/)
    .filter(Boolean)
    .map((w) => (w.length <= 3 ? w.toUpperCase() : w[0].toUpperCase() + w.slice(1)))
    .join(" ");
}

function normLevel(raw?: string | null): string | null {
  if (!raw) return null;
  const v = raw.toLowerCase();
  if (/(under|bachelor|ug\b|bs|ba)/.test(v)) return "undergraduate";
  if (/(post|master|msc|ma\b|mba|graduate)/.test(v)) return "postgraduate";
  if (/(phd|doctor)/.test(v)) return "phd";
  if (/(diploma|certificate)/.test(v)) return "diploma";
  if (/(all|any)/.test(v)) return "all";
  return null;
}

export const hydrateScholarship = createServerFn({ method: "POST" })
  .inputValidator((d) => InputSchema.parse(d))
  .handler(async ({ data }) => {
    // 1. Short-circuit if already hydrated
    const { data: existing } = await supabaseAdmin
      .from("scholarships")
      .select("*")
      .eq("slug", data.slug)
      .maybeSingle();
    if (existing && (existing as any).hydrated_at) {
      return { ok: true, hydrated: false, slug: data.slug };
    }

    const name = data.name ?? (existing as any)?.name ?? slugToName(data.slug);
    const country = data.country ?? (existing as any)?.host_country ?? "Unknown";

    const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
    if (!LOVABLE_API_KEY) {
      return { ok: false, error: "AI gateway not configured", slug: data.slug };
    }

    const prompt = `Research the scholarship "${name}"${country !== "Unknown" ? ` (host country: ${country})` : ""} for the 2026 international intake. Use the live web. Return a strict JSON tool-call covering: official funding type, provider, exact cycle status (open / prep mode / rolling), full allowance breakdown, application fee, MOI-in-lieu-of-IELTS acceptance, hidden costs the student still pays, hidden obligations (bonds, GPA, TA hours), required documents, and 3–6 tactical insider tips from Reddit/Quora/past recipients. Also include banner_image_url: a direct, high-resolution public image URL (preferably Wikimedia Commons or an official press photo) representing the host country or program — must be a direct image URL ending in .jpg/.jpeg/.png/.webp, or null if none exists. If currently closed, set cycle_status to closed_prep_mode and fill expected_next_open_month. Always emit the tool call, never refuse.`;

    let ai: any = null;
    let bannerUrl: string | null = null;
    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: "You are a scholarship intelligence analyst. Return only structured data via the return_scholarship_profile tool. Use verified figures; estimate conservatively when exact data is unavailable. Include a real public image URL for the host country when one is verifiable." },
            { role: "user", content: prompt },
          ],
          tools: [AI_TOOL],
          tool_choice: { type: "function", function: { name: "return_scholarship_profile" } },
        }),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        console.error("[hydrate-scholarship] AI gateway error", res.status, errText);
        if (res.status === 429) return { ok: false, error: "Rate limit — try again in a moment.", slug: data.slug };
        if (res.status === 402) return { ok: false, error: "AI credits exhausted. Please add credits.", slug: data.slug };
        return { ok: false, error: "AI gateway error", slug: data.slug };
      }

      const json = await res.json();
      const toolCall = json?.choices?.[0]?.message?.tool_calls?.[0];
      if (!toolCall?.function?.arguments) {
        console.error("[hydrate-scholarship] No tool call returned", JSON.stringify(json).slice(0, 500));
        return { ok: false, error: "AI returned no structured data", slug: data.slug };
      }
      ai = JSON.parse(toolCall.function.arguments);

      const aiUrl = typeof ai.banner_image_url === "string" && /^https?:\/\//i.test(ai.banner_image_url) ? ai.banner_image_url : null;
      bannerUrl = aiUrl ?? (await fetchCountryBannerImage(ai.host_country ?? country));
    } catch (err) {
      console.error("[hydrate-scholarship] fetch failed", err);
      return { ok: false, error: "Network error contacting AI gateway", slug: data.slug };
    }

    const hostCountry = ai.host_country ?? country;

    // Normalise + upsert
    const row: Record<string, unknown> = {
      slug: data.slug,
      name: ai.name ?? name,
      provider: ai.provider ?? null,
      host_country: hostCountry,
      description: ai.description ?? null,
      funding_type: ["fully_funded", "tuition_waiver", "partial_bursary", "stipend_only"].includes(ai.funding_type) ? ai.funding_type : null,
      provider_type: ["government", "university_internal", "private_corporate", "ngo_foundation"].includes(ai.provider_type) ? ai.provider_type : null,
      cycle_status: ["active_open", "closed_prep_mode", "rolling_admissions"].includes(ai.cycle_status) ? ai.cycle_status : "active_open",
      degree_level: normLevel(ai.degree_level),
      annual_value_usd: typeof ai.annual_value_usd === "number" ? ai.annual_value_usd : null,
      amount_display: ai.amount_display ?? null,
      allowance_breakdown: ai.allowance_breakdown ?? {},
      upfront_costs_covered: ai.upfront_costs_covered ?? {},
      hidden_costs_for_student: ai.hidden_costs_for_student ?? null,
      hidden_obligations: ai.hidden_obligations ?? null,
      application_fee_usd: Number.isFinite(ai.application_fee_usd) ? Math.max(0, Math.floor(ai.application_fee_usd)) : 0,
      accepts_moi_waiver: Boolean(ai.accepts_moi_waiver),
      academic_profile_weight: ai.academic_profile_weight ?? null,
      deadline: /^\d{4}-\d{2}-\d{2}$/.test(ai.exact_deadline_date ?? "") ? ai.exact_deadline_date : null,
      expected_next_open_month: ai.expected_next_open_month ?? null,
      official_url: ai.official_url ?? null,
      banner_image_url: bannerUrl,
      eligible_countries: Array.isArray(ai.eligible_countries) ? ai.eligible_countries.slice(0, 200) : [],
      required_documents_checklist: Array.isArray(ai.required_documents_checklist) ? ai.required_documents_checklist.slice(0, 30) : [],
      insider_tips: Array.isArray(ai.insider_reddit_hacks) ? ai.insider_reddit_hacks.slice(0, 8) : [],
      hydrated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { error: upsertErr } = await supabaseAdmin
      .from("scholarships")
      .upsert(row as never, { onConflict: "slug" });
    if (upsertErr) {
      console.error("[hydrate-scholarship] upsert failed", upsertErr);
      return { ok: false, error: upsertErr.message, slug: data.slug };
    }

    return { ok: true, hydrated: true, slug: data.slug };
  });
