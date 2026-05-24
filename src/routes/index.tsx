import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UNIVERSITIES, SCHOLARSHIPS, COUNTRIES, PROGRAMS, WTF_FACTS } from "@/lib/data";
import { ArrowRight, Search, Sparkles, Zap, Compass, GitCompare, Lightbulb } from "lucide-react";
import { LogoMark, CrestArt } from "@/components/Logo";

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
      <FeatureTrio />
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
    <section className="relative overflow-hidden border-b border-border">
      {/* Wallpaper of crests + soft wash */}
      <div className="absolute inset-0 -z-10" aria-hidden style={{
        background: "radial-gradient(70% 60% at 50% 0%, color-mix(in oklab, var(--color-background) 40%, transparent), var(--color-background) 80%)",
      }} />
      {/* Giant decorative crests */}
      <CrestArt variant="a" className="pointer-events-none absolute -left-16 top-10 hidden h-[26rem] w-[26rem] text-foreground/[0.06] md:block" />
      <CrestArt variant="b" className="pointer-events-none absolute -right-20 top-24 hidden h-[28rem] w-[28rem] text-foreground/[0.07] md:block" />
      <CrestArt variant="c" className="pointer-events-none absolute right-10 bottom-4 h-44 w-44 text-foreground/10" />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-32 bg-gradient-to-b from-transparent to-background" aria-hidden />

      <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-16 md:pt-24">
        {/* Big crest mark above the headline */}
        <LogoMark className="mb-6 h-14 w-14 text-foreground" />

        <div className="inline-flex items-center gap-2 border-y border-foreground/80 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-foreground">
          <Zap className="h-3 w-3" /> A field guide for Bangladeshi students · est. MMXXVI
        </div>

        <h1 className="mt-7 max-w-5xl font-heading text-[3.2rem] font-bold leading-[1] tracking-tight md:text-[6.5rem]">
          Find your <em className="font-medium not-italic italic">best deal</em>
          <br />
          <span className="text-foreground/55">abroad.</span>
        </h1>

        <div className="mt-6 flex items-center gap-4 text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
          <span>Vol. II</span>
          <span className="h-px flex-1 bg-foreground/30" />
          <span>{new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}</span>
        </div>

        <p className="mt-10 max-w-2xl text-lg leading-relaxed text-foreground/80 md:text-xl">
          10,000+ real universities. Live scholarships. An AI advisor named <em>Aria</em>.
          One honest atlas for HSC & A-level students who think consultants are overrated.
        </p>

        <div className="card-surface mt-10 p-3 md:p-4 shadow-[0_1px_0_0_var(--color-border),0_18px_40px_-24px_rgba(0,0,0,0.18)]">
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
              <Link to="/universities" search={{ country: country || undefined, program: program || undefined }}>
                <Search className="mr-2 h-4 w-4" /> Search
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeatureTrio() {
  const items = [
    {
      icon: Compass,
      kicker: "I.",
      title: "Explore",
      body: "Browse 10,000+ universities worldwide — filter by region, country, program, and tuition.",
      cta: "Open the atlas",
      to: "/universities" as const,
    },
    {
      icon: GitCompare,
      kicker: "II.",
      title: "Compare",
      body: "Stack up to 3 universities side by side — tuition, acceptance, scholarships, deadlines.",
      cta: "Start a comparison",
      to: "/compare" as const,
    },
    {
      icon: Lightbulb,
      kicker: "III.",
      title: "Tips & Hacks",
      body: "Curated admission hacks, GPA conversions, and a personalised AI advisor (Aria).",
      cta: "Ask Aria",
      to: "/ask-ai" as const,
    },
  ];
  return (
    <section className="mx-auto max-w-6xl px-4 pt-14 pb-4">
      <div className="mb-6 flex items-end justify-between">
        <h2 className="font-heading text-3xl font-bold md:text-4xl">
          One umbrella. <em className="font-medium">Three doors in.</em>
        </h2>
        <span className="hidden text-xs uppercase tracking-[0.25em] text-muted-foreground md:block">Chapters</span>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {items.map(({ icon: Icon, kicker, title, body, cta, to }) => (
          <Link
            key={title}
            to={to}
            className="card-surface group relative overflow-hidden p-7 transition-all hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-22px_rgba(0,0,0,0.18)]"
          >
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.25em] text-muted-foreground">
              <span>Chapter {kicker}</span>
              <Icon className="h-4 w-4" />
            </div>
            <h3 className="mt-6 font-heading text-3xl font-bold tracking-tight">{title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{body}</p>
            <div className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-foreground">
              {cta} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
            {/* faded corner crest */}
            <CrestArt variant="c" className="pointer-events-none absolute -bottom-10 -right-10 h-40 w-40 text-foreground/[0.05]" />
          </Link>
        ))}
      </div>
    </section>
  );
}

function Stats() {
  const stats = [
    { num: "10,200+", label: "Universities" },
    { num: "180+", label: "Scholarships" },
    { num: "120+", label: "Countries" },
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
