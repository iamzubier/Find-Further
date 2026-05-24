import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const MessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(8000),
});

const InputSchema = z.object({
  messages: z.array(MessageSchema).min(1).max(40),
});

const SYSTEM_PROMPT = `You are Aria, a friendly study-abroad advisor for students worldwide applying to undergraduate programs abroad. You have access to the student's full profile including their home curriculum and grades, test scores, intended major, target countries, and ECA. Be specific, encouraging, and practical. Always mention real university names, real scholarship deadlines, and give actionable advice. When relevant, convert grades between the student's home grading system and the target country's scale (e.g. BD HSC 5.0, Indian CBSE %, A-Levels, IB, US 4.0, German 1.0, ECTS). Keep responses concise. Use bullet points where helpful. You can score profiles out of 10 with explanation, evaluate ECA relevance to the intended major, suggest matching universities, alert about upcoming scholarship deadlines, and recommend what to improve next.`;

export const askAria = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => InputSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    const profileBlock = profile
      ? `STUDENT PROFILE:\n${JSON.stringify(profile, null, 2)}`
      : "STUDENT PROFILE: (not yet filled out — encourage them to complete it)";

    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      return { reply: "AI is not configured yet. Please contact the administrator.", error: "no_api_key" as const };
    }

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "system", content: profileBlock },
          ...data.messages,
        ],
      }),
    });

    if (!res.ok) {
      if (res.status === 429) return { reply: "Aria is getting too many questions right now. Try again in a minute.", error: "rate_limit" as const };
      if (res.status === 402) return { reply: "Out of AI credits for this workspace. Add credits in Lovable AI settings.", error: "payment_required" as const };
      const text = await res.text();
      console.error("AI gateway error", res.status, text);
      return { reply: "Aria had a hiccup. Try asking again.", error: "gateway_error" as const };
    }

    const json: { choices?: Array<{ message?: { content?: string } }> } = await res.json();
    const reply = json.choices?.[0]?.message?.content ?? "Hmm, I didn't get a response. Try again?";
    return { reply, error: null };
  });
