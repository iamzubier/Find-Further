import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, AlertTriangle, ChevronDown, Heart, ExternalLink } from "lucide-react";
import { SCHOLARSHIPS, daysLeft, type Scholarship } from "@/lib/data";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LoginNudge } from "./universities.index";

export const Route = createFileRoute("/scholarships")({
  head: () => ({ meta: [
    { title: "Scholarships — BeyondBorder" },
    { name: "description", content: "Live international scholarships sorted by deadline. For students worldwide." },
  ]}),
  component: ScholarshipsPage,
});

function ScholarshipsPage() {
  const [q, setQ] = useState("");
  const [country, setCountry] = useState<string>("all");
  const [type, setType] = useState<string>("all");

  const sorted = useMemo(() => {
    return [...SCHOLARSHIPS].sort((a, b) => +new Date(a.deadline) - +new Date(b.deadline));
  }, []);

  const filtered = useMemo(() => {
    return sorted.filter((s) => {
      if (country !== "all" && s.country !== country) return false;
      if (type !== "all" && s.type !== type) return false;
      if (q && !s.name.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [sorted, country, type, q]);

  const closingSoon = filtered.filter((s) => daysLeft(s.deadline) <= 30 && daysLeft(s.deadline) >= 0);
  const countries = Array.from(new Set(SCHOLARSHIPS.map((s) => s.country)));

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-heading text-4xl font-extrabold md:text-5xl">Scholarships</h1>
      <p className="mt-1 text-sm text-muted-foreground">{filtered.length} live · sorted by deadline</p>

      {closingSoon.length > 0 && (
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-destructive/40 bg-destructive/10 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 text-destructive" />
          <div>
            <div className="font-heading font-bold text-destructive">{closingSoon.length} scholarship{closingSoon.length>1?"s":""} closing within 30 days</div>
            <div className="text-sm text-foreground/80">Don't sleep on these. Expand each card for details.</div>
          </div>
        </div>
      )}

      <div className="card-surface mt-6 grid gap-2 p-3 md:grid-cols-[1fr_200px_180px]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search scholarships…" className="h-11 bg-secondary pl-9" />
        </div>
        <Select value={country} onValueChange={setCountry}>
          <SelectTrigger className="h-11 bg-secondary"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">All countries</SelectItem>{countries.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="h-11 bg-secondary"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="Full">Full</SelectItem>
            <SelectItem value="Partial">Partial</SelectItem>
            <SelectItem value="Stipend">Stipend</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="mt-6 grid gap-3">
        {filtered.map((s) => <ScholarshipCard key={s.id} s={s} />)}
      </div>

      <LoginNudge text="Which of these are you actually eligible for?" />
    </div>
  );
}

export function ScholarshipCard({ s }: { s: Scholarship }) {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const d = daysLeft(s.deadline);
  const badgeColor =
    d < 0 ? "bg-muted text-muted-foreground" :
    d <= 10 ? "bg-destructive/20 text-destructive ring-1 ring-destructive/40" :
    d <= 30 ? "bg-warning/20 text-warning ring-1 ring-warning/40" :
    "bg-secondary text-muted-foreground";

  const save = async () => {
    if (!user) { toast.error("Log in to save scholarships"); return; }
    const { error } = await supabase.from("shortlist").insert({
      user_id: user.id, item_type: "scholarship", item_id: s.id, item_name: s.name, item_data: s as any,
    });
    if (error) toast.error(error.code === "23505" ? "Already saved" : error.message);
    else toast.success(`Saved ${s.name}`);
  };

  return (
    <div className="card-surface overflow-hidden">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between p-5 text-left md:p-6">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{s.countryFlag}</span>
          <div>
            <h3 className="font-heading text-lg font-extrabold">{s.name}</h3>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>{s.country}</span><span>·</span>
              <span className="rounded-full bg-secondary px-2 py-0.5">{s.type}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeColor}`}>
            {d < 0 ? "Closed" : `${d} days left`}
          </span>
          <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
        </div>
      </button>

      {open && (
        <div className="border-t border-border bg-background/30 p-5 md:p-6 animate-in fade-in slide-in-from-top-1">
          <p className="text-sm text-foreground/85">{s.description}</p>
          <div className="mt-4 grid gap-3 text-sm md:grid-cols-4">
            <Stat label="Amount" value={s.amount} />
            <Stat label="Type" value={s.type} />
            <Stat label="Min GPA (BD)" value={s.minGpa ? `${s.minGpa.toFixed(1)} / 5.0` : "—"} />
            <Stat label="Deadline" value={new Date(s.deadline).toLocaleDateString()} />
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              Apply now <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={save}><Heart className="mr-2 h-4 w-4" /> Save</Button>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-0.5 font-semibold text-foreground">{value}</div>
    </div>
  );
}
