
# BeyondBorder v2 — "One Umbrella" Plan

Build a thin end-to-end version of all three pillars (bigger directory + compare, hacks system, profile-matching engine) on top of what's shipped. Honest about data sources — no faking real Reddit links.

---

## 1. Massive university directory

**Data source:** Import the open **Hipolabs universities dataset** (~10k unis worldwide, with name, country, web pages, domains — free, no API key). Filter to BD-relevant target regions: EU, US, UK, Canada, Australia, key Asia (Singapore, Japan, Malaysia, HK, South Korea).

- New table `universities_catalog` (id, name, country, region, website, domains, qs_rank nullable, has_curated_data bool).
- Seed via a migration that ingests the dataset (~5–8k rows after filtering).
- Existing hand-curated 13 unis stay as "featured/curated" — flagged `has_curated_data = true` with rich tuition/deadline/dealTag/blurb data.
- Universities list page: paginated, infinite-scroll, search by name+country, filter by region/program (program filter only applies to curated entries in v1).

## 2. University detail page (`/universities/$id`)

The hook lives here. Sections in order:
1. **Header** — name, country flag, QS rank, "curated" or "community" badge.
2. **Quick facts** — tuition, deadline, deal tag (curated unis only; for non-curated, show "Help us add this — verified data coming soon" + link to official site).
3. **Your match** (logged in only) — score + Reach / Match / Safety verdict + 3 reasons. See Pillar 3.
4. **Admission hacks & tricks** — hybrid:
   - For curated/top unis: a small `university_hacks` table with hand-added entries `{ hack_text, source_url, source_type: 'reddit'|'quora'|'official'|'youtube' }`, rendered with the platform's logo icon next to each link.
   - For others: a "Generate AI insights" button — calls a new `getUniHacks` server function that uses Lovable AI (gemini-3-flash-preview) to synthesize common community advice, **clearly labeled "AI summary — not direct quotes"**. Cached in a `university_hacks_ai` table after first generation to keep costs down.
5. **Entrance exams & prep** — if uni requires SAT/ACT/IELTS/TOEFL/uni-specific exam: list each with official syllabus link + "Generate my study plan" button (Aria-powered, uses student's current scores from profile).
6. **Compare button** — adds uni to a comparison tray (Zustand store, up to 3 unis).
7. **Save to shortlist** — existing flow.

## 3. Comparison page (`/compare`)

Side-by-side table for up to 3 unis: tuition, deadline, deal tag, min GPA (BD scale + converted), required tests, your match %, scholarships available. Tray persists in localStorage. Inspired by bachelorsportal.

## 4. Profile-matching engine

New `src/lib/matching.ts` — pure function that scores a uni against a profile:

```
score = weighted(
  gpa_fit (uni.min_gpa vs profile.hsc_gpa, converted),
  test_fit (SAT/IELTS/TOEFL vs typical bar for that uni's tier),
  country_fit (profile.countries includes uni.country),
  program_fit (profile.program in uni.programs),
  budget_fit (uni.tuition vs profile.budget)
)
→ verdict: 'Safety' (85+) | 'Match' (60–84) | 'Reach' (35–59) | 'Long shot' (<35)
```

Used on:
- Dashboard "Best picks" — top 12 across all unis the student qualifies for.
- Uni detail page header.
- Universities list — optional "Sort by my match" toggle (logged in only).

Each match shows 2–3 plain-English reasons ("Your GPA 4.8 ≈ US 3.7 — clears RWTH's 3.5 bar"; "IELTS 7.0 meets the 6.5 minimum").

## 5. Aria upgrades

- New server fn `generateStudyPlan({ uniId, exam })` — Aria builds a week-by-week plan from current score → target.
- New server fn `getUniHacks({ uniId })` — AI synthesis fallback for non-curated unis.
- Existing chat unchanged.

## 6. Schema changes (one migration)

```
universities_catalog  (id, name, country, region, website, qs_rank, has_curated_data, ...)
university_hacks      (id, uni_id, hack_text, source_url, source_type, upvotes, created_at)  -- curated, RLS read-all
university_hacks_ai   (id, uni_id, content_md, generated_at)  -- cache, RLS read-all, server writes only
```

RLS: read-public for catalog + hacks tables (no PII); writes only via server fns using service role.

## 7. Honest tradeoffs

- **No live Reddit/Quora scraping in v1.** Real cited hacks come from manual curation (top ~30 unis). Everywhere else is AI-synthesized with a visible label. If you later want real live citations, we add the Firecrawl connector — that's a separate decision because it costs per request.
- The 5–8k imported unis will have **name + country + website only** at first. Tuition/deadlines fill in as you curate them. The catalog still feels "complete" because every uni is searchable and openable.
- Match scoring is heuristic, not predictive — based on published minimums and tier inference, not admit rates.

## 8. File map

```
supabase/migrations/<new>.sql          -- 3 new tables + RLS + seed loader function
scripts/seed-universities.ts           -- one-off Hipolabs → DB import (run once via psql)
src/lib/matching.ts                    -- scoring engine
src/lib/uni-catalog.functions.ts       -- listCatalog, getUni, getCompareData
src/lib/hacks.functions.ts             -- getCuratedHacks, generateAiHacks
src/lib/exam-plan.functions.ts         -- generateStudyPlan
src/routes/universities.tsx            -- rewrite for paginated catalog + match sort
src/routes/universities.$id.tsx        -- NEW detail page
src/routes/compare.tsx                 -- NEW comparison page
src/components/MatchBadge.tsx          -- Reach/Match/Safety pill
src/components/HackCard.tsx            -- hack + source-platform icon
src/components/CompareTray.tsx         -- floating "compare 2/3" tray
src/lib/compare-store.ts               -- Zustand store
```

## 9. What ships this turn

All of the above as a working lightweight v1. The 5k+ uni import + 30-uni hack curation set + the matching engine + detail page + compare page + AI study plan button. No Firecrawl, no live scraping, no exam-question bank — those are v2.

Ready to build?
