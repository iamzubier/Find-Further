import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UNIVERSITIES, SCHOLARSHIPS, COUNTRIES, PROGRAMS, WTF_FACTS } from "@/lib/data";
import { ArrowRight, Search, Sparkles, Zap } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BeyondBorder — Find your best deal abroad" },
      { name: "description", content: "Hidden tuition-free unis, scholarships, AI advisor — for Bangladeshi students who think consultants are overrated." },
      { property: "og:title", content: "BeyondBorder — Find your best deal abroad" },
      { property: "og:description", content: "Hidden tuition-free unis, scholarships, AI advisor for Bangladeshi students." },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  return (
    <div>
      <Hero />
      <Stats />
      <WtfSection />
      <CtaStrip />
    </div>
  );
}

function Hero() {
  const [country, setCountry] = useState<string>("");
  const [program, setProgram] = useState<string>("");
  const [budget, setBudget] = useState<string>("");

  return (
    <section className="relative overflow-hidden">
      <div
        className="absolute inset-0 -z-10 opacity-50"
        style={{
          background:
            "radial-gradient(60% 50% at 20% 0%, color-mix(in oklab, var(--color-primary) 18%, transparent), transparent 70%), radial-gradient(40% 40% at 90% 10%, color-mix(in oklab, var(--color-primary) 12%, transparent), transparent 70%)",
        }}
      />
      <div className="mx-auto max-w-6xl px-4 pb-12 pt-16 md:pt-24">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
          <Zap className="h-3 w-3 text-primary" /> Built in 🇧🇩 for HSC & A-level students
        </div>
        <h1 className="mt-5 max-w-4xl font-heading text-5xl font-extrabold leading-[1.05] tracking-tight md:text-7xl">
          Find your <span className="text-primary text-glow">best deal</span> abroad.
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-muted-foreground md:text-xl">
          Built for BD students who think consultants are overrated. Real universities, real scholarships, zero salesy nonsense.
        </p>

        <div className="card-surface mt-10 p-3 md:p-4">
          <div className="grid gap-2 md:grid-cols-[1fr_1fr_1fr_auto]">
            <Select value={country} onValueChange={setCountry}>
              <SelectTrigger className="h-12 bg-secondary"><SelectValue placeholder="Country" /></SelectTrigger>
              <SelectContent>{COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={program} onValueChange={setProgram}>
              <SelectTrigger className="h-12 bg-secondary"><SelectValue placeholder="Program" /></SelectTrigger>
              <SelectContent>{PROGRAMS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={budget} onValueChange={setBudget}>
              <SelectTrigger className="h-12 bg-secondary"><SelectValue placeholder="Budget" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="0-2k">$0 – $2,000 / yr</SelectItem>
                <SelectItem value="2-10k">$2,000 – $10,000 / yr</SelectItem>
                <SelectItem value="10-25k">$10,000 – $25,000 / yr</SelectItem>
                <SelectItem value="25k+">$25,000+ / yr</SelectItem>
              </SelectContent>
            </Select>
            <Button asChild className="h-12 bg-primary px-6 text-primary-foreground hover:bg-primary/90">
              <Link
                to="/universities"
                search={{ country: country || undefined, program: program || undefined }}
              >
                <Search className="mr-2 h-4 w-4" /> Search
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function Stats() {
  const stats = [
    { num: "4,200+", label: "Universities" },
    { num: "180+", label: "Scholarships" },
    { num: "28", label: "Countries" },
  ];
  return (
    <section className="mx-auto max-w-6xl px-4 py-6">
      <div className="grid gap-3 md:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="card-surface flex items-baseline justify-between p-6">
            <div className="font-heading text-4xl font-extrabold text-foreground md:text-5xl">{s.num}</div>
            <div className="text-sm uppercase tracking-wide text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function WtfSection() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % WTF_FACTS.length), 3500);
    return () => clearInterval(t);
  }, []);
  const f = WTF_FACTS[idx];

  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h2 className="font-heading text-3xl font-extrabold md:text-5xl">
            Wait… you didn't know this? <span>🤯</span>
          </h2>
          <p className="mt-2 text-muted-foreground">Shocking facts BD students assume aren't possible.</p>
        </div>
        <div className="hidden gap-1 md:flex">
          {WTF_FACTS.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className={`h-1.5 w-6 rounded-full transition-colors ${i === idx ? "bg-primary" : "bg-border"}`}
              aria-label={`Card ${i + 1}`}
            />
          ))}
        </div>
      </div>

      <div className="card-surface relative overflow-hidden p-8 md:p-12">
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{ background: "radial-gradient(60% 80% at 80% 20%, color-mix(in oklab, var(--color-primary) 20%, transparent), transparent 70%)" }}
        />
        <div key={idx} className="relative animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="flex items-center gap-3">
            <span className="text-6xl md:text-7xl">{f.flag}</span>
            <div>
              <div className="text-sm uppercase tracking-wide text-muted-foreground">{f.country}</div>
              <span className="mt-1 inline-block rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary ring-1 ring-primary/30">
                {f.tag}
              </span>
            </div>
          </div>
          <p className="mt-6 max-w-3xl font-heading text-2xl font-extrabold leading-tight md:text-4xl">
            "{f.fact}"
          </p>
          <div className="mt-6">
            <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Link to="/universities" search={{ country: f.filter.country }}>
                Show me these universities <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function CtaStrip() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      <div className="card-surface flex flex-col items-center justify-between gap-4 p-8 md:flex-row md:p-10">
        <div>
          <h3 className="font-heading text-2xl font-extrabold md:text-3xl">Want to see your best matches?</h3>
          <p className="mt-1 text-muted-foreground">Free account. Profile-aware recommendations. AI advisor named Aria.</p>
        </div>
        <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Link to="/auth" search={{ tab: "signup" }}>
            Create a free account <Sparkles className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
      <p className="mt-6 text-center text-xs text-muted-foreground">
        {UNIVERSITIES.length} universities · {SCHOLARSHIPS.length} live scholarships indexed
      </p>
    </section>
  );
}
