import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Search, Heart, ArrowRight } from "lucide-react";
import { UNIVERSITIES, COUNTRIES, PROGRAMS, type University } from "@/lib/data";
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
    { name: "description", content: "Browse universities abroad with tuition, scholarships, and deadlines tailored for BD students." },
  ]}),
  component: UniversitiesPage,
});

function UniversitiesPage() {
  const search = Route.useSearch();
  const [q, setQ] = useState(search.q ?? "");
  const [country, setCountry] = useState(search.country ?? "all");
  const [program, setProgram] = useState(search.program ?? "all");
  const [sort, setSort] = useState<"rank" | "name">("rank");
  const [scholarshipOnly, setScholarshipOnly] = useState(false);

  const results = useMemo(() => {
    let list = UNIVERSITIES.filter((u) => {
      if (country !== "all" && u.country !== country) return false;
      if (program !== "all" && !u.programs.includes(program)) return false;
      if (scholarshipOnly && !["Tuition Free","Full Scholarship","Need-blind Aid","Stipend Available"].includes(u.dealTag)) return false;
      if (q && !(u.name.toLowerCase().includes(q.toLowerCase()) || u.country.toLowerCase().includes(q.toLowerCase()))) return false;
      return true;
    });
    list.sort((a, b) => sort === "rank" ? a.qsRank - b.qsRank : a.name.localeCompare(b.name));
    return list;
  }, [q, country, program, sort, scholarshipOnly]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-heading text-4xl font-extrabold md:text-5xl">Universities</h1>
          <p className="mt-1 text-sm text-muted-foreground">{results.length} matches</p>
        </div>
      </div>

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
        <Select value={sort} onValueChange={(v) => setSort(v as "rank"|"name")}>
          <SelectTrigger className="h-11 bg-secondary"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="rank">Sort: QS Rank</SelectItem>
            <SelectItem value="name">Sort: Name</SelectItem>
          </SelectContent>
        </Select>
        <label className="flex items-center gap-2 px-3 text-sm text-muted-foreground">
          <Switch checked={scholarshipOnly} onCheckedChange={setScholarshipOnly} /> Scholarship only
        </label>
      </div>

      {results.length === 0 ? (
        <div className="card-surface mt-10 p-12 text-center">
          <p className="font-heading text-xl text-foreground">No matches. Loosen the filters.</p>
          <p className="mt-1 text-sm text-muted-foreground">Try removing program or country, or turn off "Scholarship only".</p>
        </div>
      ) : (
        <div className="mt-6 grid gap-3">
          {results.map((u) => <UniversityCard key={u.id} u={u} />)}
        </div>
      )}

      <LoginNudge text="Want to see which match YOUR profile?" />
    </div>
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
          <Button asChild size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Link to="/universities/$uniId" params={{ uniId: u.id }}>View <ArrowRight className="ml-1 h-4 w-4" /></Link>
          </Button>

        </div>
      </div>
    </div>
  );
}

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
