import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { z } from "zod";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Search, Heart, ArrowRight, Globe, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { UNIVERSITIES, COUNTRIES, PROGRAMS, type University } from "@/lib/data";
import { matchUniversity } from "@/lib/matching";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const SearchSchema = z.object({
  country: z.string().optional(),
  program: z.string().optional(),
  q: z.string().optional(),
});

export const Route = createFileRoute("/universities")({
  validateSearch: (s) => SearchSchema.parse(s),
  head: () => ({ meta: [
    { title: "Universities — BeyondBorder" },
    { name: "description", content: "Browse 10,000+ universities worldwide with tuition, scholarships, and admission hacks for BD students." },
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

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-4xl font-extrabold md:text-5xl">Universities</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {tab === "featured"
              ? "Hand-curated picks with tuition, scholarships & admission hacks."
              : "10,000+ universities worldwide — EU, UK, US, CA, AU, Asia and beyond."}
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

const PAGE_SIZE = 25;

function CatalogBrowser() {
  const [q, setQ] = useState("");
  const [region, setRegion] = useState("all");
  const [country, setCountry] = useState("all");
  const [page, setPage] = useState(0);

  // Reset page when filters change
  const filterKey = `${q}|${region}|${country}`;
  useMemo(() => { setPage(0); }, [filterKey]);

  // Countries list — derive from REGION choice with a static map
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
    queryKey: ["catalog-list", q, region, country, page],
    queryFn: async () => {
      let query = supabase
        .from("universities_catalog")
        .select("id,name,country,region,website,state_province,has_curated_data,slug", { count: "exact" });
      if (region !== "all") query = query.eq("region", region);
      if (country !== "all") query = query.eq("country", country);
      if (q.trim()) query = query.ilike("name", `%${q.trim()}%`);
      query = query.order("name").range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);
      const { data, error, count } = await query;
      if (error) throw error;
      return { rows: data ?? [], count: count ?? 0 };
    },
    placeholderData: keepPreviousData,
  });

  const total = listQuery.data?.count ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <div className="card-surface mt-6 grid gap-2 p-3 md:grid-cols-[1fr_180px_220px]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(0); }}
            placeholder="Search 5,900+ universities by name…"
            className="h-11 bg-secondary pl-9"
          />
        </div>
        <Select value={region} onValueChange={(v) => { setRegion(v); setCountry("all"); setPage(0); }}>
          <SelectTrigger className="h-11 bg-secondary"><SelectValue placeholder="Region" /></SelectTrigger>
          <SelectContent>{REGIONS.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={country} onValueChange={(v) => { setCountry(v); setPage(0); }}>
          <SelectTrigger className="h-11 bg-secondary"><SelectValue placeholder="Country" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All countries</SelectItem>
            {(countriesQuery.data ?? []).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <span>{listQuery.isFetching ? "Searching…" : `${total.toLocaleString()} universities`}</span>
        <span>Page {page + 1} of {pages}</span>
      </div>

      <div className="mt-4 grid gap-2">
        {(listQuery.data?.rows ?? []).map((u: any) => (
          <div key={u.id} className="card-surface flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                {u.slug ? (
                  <Link
                    to="/universities/$slug"
                    params={{ slug: u.slug }}
                    className="font-heading text-base font-bold leading-tight hover:text-primary hover:underline"
                  >
                    {u.name}
                  </Link>
                ) : (
                  <h3 className="font-heading text-base font-bold leading-tight">{u.name}</h3>
                )}
                {u.has_curated_data && (
                  <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary ring-1 ring-primary/30">
                    <Sparkles className="mr-0.5 inline h-2.5 w-2.5" /> Curated
                  </span>
                )}
              </div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                {u.country}{u.state_province ? ` · ${u.state_province}` : ""}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {u.slug && (
                <Button asChild size="sm" className="h-8 bg-primary text-primary-foreground hover:bg-primary/90">
                  <Link to="/universities/$slug" params={{ slug: u.slug }}>
                    View page <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </Link>
                </Button>
              )}
              {u.website && (
                <a
                  href={u.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-muted-foreground hover:text-primary hover:underline"
                >
                  Visit site ↗
                </a>
              )}
            </div>
          </div>
        ))}
        {!listQuery.isFetching && (listQuery.data?.rows.length ?? 0) === 0 && (
          <div className="card-surface p-10 text-center text-sm text-muted-foreground">No universities match those filters.</div>
        )}
      </div>

      <div className="mt-6 flex items-center justify-center gap-2">
        <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => Math.max(0, p - 1))}>
          <ChevronLeft className="h-4 w-4" /> Prev
        </Button>
        <Button variant="outline" size="sm" disabled={page + 1 >= pages} onClick={() => setPage(p => p + 1)}>
          Next <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        Tuition, deadlines, and admission hacks are available on hand-curated universities.{" "}
        <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="text-primary hover:underline">
          Switch to Featured ↑
        </button>
      </p>
    </>
  );
}

export function UniversityCard({ u, match }: { u: University; match?: number }) {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);

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

  return (
    <div className="card-surface group p-5 transition-colors hover:border-primary/40 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="rounded-md bg-secondary px-2.5 py-1 text-xs font-semibold text-foreground">#{u.qsRank}</div>
          <span className="text-2xl">{u.countryFlag}</span>
          <div>
            <h3 className="font-heading text-xl font-extrabold leading-tight">{u.name}</h3>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>{u.country}</span>
              <span>·</span>
              <span>{u.programs.join(" · ")}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {typeof match === "number" && (
            <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary ring-1 ring-primary/30">{match}% match</span>
          )}
          <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary ring-1 ring-primary/30">{u.dealTag}</span>
        </div>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">{u.blurb}</p>
      <div className="mt-4 grid gap-3 text-sm md:grid-cols-3">
        <div><div className="text-xs uppercase text-muted-foreground">Tuition</div><div className="font-semibold">{u.tuition}</div></div>
        <div><div className="text-xs uppercase text-muted-foreground">Deadline</div><div className="font-semibold">{u.deadline}</div></div>
        <div className="flex items-end justify-end gap-2 md:col-start-3">
          <Button variant="outline" size="sm" onClick={save} disabled={saving}>
            <Heart className="mr-1 h-4 w-4" /> Save
          </Button>
          {FEATURED_SLUG_MAP[u.id] ? (
            <Button asChild size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Link to="/universities/$slug" params={{ slug: FEATURED_SLUG_MAP[u.id] }}>View <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          ) : (
            <Button asChild size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Link to="/universities/$uniId" params={{ uniId: u.id }}>View <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          )}
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
