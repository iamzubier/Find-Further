import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { scoreProfile, matchUniversity, type EvalInput, type MatchedUni } from "./evaluation";
import { convertToAll, type RawGrade, type ConvertedGrades } from "./curriculum";

const RawSchema = z.discriminatedUnion("curriculum", [
  z.object({ curriculum: z.literal("BD_HSC"), hscGpa: z.number().min(0).max(5), sscGpa: z.number().min(0).max(5).optional() }),
  z.object({ curriculum: z.enum(["CBSE", "ICSE", "PK_FSC"]), percentage: z.number().min(0).max(100) }),
  z.object({ curriculum: z.literal("A_LEVELS"), grades: z.array(z.string().max(2)).max(10) }),
  z.object({ curriculum: z.literal("IB"), points: z.number().min(0).max(45) }),
  z.object({ curriculum: z.enum(["US_GPA", "CA_GPA"]), gpa: z.number().min(0).max(4) }),
  z.object({ curriculum: z.literal("GAOKAO"), score: z.number().min(0).max(750) }),
  z.object({ curriculum: z.literal("ABITUR"), grade: z.number().min(1).max(6) }),
]);
const TestSchema = z.object({
  ielts: z.number().optional(), toefl: z.number().optional(),
  duolingo: z.number().optional(), pte: z.number().optional(),
  sat: z.number().optional(), act: z.number().optional(),
}).partial();

const PayloadSchema = z.object({
  home_country: z.string().min(1).max(64),
  curriculum_type: z.string().min(1).max(32),
  grades_raw: RawSchema,
  tests: TestSchema,
  target_countries: z.array(z.string().max(8)).max(20),
  intended_major: z.string().max(120).optional().nullable(),
  intake: z.string().max(40).optional().nullable(),
  budget: z.string().max(40).optional().nullable(),
  scholarship_need: z.string().max(8).optional().nullable(),
  eca_text: z.string().max(4000).optional().nullable(),
});

async function runEvaluation(input: z.infer<typeof PayloadSchema>) {
  const converted: ConvertedGrades = convertToAll(input.grades_raw as RawGrade);

  const evalInput: EvalInput = {
    converted,
    tests: input.tests,
    ecaText: input.eca_text ?? "",
    targetCountries: input.target_countries,
    budget: input.budget ?? undefined,
    scholarshipNeed: input.scholarship_need ?? undefined,
    intendedMajor: input.intended_major ?? undefined,
  };
  const breakdown = scoreProfile(evalInput);

  // Pull a candidate pool of curated universities.
  const { data: unis } = await supabaseAdmin
    .from("universities_detail")
    .select("slug,name,country,city,qs_rank,logo_url,campus_image_url,admission_reqs,tuition,scholarships")
    .limit(400);

  const matches: MatchedUni[] = (unis ?? [])
    .map(u => matchUniversity(u as Parameters<typeof matchUniversity>[0], evalInput))
    .sort((a, b) => b.matchPct - a.matchPct)
    .slice(0, 24);

  return { converted, breakdown, matches };
}

/** Compute results without persisting — used for the initial result render. */
export const computeEvaluation = createServerFn({ method: "POST" })
  .inputValidator((i) => PayloadSchema.parse(i))
  .handler(async ({ data }) => runEvaluation(data));

/** Persist evaluation. If logged in, attaches user_id. Returns id for sharing. */
export const saveEvaluation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => PayloadSchema.parse(i))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const result = await runEvaluation(data);
    const { data: row, error } = await supabaseAdmin
      .from("evaluations")
      .insert({
        user_id: userId,
        home_country: data.home_country,
        curriculum_type: data.curriculum_type,
        grades_raw: data.grades_raw,
        grades_converted: result.converted,
        test_scores: data.tests,
        target_countries: data.target_countries,
        intended_major: data.intended_major,
        intake: data.intake,
        budget: data.budget,
        scholarship_need: data.scholarship_need,
        eca_text: data.eca_text,
        profile_score: result.breakdown.total,
        score_breakdown: result.breakdown,
      })
      .select("id")
      .single();
    if (error || !row) throw new Error(error?.message ?? "Save failed");
    return { id: row.id as string, ...result };
  });

/** Load a saved evaluation by id. Auth-only. Recomputes matches against current DB. */
export const loadEvaluation = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await supabaseAdmin
      .from("evaluations").select("*").eq("id", data.id).maybeSingle();
    if (error || !row) throw new Error("Evaluation not found");
    if (row.user_id !== context.userId) throw new Error("Unauthorized");

    const payload = {
      home_country: row.home_country,
      curriculum_type: row.curriculum_type,
      grades_raw: row.grades_raw as RawGrade,
      tests: row.test_scores as EvalInput["tests"],
      target_countries: row.target_countries as string[],
      intended_major: row.intended_major,
      intake: row.intake,
      budget: row.budget,
      scholarship_need: row.scholarship_need,
      eca_text: row.eca_text,
    };
    const result = await runEvaluation(payload);
    return { ...result, row };
  });
