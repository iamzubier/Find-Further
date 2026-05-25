import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const RowSchema = z.object({
  name: z.string().min(1).max(500),
  host_country: z.string().max(120).nullable().optional(),
  degree_level: z.string().max(40).nullable().optional(),
  annual_value_usd: z.number().nullable().optional(),
  amount_display: z.string().max(200).nullable().optional(),
  deadline: z.string().max(40).nullable().optional(),
  official_url: z.string().max(1000).nullable().optional(),
  eligible_countries: z.array(z.string().max(120)).max(300).nullable().optional(),
  description: z.string().max(5000).nullable().optional(),
});

const InputSchema = z.object({
  key: z.string().min(1),
  rows: z.array(RowSchema).min(1).max(200),
});

function normLevel(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const v = raw.toLowerCase().trim();
  if (/(under ?grad|bachelor|college freshman|undergraduate|ug\b|bs\b|ba\b)/.test(v)) return "undergraduate";
  if (/(post ?grad|master|msc|ma\b|mba|graduate|ms\b|postgraduate)/.test(v)) return "postgraduate";
  if (/(phd|doctora|doctorate|dphil)/.test(v)) return "phd";
  if (/(diploma|certificate|short course)/.test(v)) return "diploma";
  if (/all|any/.test(v)) return "all";
  return null;
}

function normDate(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const s = raw.trim();
  if (!s) return null;
  // Already ISO
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const d = new Date(s);
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return null;
}

function normUsd(raw: number | null | undefined, display: string | null | undefined): number | null {
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  if (display) {
    const m = display.replace(/,/g, "").match(/(\d+(?:\.\d+)?)/);
    if (m) return parseFloat(m[1]);
  }
  return null;
}

export const scholarshipsImportBatch = createServerFn({ method: "POST" })
  .inputValidator((input) => InputSchema.parse(input))
  .handler(async ({ data }) => {
    if (data.key !== process.env.ADMIN_SECRET) throw new Error("Unauthorized");

    const inserted: string[] = [];
    const updated: string[] = [];
    const failed: { name: string; error: string }[] = [];

    for (const row of data.rows) {
      const name = row.name.trim();
      const host_country = row.host_country?.trim() || null;
      const payload = {
        name,
        host_country,
        degree_level: normLevel(row.degree_level),
        annual_value_usd: normUsd(row.annual_value_usd ?? null, row.amount_display ?? null),
        amount_display: row.amount_display?.trim() || null,
        deadline: normDate(row.deadline),
        official_url: row.official_url?.trim() || null,
        eligible_countries: row.eligible_countries ?? [],
        description: row.description?.trim() || null,
      };

      // Check existing by lower(name) + lower(country)
      const { data: existing, error: selErr } = await supabaseAdmin
        .from("scholarships" as never)
        .select("id, name, host_country")
        .ilike("name", name)
        .limit(50);
      if (selErr) { failed.push({ name, error: selErr.message }); continue; }

      const match = (existing as { id: string; name: string; host_country: string | null }[] | null)
        ?.find((r) => (r.host_country ?? "").toLowerCase() === (host_country ?? "").toLowerCase());

      if (match) {
        const { error } = await supabaseAdmin
          .from("scholarships" as never)
          .update(payload as never)
          .eq("id", match.id);
        if (error) failed.push({ name, error: error.message });
        else updated.push(name);
      } else {
        const { error } = await supabaseAdmin
          .from("scholarships" as never)
          .insert(payload as never);
        if (error) failed.push({ name, error: error.message });
        else inserted.push(name);
      }
    }

    return { inserted: inserted.length, updated: updated.length, failed };
  });
