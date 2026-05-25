# Scholarship Infrastructure Overhaul — Plan

This is a very large change set. To keep it safe and reviewable I'll ship it in 4 phases. You can approve the whole plan now and I'll execute phase-by-phase, pausing only if a migration needs your confirmation.

## Phase 1 — Schema (one migration)

Extend `scholarships` with the missing tracking columns (idempotent `ADD COLUMN IF NOT EXISTS`):
`status`, `next_cycle`, `fully_funded`, `covers_tuition`, `covers_living`, `covers_airfare`, `covers_insurance`, `monthly_stipend_usd`, `seats_per_year`, `acceptance_rate`, `avg_gpa_recipients`, `avg_ielts_recipients`, `competitiveness`, `bond_requirement`, `renewable`, `renewal_conditions`, `work_permit`, `age_limit`, `required_docs jsonb`, `application_steps jsonb`, `results_announced`, `official_apply_url`, `banner_image_url`, `flag_emoji`, `subject_restrictions text[]`, `universities_covered text[]`, `wow_fact`. (slug, degree_level, host_country, eligible_countries, annual_value_usd already exist.)

Create:
- `scholarship_tips` (id, scholarship_id FK, tip_text, source_platform, source_url, source_upvotes, tag, applicant_country, year_posted, helpful_count, created_at)
- `scholarship_success_stories` (id, scholarship_id FK, applicant_country, curriculum, gpa_raw, ielts_score, major, eca_summary, year_awarded, story, tips_from_winner, created_at)

RLS: public SELECT on both; writes only via service role.

## Phase 2 — Seed ingestion server fn

`src/lib/seed-scholarships.functions.ts` — `seedScholarships` server fn (admin-secret guarded, `supabaseAdmin`) that upserts all 45 elite programs keyed by `slug`, plus a curated set of community tips (APS for Germany, Chevening 4-essay framework, GKS health cert, etc.) and 2–4 anonymized success stories per flagship award. Realistic but conservative figures; flagged with `hydrated_at` set so JIT hydrator skips them.

A tiny admin page at `/admin/seed-scholarships` posts to it (or you can call it via the invoke-server-function tool).

## Phase 3 — Hub redesign (`scholarships.index.tsx`)

Academic light theme. Sections:
- Hero: "Find scholarships you can actually win." + odds subhead
- WTF Scholarships horizontal carousel (auto-pulled from `wow_fact`)
- Filter Matrix: Degree level / Status / Funding scope / Host country / Subject / Competitiveness
- Two-stream card grid: Open vs Closed-prep-mode. Pulsing red countdown for <30 days. Red "Next cycle" pill for closed.

## Phase 4 — 8-tab detail (`scholarships.$slug.tsx`)

Rebuild with 8 tabs: Overview, What It Covers (balance sheet), Who Can Apply (GPA cross-map US/UK/SA boards), How To Apply (vertical timeline + common errors), Required Documents (country dropdown — Bangladesh/India/Pakistan/Nigeria localized + checklist download), Tips From Recipients (pulled from `scholarship_tips`), Success Stories (from `scholarship_success_stories`), Odds Calculator (reads profile from auth context, returns % + improvement bullets). Closed scholarships render in "Next Cycle Prep Mode" with disabled apply CTA but full research content.

## Notes
- All ingestion via `createServerFn` + `supabaseAdmin`. No Edge Functions.
- Builds on top of existing `hydrate-scholarship.functions.ts` (still runs for unknown slugs).
- Existing enriched static fallback (`scholarship-enrich.ts`) stays as final safety net.

Approve and I'll start with Phase 1 (the migration).