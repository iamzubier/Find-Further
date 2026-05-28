import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { fetchUniversityCampusImage } from "@/lib/image-fetch.server";

const InputSchema = z.object({
  slug: z.string().min(1).max(120),
  name: z.string().min(1).max(200).optional(),
  country: z.string().min(1).max(80).optional(),
});

const AI_TOOL = {
  type: "function" as const,
  function: {
    name: "return_university_profile",
    description: "Return verified 2026 admission and tuition data for the university.",
    parameters: {
      type: "object",
      properties: {
        qs_rank: { type: ["integer", "null"], description: "Latest QS World University Ranking, or null if unranked." },
        tuition_usd: { type: ["integer", "null"], description: "Approximate annual international undergraduate tuition in USD." },
        tuition_display: { type: "string", description: "Human display string, e.g. '$57,000/yr' or '€2,000/semester'." },
        acceptance_rate: { type: "string", description: "Acceptance rate as a percentage string, e.g. '7%' or 'Open admission'." },
        ielts_min: { type: ["number", "null"], description: "Minimum overall IELTS Academic score required, e.g. 6.5." },
        toefl_min: { type: ["integer", "null"], description: "Minimum TOEFL iBT score required." },
        about: { type: "string", description: "1–3 sentence summary of the university." },
        city: { type: ["string", "null"] },
        official_url: { type: ["string", "null"] },
        reddit_tips: {
          type: "array",
          items: {
            type: "object",
            properties: {
              text: { type: "string" },
              tag: { type: "string", enum: ["Academics", "ECA", "Scholarship", "Strategy", "CampusLife", "FinancialAid"] },
              source: { type: "string", enum: ["Reddit", "Quora", "YouTube"] },
              upvotes: { type: "integer" },
              source_url: { type: ["string", "null"] },
            },
            required: ["text", "tag", "source", "upvotes"],
            additionalProperties: false,
          },
        },
        campus_image_url: { type: ["string", "null"], description: "Direct, high-resolution public image URL of the campus or a notable building. Prefer Wikimedia Commons (upload.wikimedia.org) or official university press URLs. Must end in .jpg/.jpeg/.png/.webp. Return null if no reliable image is found." },
      },
      required: ["tuition_display", "acceptance_rate", "about", "reddit_tips"],
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

export const hydrateUniversity = createServerFn({ method: "POST" })
  .inputValidator((d) => InputSchema.parse(d))
  .handler(async ({ data }) => {
    // 1. Short-circuit if already hydrated
    const { data: existing } = await supabaseAdmin
      .from("universities_detail")
      .select("*")
      .eq("slug", data.slug)
      .maybeSingle();
    if (existing && existing.about && existing.tuition && Object.keys(existing.tuition as object).length > 0) {
      return { ok: true, hydrated: false, slug: data.slug };
    }

    // 2. Resolve name + country from catalog if not provided
    let name = data.name;
    let country = data.country;
    let catalogWebsite: string | null = null;
    let catalogDomains: string[] = [];
    {
      const { data: cat } = await supabaseAdmin
        .from("universities_catalog")
        .select("name, country, website, domains")
        .eq("slug", data.slug)
        .maybeSingle();
      if (cat) {
        name = name ?? cat.name;
        country = country ?? cat.country;
        catalogWebsite = (cat as any).website ?? null;
        catalogDomains = Array.isArray((cat as any).domains) ? (cat as any).domains : [];
      }
    }
    if (!name) name = slugToName(data.slug);
    if (!country) country = "Unknown";

    // 3. Call Lovable AI Gateway with structured tool calling
    const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
    if (!LOVABLE_API_KEY) {
      return { ok: false, error: "AI gateway not configured", slug: data.slug };
    }

    const prompt = `Search the live web for the university "${name}" in ${country}. Return a strict JSON object containing verified 2026 admission data for international undergraduate applicants. Include 4 to 6 community admission tips synthesised from Reddit, Quora, and YouTube discussions (each with a believable upvote count and a relevant tag). Set campus_image_url to null — the image is fetched separately from Wikipedia. If exact figures are unavailable, give the best public estimate. Do not refuse — always return the tool call.`;

    let aiJson: any = null;
    let campusImageUrl: string | null = null;
    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: "You are a university admissions data extractor. Always call the return_university_profile tool with the best available data for the requested institution, including a real public image URL when one is verifiable." },
            { role: "user", content: prompt },
          ],
          tools: [AI_TOOL],
          tool_choice: { type: "function", function: { name: "return_university_profile" } },
        }),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        console.error("[hydrate-university] AI gateway error", res.status, errText);
        if (res.status === 429) return { ok: false, error: "Rate limit — try again in a moment.", slug: data.slug };
        if (res.status === 402) return { ok: false, error: "AI credits exhausted. Please add credits.", slug: data.slug };
        return { ok: false, error: "AI gateway error", slug: data.slug };
      }

      const json = await res.json();
      const toolCall = json?.choices?.[0]?.message?.tool_calls?.[0];
      if (!toolCall?.function?.arguments) {
        console.error("[hydrate-university] No tool call returned", JSON.stringify(json).slice(0, 500));
        return { ok: false, error: "AI returned no structured data", slug: data.slug };
      }
      aiJson = JSON.parse(toolCall.function.arguments);

      const aiUrl = typeof aiJson.campus_image_url === "string" && /^https?:\/\//i.test(aiJson.campus_image_url) ? aiJson.campus_image_url : null;
      campusImageUrl = aiUrl ?? (await fetchUniversityCampusImage(name));
    } catch (err) {
      console.error("[hydrate-university] fetch failed", err);
      return { ok: false, error: "Network error contacting AI gateway", slug: data.slug };
    }

    // 4. Upsert into universities_detail
    const tuitionUsd = typeof aiJson.tuition_usd === "number" ? aiJson.tuition_usd : null;
    const admissionReqs: Record<string, unknown> = {};
    if (typeof aiJson.ielts_min === "number") admissionReqs.ielts = aiJson.ielts_min;
    if (typeof aiJson.toefl_min === "number") admissionReqs.toefl = aiJson.toefl_min;

    const detailRow = {
      slug: data.slug,
      name,
      country,
      city: aiJson.city ?? null,
      qs_rank: typeof aiJson.qs_rank === "number" ? aiJson.qs_rank : null,
      about: aiJson.about ?? `${name} is a higher education institution in ${country}.`,
      acceptance_rate: aiJson.acceptance_rate ?? null,
      official_url: aiJson.official_url ?? null,
      campus_image_url: campusImageUrl,
      tuition: {
        display: aiJson.tuition_display ?? null,
        per_year_usd: tuitionUsd,
        currency: "USD",
      } as any,
      admission_reqs: admissionReqs as any,
      updated_at: new Date().toISOString(),
    };

    const { error: upsertErr } = await supabaseAdmin
      .from("universities_detail")
      .upsert(detailRow as any, { onConflict: "slug" });
    if (upsertErr) {
      console.error("[hydrate-university] upsert failed", upsertErr);
      return { ok: false, error: upsertErr.message, slug: data.slug };
    }

    // 5. Insert tips (best-effort)
    const tips = Array.isArray(aiJson.reddit_tips) ? aiJson.reddit_tips : [];
    if (tips.length > 0) {
      const tipRows = tips
        .filter((t: any) => typeof t?.text === "string" && t.text.length >= 10)
        .slice(0, 8)
        .map((t: any) => ({
          uni_slug: data.slug,
          tip_text: String(t.text).slice(0, 1000),
          tag: ["Academics", "ECA", "Scholarship", "Strategy", "CampusLife", "FinancialAid"].includes(t.tag) ? t.tag : "Strategy",
          source_platform: String(t.source ?? "Reddit").toLowerCase(),
          source_url: typeof t.source_url === "string" ? t.source_url.slice(0, 500) : null,
          source_upvotes: Number.isFinite(t.upvotes) ? Math.max(0, Math.floor(t.upvotes)) : 0,
          approved: true,
          posted_at: new Date().toISOString().slice(0, 10),
        }));
      if (tipRows.length > 0) {
        const { error: tipsErr } = await supabaseAdmin.from("university_tips").insert(tipRows);
        if (tipsErr) console.error("[hydrate-university] tips insert failed", tipsErr);
      }
    }

    return { ok: true, hydrated: true, slug: data.slug };
  });
