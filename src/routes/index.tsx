import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UNIVERSITIES, SCHOLARSHIPS, COUNTRIES, PROGRAMS, WTF_FACTS } from "@/lib/data";
import { ArrowRight, Search, Sparkles, Zap, Compass, GitCompare, Lightbulb } from "lucide-react";
import { LogoMark, CrestArt } from "@/components/Logo";
import { getUniversityCount } from "@/lib/admin-import.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BeyondBorder — Find your university. Know your chances. Get in." },
      { name: "description", content: "Find your path to the world's best universities. Live tuition, scholarships, an AI advisor, and real student tips — for students worldwide." },
      { property: "og:title", content: "BeyondBorder — Find your university. Know your chances. Get in." },
      { property: "og:description", content: "Find your path to the world's best universities. For students worldwide." },
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
  const countFn = useServerFn(getUniversityCount);
  const { data: countData } = useQuery({ queryKey: ["uni-count"], queryFn: () => countFn(), staleTime: 60_000 });
  const countLabel = countData?.count ? `${countData.count.toLocaleString()}+` : "10,000+";

  return (
    <section className="relative overflow-hidden border-b border-border">
      {/* Campus photo background */}
      <div
        className="absolute inset-0 -z-10 bg-cover bg-center"
        aria-hidden
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1600&q=80')" }}
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/70 via-black/55 to-black/85" aria-hidden />
      <CrestArt variant="c" className="pointer-events-none absolute right-10 bottom-4 h-44 w-44 text-white/10" />

      <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-16 md:pt-24">
        <LogoMark className="mb-6 h-14 w-14 text-white" />

        <div className="inline-flex items-center gap-2 border-y border-white/80 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-white">
          <Zap className="h-3 w-3" /> A field guide for students worldwide · est. MMXXVI
        </div>

        <h1 className="mt-7 max-w-5xl font-heading text-[3.2rem] font-bold leading-[1] tracking-tight text-white md:text-[6.5rem]">
          Find your <em className="font-medium not-italic italic">university.</em>
          <br />
          <span className="text-white/70">Know your chances. Get in.</span>
        </h1>

        <div className="mt-6 flex items-center gap-4 text-[11px] uppercase tracking-[0.25em] text-white/70">
          <span>Vol. II</span>
          <span className="h-px flex-1 bg-white/30" />
          <span>{new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}</span>
        </div>

        <p className="mt-10 max-w-2xl text-lg leading-relaxed text-white/85 md:text-xl">
          {countLabel} real universities. Live scholarships. An AI advisor named <em>Aria</em>.
          One honest atlas for students applying to the world's best universities.
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
      image: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1200&q=80",
    },
    {
      icon: GitCompare,
      kicker: "II.",
      title: "Compare",
      body: "Stack up to 3 universities side by side — tuition, acceptance, scholarships, deadlines.",
      cta: "Start a comparison",
      to: "/compare" as const,
      image: "https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?w=1200&q=80",
    },
    {
      icon: Lightbulb,
      kicker: "III.",
      title: "Tips & Hacks",
      body: "Curated admission hacks, GPA conversions, and a personalised AI advisor (Aria).",
      cta: "Ask Aria",
      to: "/ask-ai" as const,
      image: "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=1200&q=80",
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
        {items.map(({ icon: Icon, kicker, title, body, cta, to, image }) => (
          <Link
            key={title}
            to={to}
            className="group relative min-h-[280px] overflow-hidden rounded-2xl border border-border bg-cover bg-center text-white shadow-md transition-all hover:-translate-y-0.5 hover:shadow-2xl"
            style={{ backgroundImage: `url('${image}')` }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/65 to-black/90" aria-hidden />
            <div className="relative z-[1] flex h-full min-h-[280px] flex-col p-7">
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.25em] text-white/70">
                <span>Chapter {kicker}</span>
                <Icon className="h-4 w-4" />
              </div>
              <h3 className="mt-auto pt-10 font-heading text-3xl font-bold tracking-tight">{title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-white/85">{body}</p>
              <div className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-white">
                {cta} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
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
  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      <div className="mb-8">
        <h2 className="font-heading text-3xl font-extrabold md:text-5xl">
          Wait… you didn't know this? <span>🤯</span>
        </h2>
        <p className="mt-2 text-muted-foreground">Shocking facts most international students assume aren't possible.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {WTF_FACTS.map((f) => (
          <Link
            key={f.country}
            to="/universities"
            search={{ country: f.filter.country }}
            className="group relative min-h-[240px] overflow-hidden rounded-2xl border border-border bg-cover bg-center text-white shadow-md transition-all hover:-translate-y-0.5 hover:shadow-2xl"
            style={{ backgroundImage: `url('${f.image}')` }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/60 to-black/90" aria-hidden />
            <div className="relative z-[1] flex h-full min-h-[240px] flex-col p-5">
              <div className="flex items-center gap-2">
                <span className="text-3xl">{f.flag}</span>
                <div>
                  <div className="text-xs uppercase tracking-wide text-white/80">{f.country}</div>
                  <span className="mt-0.5 inline-block rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-semibold backdrop-blur">{f.tag}</span>
                </div>
              </div>
              <p className="mt-auto pt-6 font-heading text-lg font-extrabold leading-tight md:text-xl">
                "{f.fact}"
              </p>
              <div className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-white/90">
                Show me these <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </Link>
        ))}
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
