import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getUniDetail = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) => z.object({ slug: z.string().min(1).max(80) }).parse(d))
  .handler(async ({ data }) => {
    const [{ data: uni }, { data: tips }] = await Promise.all([
      supabaseAdmin.from("universities_detail").select("*").eq("slug", data.slug).maybeSingle(),
      supabaseAdmin.from("university_tips").select("*").eq("uni_slug", data.slug).eq("approved", true).order("source_upvotes", { ascending: false }),
    ]);
    return { uni, tips: tips ?? [] };
  });

export const listUniSlugs = createServerFn({ method: "GET" }).handler(async () => {
  const { data } = await supabaseAdmin.from("universities_detail").select("slug, name, country, country_flag, qs_rank, logo_url").order("qs_rank");
  return { unis: data ?? [] };
});

const TipSchema = z.object({
  uni_slug: z.string().min(1).max(80),
  tip_text: z.string().trim().min(20).max(1000),
  source_platform: z.enum(["reddit","quora","youtube","forum","official"]),
  source_url: z.string().url().max(500),
  tag: z.enum(["Academics","ECA","Scholarship","Strategy","CampusLife","FinancialAid"]),
});

export const submitTip = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => TipSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("university_tips").insert({
      ...data,
      submitted_by: context.userId,
      approved: false,
      posted_at: new Date().toISOString().slice(0,10),
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true, error: null };
  });
