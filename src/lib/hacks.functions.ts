import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const InputSchema = z.object({
  uniId: z.string().min(1).max(64),
  uniName: z.string().min(1).max(200),
  country: z.string().min(1).max(100),
});

export const generateAiHacks = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => InputSchema.parse(input))
  .handler(async ({ data }) => {
    // Check cache first
    const { data: cached } = await supabaseAdmin
      .from("university_hacks_ai")
      .select("content_md, generated_at")
      .eq("uni_id", data.uniId)
      .maybeSingle();

    if (cached) return { content: cached.content_md, cached: true as const };

    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) return { content: "AI is not configured.", cached: false as const, error: "no_api_key" };

    const prompt = `You are advising an international undergraduate applicant about ${data.uniName} in ${data.country}.
Generate 5–7 concrete admission tips, hacks, or insider knowledge that commonly appears on Reddit (r/ApplyingToCollege, country subs), Quora, and student forums. Focus on what international students from any country need to know.

Format as a markdown bullet list. Each bullet:
- One specific actionable tip
- Mention if it's about: tuition/scholarships, application strategy, entrance test, documents, or essays
- Be concrete (numbers, names, deadlines) — no fluff

Do NOT invent specific URLs or post links. Do NOT use phrases like "According to a Reddit post". Just state the insight.`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) {
      if (res.status === 429) return { content: "AI is rate-limited. Try again shortly.", cached: false as const, error: "rate_limit" };
      if (res.status === 402) return { content: "Out of AI credits.", cached: false as const, error: "payment_required" };
      return { content: "AI couldn't generate tips right now.", cached: false as const, error: "gateway_error" };
    }

    const json: { choices?: Array<{ message?: { content?: string } }> } = await res.json();
    const content = json.choices?.[0]?.message?.content ?? "No tips generated.";

    await supabaseAdmin.from("university_hacks_ai").upsert({ uni_id: data.uniId, content_md: content, generated_at: new Date().toISOString() });
    return { content, cached: false as const };
  });

const PlanSchema = z.object({
  uniName: z.string().min(1).max(200),
  exam: z.string().min(1).max(20),
  currentScore: z.string().max(50).optional(),
  targetScore: z.string().max(50).optional(),
  weeks: z.number().int().min(2).max(52).default(12),
});

export const generateStudyPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => PlanSchema.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) return { plan: "AI is not configured.", error: "no_api_key" };

    const prompt = `Create a ${data.weeks}-week ${data.exam} prep plan for an international student targeting ${data.uniName}.
Current score: ${data.currentScore || "not provided"}. Target score: ${data.targetScore || "competitive for this uni"}.

Format as markdown:
- Brief 2-line strategy overview
- Week-by-week breakdown (group in 4-week phases)
- 3–5 specific free/cheap resources (Khan Academy, official ETS materials, etc.)
- One BD-specific tip (test centers, registration timing)

Keep it under 400 words. Be concrete.`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) {
      if (res.status === 429) return { plan: "AI is rate-limited.", error: "rate_limit" };
      if (res.status === 402) return { plan: "Out of AI credits.", error: "payment_required" };
      return { plan: "Couldn't generate plan.", error: "gateway_error" };
    }
    const json: { choices?: Array<{ message?: { content?: string } }> } = await res.json();
    return { plan: json.choices?.[0]?.message?.content ?? "No plan generated.", error: null };
  });
