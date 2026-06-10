import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { z } from "zod";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Search, Heart, ArrowRight, Globe, ChevronLeft, ChevronRight, Sparkles, GitCompare } from "lucide-react";
import { UNIVERSITIES, COUNTRIES, PROGRAMS, type University } from "@/lib/data";
import { matchUniversity } from "@/lib/matching";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { getUniversityCount } from "@/lib/admin-import.functions";
import { useCompare } from "@/lib/compare-store";
import { toast } from "sonner";
import { SmartLogo } from "@/components/SmartLogo";
import { SmartCampusImage } from "@/components/SmartCampusImage";


const SearchSchema = z.object({
  country: z.string().optional(),
  program: z.string().optional(),
  q: z.string().optional(),
});

export const Route = createFileRoute("/universities/")({
  validateSearch: (s) => SearchSchema.parse(s),
  head: () => ({ meta: [
    { title: "Universities — BeyondBorder" },
    { name: "description", content: "Browse 10,000+ universities worldwide with tuition, scholarships, and real admission tips from students." },
  ]}),
  component: UniversitiesPage,
});

const REGIONS = [
  { value: "all", label: "All regions" },
  { value: "EU", label: "Europe" },
  { value: "UK", label: "United Kingdom" },
  { value: "US", label: "United States" },
  { value: "CA", label: "Canada" },
  { value: "AU", label: "Australia / NZ" },
  { value: "ASIA", label: "Asia / Middle East" },
  { value: "OTHER", label: "Rest of world" },
];

function UniversitiesPage() {
  const search = Route.useSearch();
  const [tab, setTab] = useState<"featured" | "catalog">("catalog");
  const countFn = useServerFn(getUniversityCount);
  const { data: countData } = useQuery({
    queryKey: ["uni-count"], queryFn: () => countFn(), staleTime: 60_000,
  });
  const countLabel = countData?.count ? `${countData.count.toLocaleString()}+` : "10,000+";

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-4xl font-extrabold md:text-5xl">Universities</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {tab === "featured"
              ? "Hand-curated picks with tuition, scholarships & admission hacks."
              : `${countLabel} universities worldwide — EU, UK, US, CA, AU, Asia and beyond.`}
          </p>
        </div>
        <div className="inline-flex rounded-lg border border-border bg-card p-1 text-sm">
          <button
            onClick={() => setTab("featured")}
            className={`rounded-md px-3 py-1.5 ${tab === "featured" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Sparkles className="mr-1 inline h-3.5 w-3.5" /> Featured ({UNIVERSITIES.length})
          </button>
          <button
            onClick={() => setTab("catalog")}
            className={`rounded-md px-3 py-1.5 ${tab === "catalog" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Globe className="mr-1 inline h-3.5 w-3.5" /> Full catalog
          </button>
        </div>
      </div>

      <div className="card-surface mt-5 flex flex-wrap items-center justify-between gap-3 border-emerald-500/30 bg-emerald-500/5 p-4">
        <p className="text-sm">
          <Sparkles className="mr-1 inline h-4 w-4 text-emerald-600" />
          <b>See your chances</b> at every university — works for any curriculum (HSC, A-Levels, IB, Gaokao, Abitur…).
        </p>
        <Button asChild size="sm" className="bg-emerald-600 text-white hover:bg-emerald-700">
          <Link to="/evaluate">✨ Evaluate my profile</Link>
        </Button>
      </div>

      {tab === "featured" ? <FeaturedList initial={search} /> : <CatalogBrowser />}

      <LoginNudge text="Want to see which match YOUR profile?" />
    </div>
  );
}

function FeaturedList({ initial }: { initial: { country?: string; program?: string; q?: string } }) {
  const { user } = useAuth();
  const [q, setQ] = useState(initial.q ?? "");
  const [country, setCountry] = useState(initial.country ?? "all");
  const [program, setProgram] = useState(initial.program ?? "all");
  const [sort, setSort] = useState<"rank" | "name" | "match">("rank");
  const [scholarshipOnly, setScholarshipOnly] = useState(false);

  const profileQuery = useQuery({
    queryKey: ["profile-match", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle();
      return data;
    },
  });
  const profile = profileQuery.data;

  const results = useMemo(() => {
    let list = UNIVERSITIES.filter((u) => {
      if (country !== "all" && u.country !== country) return false;
      if (program !== "all" && !u.programs.includes(program)) return false;
      if (scholarshipOnly && !["Tuition Free","Full Scholarship","Need-blind Aid","Stipend Available"].includes(u.dealTag)) return false;
      if (q && !(u.name.toLowerCase().includes(q.toLowerCase()) || u.country.toLowerCase().includes(q.toLowerCase()))) return false;
      return true;
    });
    const withMatch = list.map((u) => ({ u, score: profile ? matchUniversity(u, profile).score : 0 }));
    if (sort === "match" && profile) withMatch.sort((a, b) => b.score - a.score);
    else if (sort === "name") withMatch.sort((a, b) => a.u.name.localeCompare(b.u.name));
    else withMatch.sort((a, b) => a.u.qsRank - b.u.qsRank);
    return withMatch;
  }, [q, country, program, sort, scholarshipOnly, profile]);

  return (
    <>
      <div className="card-surface mt-6 grid gap-2 p-3 md:grid-cols-[1fr_180px_180px_160px_auto]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search university or country…" className="h-11 bg-secondary pl-9" />
        </div>
        <Select value={country} onValueChange={setCountry}>
          <SelectTrigger className="h-11 bg-secondary"><SelectValue placeholder="Country" /></SelectTrigger>
          <SelectContent><SelectItem value="all">All countries</SelectItem>{COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={program} onValueChange={setProgram}>
          <SelectTrigger className="h-11 bg-secondary"><SelectValue placeholder="Program" /></SelectTrigger>
          <SelectContent><SelectItem value="all">All programs</SelectItem>{PROGRAMS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={sort} onValueChange={(v) => setSort(v as "rank"|"name"|"match")}>
          <SelectTrigger className="h-11 bg-secondary"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="rank">Sort: QS Rank</SelectItem>
            <SelectItem value="name">Sort: Name</SelectItem>
            {profile && <SelectItem value="match">Sort: My match</SelectItem>}
          </SelectContent>
        </Select>
        <label className="flex items-center gap-2 px-3 text-sm text-muted-foreground">
          <Switch checked={scholarshipOnly} onCheckedChange={setScholarshipOnly} /> Scholarship only
        </label>
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        {results.length} matches{profile && sort === "match" ? " · ranked by your profile" : ""}
      </p>

      {results.length === 0 ? (
        <div className="card-surface mt-6 p-12 text-center">
          <p className="font-heading text-xl text-foreground">No matches. Loosen the filters.</p>
          <p className="mt-1 text-sm text-muted-foreground">Try removing program or country, or turn off "Scholarship only".</p>
        </div>
      ) : (
        <div className="mt-4 grid gap-3">
          {results.map(({ u, score }) => <UniversityCard key={u.id} u={u} match={profile && score ? score : undefined} />)}
        </div>
      )}
    </>
  );
}

const PAGE_SIZE = 60;

const QS_RANGES = [
  { value: "all", label: "All QS Ranks", min: null, max: null },
  { value: "top50", label: "Top 50", min: 1, max: 50 },
  { value: "top100", label: "Top 100", min: 1, max: 100 },
  { value: "top200", label: "Top 200", min: 1, max: 200 },
  { value: "top500", label: "Top 500", min: 1, max: 500 },
  { value: "501plus", label: "501+", min: 501, max: 9999 },
  { value: "unranked", label: "Unranked", min: null, max: null },
] as const;

function CatalogBrowser() {
  const [q, setQ] = useState("");
  const [region, setRegion] = useState("all");
  const [country, setCountry] = useState("all");
  const [qsRange, setQsRange] = useState<string>("all");
  const [scholarshipOnly, setScholarshipOnly] = useState(false);
  const [page, setPage] = useState(0);

  const filterKey = `${q}|${region}|${country}|${qsRange}|${scholarshipOnly}`;
  useMemo(() => { setPage(0); }, [filterKey]);

  const countriesQuery = useQuery({
    queryKey: ["catalog-countries", region],
    queryFn: async () => {
      let query = supabase.from("universities_catalog").select("country");
      if (region !== "all") query = query.eq("region", region);
      const { data, error } = await query.limit(10000);
      if (error) throw error;
      return Array.from(new Set((data ?? []).map((d: any) => d.country))).sort();
    },
    staleTime: 5 * 60 * 1000,
  });

  const listQuery = useQuery({
    queryKey: ["catalog-list", q, region, country, qsRange, scholarshipOnly, page],
    queryFn: async () => {
      let query = supabase
        .from("universities_catalog")
        .select("id,name,country,region,website,state_province,has_curated_data,slug,qs_rank", { count: "exact" });
      if (region !== "all") query = query.eq("region", region);
      if (country !== "all") query = query.eq("country", country);
      if (scholarshipOnly) query = query.eq("has_curated_data", true);
      if (q.trim()) query = query.ilike("name", `%${q.trim()}%`);
      const rng = QS_RANGES.find(r => r.value === qsRange);
      if (qsRange === "unranked") {
        query = query.is("qs_rank", null);
      } else if (rng && rng.min !== null && rng.max !== null) {
        query = query.gte("qs_rank", rng.min).lte("qs_rank", rng.max);
      }
      query = query
        .order("country", { ascending: true })
        .order("qs_rank", { ascending: true, nullsFirst: false })
        .order("name")
        .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);
      const { data, error, count } = await query;
      if (error) throw error;
      return { rows: data ?? [], count: count ?? 0 };
    },
    placeholderData: keepPreviousData,
  });

  const total = listQuery.data?.count ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const slugs = useMemo(
    () => (listQuery.data?.rows ?? []).map((r: any) => r.slug).filter(Boolean) as string[],
    [listQuery.data],
  );

  const imagesQuery = useQuery({
    queryKey: ["catalog-images", slugs.join(",")],
    enabled: slugs.length > 0,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("universities_detail")
        .select("slug, campus_image_url, logo_url")
        .in("slug", slugs);
      if (error) throw error;
      const map: Record<string, { campus_image_url: string | null; logo_url: string | null }> = {};
      for (const r of data ?? []) {
        map[(r as any).slug] = {
          campus_image_url: (r as any).campus_image_url ?? null,
          logo_url: (r as any).logo_url ?? null,
        };
      }
      return map;
    },
  });

  const grouped = useMemo(() => {
    const rows = listQuery.data?.rows ?? [];
    const imgMap = imagesQuery.data ?? {};
    const map = new Map<string, any[]>();
    for (const r of rows) {
      const key = r.country || "Other";
      const enriched = {
        ...r,
        campus_image_url: r.slug ? imgMap[r.slug]?.campus_image_url ?? null : null,
        logo_url: r.slug ? imgMap[r.slug]?.logo_url ?? null : null,
      };
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(enriched);
    }
    return Array.from(map.entries());
  }, [listQuery.data, imagesQuery.data]);

  return (
    <>
      <div className="card-surface mt-6 grid gap-2 p-4 md:grid-cols-[1fr_180px_200px_180px_auto]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(0); }}
            placeholder="Search universities by name…"
            className="h-11 bg-white pl-9"
          />
        </div>
        <Select value={region} onValueChange={(v) => { setRegion(v); setCountry("all"); setPage(0); }}>
          <SelectTrigger className="h-11 bg-white"><SelectValue placeholder="Region" /></SelectTrigger>
          <SelectContent>{REGIONS.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={country} onValueChange={(v) => { setCountry(v); setPage(0); }}>
          <SelectTrigger className="h-11 bg-white"><SelectValue placeholder="Country" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All countries</SelectItem>
            {(countriesQuery.data ?? []).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={qsRange} onValueChange={(v) => { setQsRange(v); setPage(0); }}>
          <SelectTrigger className="h-11 bg-white"><SelectValue placeholder="QS Rank" /></SelectTrigger>
          <SelectContent>{QS_RANGES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
        </Select>
        <label className="flex items-center gap-2 whitespace-nowrap px-3 text-sm text-foreground">
          <Switch checked={scholarshipOnly} onCheckedChange={(v) => { setScholarshipOnly(v); setPage(0); }} /> Scholarships
        </label>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
        <span>{listQuery.isFetching ? "Searching…" : `${total.toLocaleString()} universities`}</span>
        <span>Page {page + 1} of {pages}</span>
      </div>

      {!listQuery.isFetching && grouped.length === 0 && q.trim().length >= 2 && (
        <HipolabsFallback query={q.trim()} />
      )}

      {!listQuery.isFetching && grouped.length === 0 && q.trim().length < 2 && (
        <div className="card-surface mt-6 p-12 text-center text-sm text-muted-foreground">
          No universities match those filters.
        </div>
      )}

      <div className="mt-6 space-y-10">
        {grouped.map(([countryName, rows]) => (
          <section key={countryName}>
            <div className="mb-4 flex items-baseline justify-between border-b border-border pb-2">
              <h2 className="font-heading text-2xl font-bold text-foreground">{countryName}</h2>
              <span className="text-xs uppercase tracking-wide text-muted-foreground">{rows.length} on this page</span>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {rows.map((u: any) => <CatalogCard key={u.id} u={u} />)}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-10 flex items-center justify-center gap-2">
        <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => Math.max(0, p - 1))}>
          <ChevronLeft className="h-4 w-4" /> Prev
        </Button>
        <Button variant="outline" size="sm" disabled={page + 1 >= pages} onClick={() => setPage(p => p + 1)}>
          Next <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </>
  );
}

function CatalogCard({ u }: { u: any }) {
  // If the DB has no campus image, fall back to a live Wikipedia thumbnail.
  const wiki = useWikiImage(u.name, !u.campus_image_url);
  const imageSrc = u.campus_image_url || wiki.data || null;
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-border bg-white transition-all duration-500 hover:-translate-y-1 hover:border-[oklch(0.74_0.10_85_/_0.6)] hover:shadow-[0_20px_40px_-20px_rgba(0,60,40,0.25)]">
      {/* Top campus image banner */}
      <div className="relative h-40 w-full overflow-hidden" style={{ background: "var(--gradient-hero)" }}>
        <SmartCampusImage src={imageSrc} name={u.name} noOverlay />
        {/* dark gradient for text legibility */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.35) 65%, rgba(0,0,0,0.6) 100%)" }}
        />
        {/* gold sheen on hover */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 translate-x-[-100%] transition-transform duration-1000 group-hover:translate-x-[100%]"
          style={{ background: "linear-gradient(110deg, transparent 40%, oklch(0.74 0.10 85 / 0.22) 50%, transparent 60%)" }}
        />
        {u.qs_rank && (
          <span
            className="absolute right-3 top-3 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-foreground"
            style={{ background: "var(--gradient-gold)", boxShadow: "0 2px 8px -2px oklch(0.74 0.10 85 / 0.6)" }}
          >
            QS #{u.qs_rank}
          </span>
        )}
        <div className="absolute bottom-3 left-3">
          <SmartLogo name={u.name} logoUrl={u.logo_url} website={u.website} size={52} className="ring-2 ring-white shadow-xl" />
        </div>
        <div className="absolute bottom-3 right-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/90 drop-shadow">
          {u.country}
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-heading text-base font-bold leading-snug text-foreground line-clamp-2 transition-colors group-hover:text-primary">{u.name}</h3>
        <div className="mt-1 text-xs text-muted-foreground">
          {u.state_province ? `${u.state_province}, ` : ""}{u.country}
        </div>
        {u.has_curated_data && (
          <span
            className="mt-3 inline-flex w-fit items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
            style={{
              background: "linear-gradient(135deg, oklch(0.74 0.10 85 / 0.15), oklch(0.74 0.10 85 / 0.05))",
              color: "oklch(0.45 0.08 80)",
              boxShadow: "inset 0 0 0 1px oklch(0.74 0.10 85 / 0.4)",
            }}
          >
            <Sparkles className="mr-1 inline h-2.5 w-2.5" /> Curated
          </span>
        )}
        <div className="mt-auto flex items-center justify-between gap-2 pt-4">
          {u.slug ? (
            <Button
              asChild
              size="sm"
              className="h-8 text-primary-foreground transition-all hover:shadow-[0_4px_14px_-4px_rgba(0,60,40,0.5)]"
              style={{ background: "var(--gradient-emerald)" }}
            >
              <Link to="/universities/$slug" params={{ slug: u.slug }}>
                View Details <ArrowRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>
          ) : (
            <span className="text-xs text-muted-foreground">Details coming soon</span>
          )}
          {u.website && (
            <a
              href={u.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground transition-colors hover:text-primary story-link"
            >
              Site ↗
            </a>
          )}
        </div>
      </div>
    </article>
  );
}



export function UniversityCard({ u, match }: { u: University; match?: number }) {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const compareItems = useCompare((s) => s.items);
  const addCmp = useCompare((s) => s.add);
  const slug = FEATURED_SLUG_MAP[u.id] ?? u.id;
  const inCmp = compareItems.some((x) => x.slug === slug);
  const cmpFull = compareItems.length >= 3 && !inCmp;

  const save = async () => {
    if (!user) { toast.error("Log in to save universities"); return; }
    setSaving(true);
    const { error } = await supabase.from("shortlist").insert({
      user_id: user.id, item_type: "university", item_id: u.id, item_name: u.name, item_data: u as any,
    });
    setSaving(false);
    if (error) toast.error(error.code === "23505" ? "Already saved" : error.message);
    else toast.success(`Saved ${u.name}`);
  };

  const onCompare = () => {
    if (inCmp) return;
    const ok = addCmp({
      slug,
      name: u.name,
      country: u.country,
      countryFlag: u.countryFlag,
      qsRank: u.qsRank,
      imageUrl: u.campusImageUrl,
    });
    if (!ok) { toast.error("Compare full (max 3)"); return; }
    const n = compareItems.length + 1;
    toast.success(`Added to compare (${n}/3)`);
  };

  return (
    <div className="group relative min-h-[280px] overflow-hidden rounded-md border border-border text-white shadow-md transition-all hover:-translate-y-0.5 hover:shadow-2xl">
      <SmartCampusImage src={u.campusImageUrl} name={u.name} noOverlay />
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/55 to-black/90" aria-hidden />
      <div className="relative z-[1] flex h-full min-h-[280px] flex-col p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-white/15 px-2 py-0.5 text-xs font-semibold backdrop-blur">#{u.qsRank}</span>
            <span className="text-xl">{u.countryFlag}</span>
            <span className="text-xs text-white/85">{u.country}</span>
          </div>
          <div className="flex items-center gap-2">
            {typeof match === "number" && (
              <span className="rounded-full bg-emerald-500 px-2.5 py-0.5 text-xs font-bold text-white">{match}% match</span>
            )}
            <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-semibold backdrop-blur">{u.dealTag}</span>
          </div>
        </div>

        <div className="mt-auto pt-8">
          <h3 className="font-heading text-2xl font-extrabold leading-tight md:text-3xl">{u.name}</h3>
          <p className="mt-2 line-clamp-2 max-w-2xl text-sm text-white/85">{u.blurb}</p>
          <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
            <div className="space-y-0.5 text-sm">
              <div className="text-[10px] uppercase tracking-wide text-white/70">Tuition · Deadline</div>
              <div className="font-semibold">{u.tuition} · {u.deadline}</div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onCompare}
                disabled={cmpFull || inCmp}
                className={`border-white/30 bg-white/10 backdrop-blur hover:bg-white/20 ${inCmp ? "text-emerald-300" : "text-white"}`}
              >
                <GitCompare className="mr-1 h-4 w-4" />
                {inCmp ? "Added ✓" : cmpFull ? "Compare full" : "Compare"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={save}
                disabled={saving}
                className="border-white/30 bg-white/10 text-white backdrop-blur hover:bg-white/20"
              >
                <Heart className="mr-1 h-4 w-4" /> Save
              </Button>
              <Button asChild size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Link to="/universities/$slug" params={{ slug }}>
                  View <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


// Map featured UNIVERSITIES ids (u1..u13) to rich detail page slugs.
const FEATURED_SLUG_MAP: Record<string, string> = {
  u1: "helsinki",
  u2: "aalto",
  u3: "tu-munich",
  u4: "rwth-aachen",
  u5: "oslo",
  u6: "politecnico-milano",
  u7: "mit",
  u8: "harvard-university",
  u9: "nus",
  u10: "melbourne",
  u11: "amsterdam",
  u12: "kth",
  u13: "edinburgh",
};

export function LoginNudge({ text }: { text: string }) {
  const { user } = useAuth();
  if (user) return null;
  return (
    <div className="card-surface mt-10 flex flex-col items-center justify-between gap-4 p-6 md:flex-row">
      <p className="font-heading text-lg font-extrabold">{text}</p>
      <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
        <Link to="/auth" search={{ tab: "signup" }}>Create free account</Link>
      </Button>
    </div>
  );
}

function slugifyName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

type HipoUni = { name: string; country: string; web_pages?: string[]; alpha_two_code?: string };

function HipolabsFallback({ query }: { query: string }) {
  const hipoQuery = useQuery({
    queryKey: ["hipolabs", query],
    queryFn: async (): Promise<HipoUni[]> => {
      const res = await fetch(`https://universities.hipolabs.com/search?name=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error("Hipolabs lookup failed");
      const json = (await res.json()) as HipoUni[];
      return json.slice(0, 12);
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  return (
    <div className="card-surface mt-6 p-6">
      <div className="mb-4 flex items-center gap-2">
        <Globe className="h-4 w-4 text-primary" />
        <h3 className="font-heading text-base font-bold">No local matches — checking the global registry…</h3>
      </div>
      {hipoQuery.isFetching && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-md border border-dashed border-border bg-neutral-50" />
          ))}
        </div>
      )}
      {hipoQuery.isError && (
        <p className="text-sm text-muted-foreground">Couldn't reach the external registry. Try a different search.</p>
      )}
      {!hipoQuery.isFetching && hipoQuery.data && hipoQuery.data.length === 0 && (
        <p className="text-sm text-muted-foreground">No universities anywhere match "{query}".</p>
      )}
      {!hipoQuery.isFetching && hipoQuery.data && hipoQuery.data.length > 0 && (
        <>
          <p className="mb-4 text-xs text-muted-foreground">
            We'll build a complete profile for these institutions on demand — click any card to start.
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {hipoQuery.data.map((u, i) => {
              const slug = slugifyName(u.name);
              const site = u.web_pages?.[0];
              return (
                <Link
                  key={`${slug}-${i}`}
                  to="/universities/$slug"
                  params={{ slug }}
                  search={{ name: u.name, country: u.country }}
                  className="group flex flex-col rounded-md border border-dashed border-border bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <SmartLogo name={u.name} website={site} size={40} />
                    <div className="min-w-0 flex-1">
                      <div className="font-heading text-sm font-bold leading-snug text-foreground line-clamp-2">
                        {u.name}
                      </div>
                      <div className="mt-0.5 text-xs text-muted-foreground">{u.country}</div>
                    </div>
                  </div>
                  <div className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary opacity-0 transition-opacity group-hover:opacity-100">
                    <Sparkles className="h-3 w-3" /> Build profile <ArrowRight className="h-3 w-3" />
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
