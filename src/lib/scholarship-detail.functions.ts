import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

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

    return (scholarship ?? null) as Record<string, unknown> | null;
  });