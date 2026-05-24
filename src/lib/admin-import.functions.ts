import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const HIPO_COUNTRIES = [
  "United States", "United Kingdom", "Germany", "France", "Netherlands",
  "Sweden", "Finland", "Norway", "Italy", "Canada", "Australia",
  "Japan", "South Korea", "Singapore", "Malaysia",
];

const REGION_MAP: Record<string, string> = {
  "United States": "US", "Canada": "CA", "United Kingdom": "UK",
  "Germany": "EU", "France": "EU", "Netherlands": "EU", "Sweden": "EU",
  "Finland": "EU", "Norway": "EU", "Italy": "EU",
  "Australia": "AU", "Japan": "ASIA", "South Korea": "ASIA",
  "Singapore": "ASIA", "Malaysia": "ASIA",
};

function slugify(s: string) {
  return s.toLowerCase().trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

function checkAdmin(key: string) {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) throw new Error("ADMIN_SECRET not configured");
  if (key !== secret) throw new Error("Unauthorized");
}

export const verifyAdmin = createServerFn({ method: "POST" })
  .inputValidator((d: { key: string }) => z.object({ key: z.string().min(1).max(200) }).parse(d))
  .handler(async ({ data }) => {
    try {
      checkAdmin(data.key);
      return { ok: true };
    } catch {
      return { ok: false };
    }
  });

export const importFromHipolabs = createServerFn({ method: "POST" })
  .inputValidator((d: { key: string }) => z.object({ key: z.string().min(1).max(200) }).parse(d))
  .handler(async ({ data }) => {
    checkAdmin(data.key);

    let totalFetched = 0;
    let inserted = 0;
    const errors: string[] = [];

    for (const country of HIPO_COUNTRIES) {
      try {
        const url = `https://universities.hipolabs.com/search?country=${encodeURIComponent(country)}`;
        const res = await fetch(url);
        if (!res.ok) { errors.push(`${country}: HTTP ${res.status}`); continue; }
        const list = (await res.json()) as Array<{
          name: string; country: string; domains?: string[]; web_pages?: string[]; "state-province"?: string;
        }>;
        totalFetched += list.length;

        const rows = list.map((u) => {
          const slug = slugify(u.name);
          const domain = u.domains?.[0] ?? null;
          const web = u.web_pages?.[0] ?? (domain ? `https://${domain}` : null);
          return {
            id: `hipo-${slug}`.slice(0, 80),
            slug,
            name: u.name,
            country: u.country,
            region: REGION_MAP[u.country] ?? "OTHER",
            website: web,
            domains: u.domains ?? [],
            state_province: u["state-province"] ?? null,
          };
        });

        // Upsert by id, skip existing slugs
        const { error, count } = await supabaseAdmin
          .from("universities_catalog")
          .upsert(rows, { onConflict: "id", ignoreDuplicates: true, count: "exact" });
        if (error) { errors.push(`${country}: ${error.message}`); continue; }
        inserted += count ?? 0;
      } catch (e) {
        errors.push(`${country}: ${(e as Error).message}`);
      }
    }

    return { totalFetched, inserted, errors };
  });

const QsRowSchema = z.object({
  institution: z.string().min(1),
  rank: z.union([z.string(), z.number()]).optional(),
  country: z.string().optional(),
  score: z.union([z.string(), z.number()]).optional(),
  academic_reputation: z.union([z.string(), z.number()]).optional(),
  employer_reputation: z.union([z.string(), z.number()]).optional(),
  citations_per_faculty: z.union([z.string(), z.number()]).optional(),
  international_students: z.union([z.string(), z.number()]).optional(),
});

export const importQsRankings = createServerFn({ method: "POST" })
  .inputValidator((d: { key: string; rows: unknown[] }) =>
    z.object({ key: z.string().min(1).max(200), rows: z.array(z.unknown()).max(5000) }).parse(d))
  .handler(async ({ data }) => {
    checkAdmin(data.key);
    let updated = 0, created = 0;
    const errors: string[] = [];

    for (const raw of data.rows) {
      const parsed = QsRowSchema.safeParse(raw);
      if (!parsed.success) continue;
      const row = parsed.data;
      const slug = slugify(row.institution);
      const rank = row.rank ? parseInt(String(row.rank).replace(/[^0-9]/g, ""), 10) || null : null;

      const { data: existing } = await supabaseAdmin
        .from("universities_catalog").select("id").eq("slug", slug).maybeSingle();

      if (existing) {
        const { error } = await supabaseAdmin
          .from("universities_catalog")
          .update({ qs_rank: rank })
          .eq("id", existing.id);
        if (error) errors.push(`${row.institution}: ${error.message}`);
        else updated++;
      } else {
        const { error } = await supabaseAdmin.from("universities_catalog").insert({
          id: `qs-${slug}`.slice(0, 80),
          slug,
          name: row.institution,
          country: row.country ?? "Unknown",
          region: row.country ? (REGION_MAP[row.country] ?? "OTHER") : "OTHER",
          qs_rank: rank,
        });
        if (error) errors.push(`${row.institution}: ${error.message}`);
        else created++;
      }
    }
    return { updated, created, errors: errors.slice(0, 20) };
  });

const TuitionRowSchema = z.object({
  university_name: z.string().min(1),
  country: z.string().optional(),
  tuition_usd: z.union([z.string(), z.number()]).optional(),
  currency: z.string().optional(),
  tuition_display: z.string().optional(),
});

export const importTuition = createServerFn({ method: "POST" })
  .inputValidator((d: { key: string; rows: unknown[] }) =>
    z.object({ key: z.string().min(1).max(200), rows: z.array(z.unknown()).max(5000) }).parse(d))
  .handler(async ({ data }) => {
    checkAdmin(data.key);
    let matched = 0;
    const errors: string[] = [];

    for (const raw of data.rows) {
      const parsed = TuitionRowSchema.safeParse(raw);
      if (!parsed.success) continue;
      const row = parsed.data;
      const slug = slugify(row.university_name);
      const usd = row.tuition_usd ? parseInt(String(row.tuition_usd).replace(/[^0-9]/g, ""), 10) || null : null;

      const { data: detail } = await supabaseAdmin
        .from("universities_detail").select("slug, tuition").eq("slug", slug).maybeSingle();

      if (detail) {
        const tuition = {
          ...(typeof detail.tuition === "object" && detail.tuition !== null ? detail.tuition : {}),
          per_year_usd: usd,
          currency: row.currency ?? "USD",
          display: row.tuition_display ?? (usd ? `$${usd.toLocaleString()}/yr` : undefined),
        };
        const { error } = await supabaseAdmin
          .from("universities_detail").update({ tuition }).eq("slug", slug);
        if (error) errors.push(`${row.university_name}: ${error.message}`);
        else matched++;
      }
    }
    return { matched, errors: errors.slice(0, 20) };
  });

export const getUniversityCount = createServerFn({ method: "GET" }).handler(async () => {
  const { count } = await supabaseAdmin
    .from("universities_catalog")
    .select("*", { count: "exact", head: true });
  return { count: count ?? 0 };
});
