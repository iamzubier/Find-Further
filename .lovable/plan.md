## What you're getting

A full **per-university detail page system** at `/universities/[slug]` for 30 seed universities (MIT, Harvard, Stanford, Oxford, Cambridge, ETH, TU Munich, UCL, Imperial, Edinburgh, Toronto, McGill, Waterloo, UBC, Melbourne, Sydney, Amsterdam, TU Delft, KTH, Uppsala, Helsinki, Aalto, Oslo, Politecnico Milano, Sapienza, NUS, SNU, KAIST, U Tokyo, Waseda).

Each page has 6 sticky tabs, a campus hero, logos from Clearbit, sticky match/compare/save sidebar, deadline countdown, and a community tips system pulling from Reddit/Quora/YouTube-style entries.

## Page structure

```
/universities/mit
├── HERO: campus photo + dark gradient
│        ├ Logo (Clearbit) bottom-left
│        ├ Name, flag, city, QS #, founded year
├── STICKY TAB BAR ──────────────────────────────┐
│   Overview │ Admissions │ Tuition │ Programs │ How To Get In │ Exams
│                                               │
├── TAB CONTENT ────────────────────┐  ┌────────┤
│                                   │  │ SIDEBAR (sticky)
│                                   │  │ ├ Match % (circular)
│                                   │  │ ├ Save / Compare / Share
│                                   │  │ ├ Deadline countdown
│                                   │  │ └ Apply button
└── FLOATING COMPARE BAR (when ≥1 added)
```

## Tabs in detail

1. **Overview** — about, key stats row (acceptance, students, intl %, ratio), campus life, alumni, subject rankings, website button, Google Maps embed.
2. **Admissions** — requirements table with **BD↔US/UK/EU GPA conversion shown inline**, deadlines by intake (Fall/Spring/Winter), step-by-step process, doc checklist, apply link, processing time.
3. **Tuition & Aid** — tuition tables, living costs, total CoA, fee waivers, scholarship cards, financial aid, work permit rules per country.
4. **Programs** — programs grouped by faculty with search + faculty filter; each row shows duration, language, tuition.
5. **How To Get In** — curated community tips with source platform logos (Reddit/Quora/YouTube), upvote counts, tag filter, "Submit a tip" form, disclaimer.
6. **Entrance Exams** — required exams with score thresholds for THIS uni, registration links, next dates, prep resources, sample paper links.

## Database changes

New tables (`/universities` catalog stays for the directory; new `universities_detail` holds rich page data so we don't bloat the 10k-row catalog):

```sql
universities_detail (
  slug text primary key,
  catalog_id text,              -- joins universities_catalog.id
  name, country, city, qs_rank, founded_year,
  acceptance_rate, total_students, international_pct, student_faculty_ratio,
  about, campus_life, notable_alumni text[], subject_rankings jsonb,
  logo_url, campus_image_url, official_url, application_url, maps_query,
  admission_reqs jsonb,         -- {min_gpa_us, ielts, toefl, sat_min, sat_max, act_min, act_max, language}
  deadlines jsonb,              -- [{intake, deadline, decision}]
  application_steps text[],
  required_docs text[],
  processing_time text,
  tuition jsonb,                -- {per_year_usd, per_semester, per_credit, currency, display}
  living_cost_monthly integer,
  fee_waivers text,
  scholarships jsonb,           -- [{name, amount, eligibility, deadline, url}]
  financial_aid text,
  work_permit text,
  programs_detail jsonb,        -- [{faculty, name, duration, language, tuition, seats}]
  exams jsonb                   -- [{name, what_it_tests, score_req, register_url, next_dates, prep_links[], sample_url}]
)

university_tips (
  id uuid primary key,
  uni_slug text references universities_detail(slug),
  tip_text text,
  source_platform text,         -- reddit | quora | youtube | forum
  source_url text,
  source_upvotes integer,
  tag text,                     -- Academics | ECA | Scholarship | Strategy | CampusLife | FinancialAid
  posted_at date,
  verified boolean default false,
  submitted_by uuid,            -- nullable; user-submitted tips
  approved boolean default true,
  created_at timestamptz default now()
)
```

Seeded with the 30 universities + ~6 tips each (180 tips). All RLS-protected (public read, authenticated insert for tips with `approved=false`).

## Compare upgrade

`/compare` page rewritten to show the new richer rows: logo+name, QS, country, acceptance %, tuition, IELTS, GPA (with BD conversion), SAT, scholarships, top programs, intl %, deadline, website. **Best value per row highlighted green.** "Match to my profile" button per column if logged in.

The existing floating CompareTray stays; it already supports max 3.

## GPA conversion utility

Already exists at `src/lib/gpa.ts` (`bdToUs`, `bdToUk`, `bdToEcts`). I'll add the **reverse** helper `usToBd(usGpa)` so when a uni says "min 3.5 US", we render: **"3.5 US GPA = BD HSC 4.25+ / 5.0"** automatically everywhere.

## Files

**Created**
- `supabase/migrations/...sql` — two new tables + seed for 30 unis + tips
- `src/lib/universities-detail.ts` — typed seed data (used to generate migration + as fallback)
- `src/lib/universities-detail.functions.ts` — server fn to fetch detail + tips by slug
- `src/lib/tips.functions.ts` — submit-tip server fn (auth-gated)
- `src/routes/universities.$slug.tsx` — the new detail page (replaces `universities.$uniId.tsx`)
- `src/components/uni/Hero.tsx`, `TabBar.tsx`, `Sidebar.tsx`, `TipCard.tsx`, `SubmitTipDialog.tsx`, `DeadlineCountdown.tsx`, `MatchRing.tsx`

**Modified**
- `src/routes/universities.tsx` — link to `/universities/<slug>` instead of `/<id>`
- `src/routes/compare.tsx` — rewrite with richer rows + green-highlight + match button
- `src/lib/gpa.ts` — add `usToBd()` helper

## Out of scope (call out so you can ask if you want them)

- Live Reddit/Quora scraping — tips are seeded as realistic examples per uni. Real scraping needs API keys + scheduled jobs; tell me if you want that added.
- Clearbit logos and Unsplash photos use direct URLs at runtime (no API key needed for Clearbit's free logo endpoint). If a logo 404s we fall back to a monogram.
- The 10k catalog directory keeps working unchanged. Only the 30 seeded unis get rich detail pages; clicking any other catalog uni shows a "Rich page coming soon — basic info + outbound link" stub (so we don't break the directory).

Approve and I'll ship it in one pass.