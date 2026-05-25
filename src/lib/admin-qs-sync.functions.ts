import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

function checkAdmin(key: string) {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) throw new Error("ADMIN_SECRET not configured");
  if (key !== secret) throw new Error("Unauthorized");
}

const RowSchema = z.object({
  name: z.string().min(1).max(300),
  qs_rank: z.number().int().positive().nullable().optional(),
  international_pct: z.string().max(20).nullable().optional(),
  total_students: z.string().max(50).nullable().optional(),
  student_faculty_ratio: z.string().max(50).nullable().optional(),
});

const InputSchema = z.object({
  key: z.string().min(1).max(200),
  rows: z.array(RowSchema).min(1).max(200),
});

function norm(s: string): string {
  return s
    .toLowerCase()
    .replace(/\b(the|university|of|at|college|institute|institution|state)\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(s: string): Set<string> {
  return new Set(norm(s).split(" ").filter((t) => t.length > 1));
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  return inter / (a.size + b.size - inter);
}

export const qsSyncBatch = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => InputSchema.parse(d))
  .handler(async ({ data }) => {
    checkAdmin(data.key);

    const updated: string[] = [];
    const unmatched: string[] = [];
    const failed: { name: string; error: string }[] = [];

    // Load entire catalog (lightweight) once per batch. ~1k rows is fine.
    const { data: catalog, error: catErr } = await supabaseAdmin
      .from("universities_detail")
      .select("slug, name, admission_reqs");
    if (catErr) throw new Error(catErr.message);

    const indexed = (catalog ?? []).map((c) => ({
      slug: c.slug,
      name: c.name,
      admission_reqs: c.admission_reqs,
      tokens: tokens(c.name),
      normName: norm(c.name),
    }));

    for (const row of data.rows) {
      try {
        const qName = norm(row.name);
        const qTokens = tokens(row.name);

        // 1) exact normalized match
        let match = indexed.find((u) => u.normName === qName);
        // 2) substring containment
        if (!match) {
          match = indexed.find(
            (u) => u.normName.includes(qName) || qName.includes(u.normName),
          );
        }
        // 3) fuzzy token jaccard >= 0.6
        if (!match) {
          let best = 0;
          for (const u of indexed) {
            const s = jaccard(qTokens, u.tokens);
            if (s > best) {
              best = s;
              match = s >= 0.6 ? u : match;
            }
          }
        }

        if (!match) {
          unmatched.push(row.name);
          continue;
        }

        const patch: Record<string, unknown> = {};
        if (row.qs_rank != null) patch.qs_rank = row.qs_rank;
        if (row.international_pct) patch.international_pct = row.international_pct;
        if (row.total_students) patch.total_students = row.total_students;
        if (row.student_faculty_ratio) {
          patch.student_faculty_ratio = row.student_faculty_ratio;
          const existingReqs =
            typeof match.admission_reqs === "object" && match.admission_reqs !== null
              ? (match.admission_reqs as Record<string, unknown>)
              : {};
          patch.admission_reqs = {
            ...existingReqs,
            student_faculty_ratio: row.student_faculty_ratio,
          };
        }

        if (Object.keys(patch).length === 0) {
          unmatched.push(`${row.name} (no data)`);
          continue;
        }

        const { error } = await supabaseAdmin
          .from("universities_detail")
          .update(patch)
          .eq("slug", match.slug);

        if (error) {
          failed.push({ name: row.name, error: error.message });
        } else {
          updated.push(match.name);
        }
      } catch (e) {
        failed.push({ name: row.name, error: (e as Error).message });
      }
    }

    return { updated, unmatched, failed };
  });
