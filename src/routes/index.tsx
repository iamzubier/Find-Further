import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UNIVERSITIES, SCHOLARSHIPS, COUNTRIES, PROGRAMS, WTF_FACTS } from "@/lib/data";
import { ArrowRight, Search, Sparkles, Compass, GitCompare, Lightbulb, Quote, Star, GraduationCap, Globe2, Award } from "lucide-react";
import { getUniversityCount } from "@/lib/admin-import.functions";
import heroLibrary from "@/assets/hero-library.jpg";
import exploreImg from "@/assets/explore-spires.jpg";
import compareImg from "@/assets/compare-notebooks.jpg";
import tipsImg from "@/assets/tips-lamp.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BeyondBorder — The atlas for ambitious students" },
      { name: "description", content: "10,000+ universities. 180+ live scholarships. An AI advisor named Aria. The luxury field guide for studying abroad — built for students from everywhere." },
      { property: "og:title", content: "BeyondBorder — Find your university. Know your chances. Get in." },
      { property: "og:description", content: "The luxury atlas for students applying abroad — universities, scholarships, AI advisor." },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  return (
    <div className="overflow-hidden">
      <Hero />
      <CountriesMarquee />
      <FeatureTrio />
      <ScholarshipsBand />
      <WtfSection />
      <TestimonialStrip />
      <Stats />
      <CtaStrip />
    </div>
  );
}

/* ─────────────────────────── HERO ─────────────────────────── */
function Hero() {
  const [country, setCountry] = useState<string>("");
  const [program, setProgram] = useState<string>("");
  const [budget, setBudget] = useState<string>("");
  const countFn = useServerFn(getUniversityCount);
  const { data: countData } = useQuery({ queryKey: ["uni-count"], queryFn: () => countFn(), staleTime: 60_000 });
  const countLabel = countData?.count ? `${countData.count.toLocaleString()}+` : "10,000+";

  return (
    <section className="relative isolate overflow-hidden">
      {/* layered backdrop */}
      <div className="absolute inset-0 -z-10">
        <img src={heroLibrary} alt="" className="absolute inset-0 h-full w-full object-cover scale-105" />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(120deg, oklch(0.12 0.04 160 / 0.94) 0%, oklch(0.18 0.06 160 / 0.86) 45%, oklch(0.14 0.04 160 / 0.84) 100%)",
          }}
        />
        {/* drifting emerald + gold orbs */}
        <div
          aria-hidden
          className="absolute -left-32 top-10 h-[420px] w-[420px] rounded-full opacity-50 blur-3xl orb-drift"
          style={{ background: "radial-gradient(circle, oklch(0.52 0.12 160 / 0.55), transparent 70%)" }}
        />
        <div
          aria-hidden
          className="absolute -right-24 top-40 h-[520px] w-[520px] rounded-full opacity-55 blur-3xl orb-drift"
          style={{ background: "radial-gradient(circle, oklch(0.74 0.10 85 / 0.45), transparent 70%)", animationDelay: "-6s" }}
        />
        {/* conic gold light rays */}
        <div aria-hidden className="absolute inset-0 light-rays" />
        {/* film grain */}
        <div aria-hidden className="absolute inset-0 grain-overlay pointer-events-none" />
        {/* faint topographic grid */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
            backgroundSize: "64px 64px",
            maskImage: "radial-gradient(ellipse at center, black 30%, transparent 80%)",
            WebkitMaskImage: "radial-gradient(ellipse at center, black 30%, transparent 80%)",
          }}
        />
      </div>

      <div className="mx-auto max-w-7xl px-4 pt-20 pb-28 lg:px-8 lg:pt-28 lg:pb-36">
        <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_1fr]">
          {/* left — editorial copy */}
          <div className="text-white reveal-up">
            <div className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-[10px] uppercase tracking-[0.28em] text-white/85 backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-gold-grad animate-pulse" />
              Est. MMXXVI · Volume II · {new Date().toLocaleDateString("en-US", { month: "long" })}
            </div>

            <h1 className="mt-8 font-heading text-[3.4rem] font-bold leading-[0.98] tracking-tight text-white md:text-[5.5rem]">
              The atlas for
              <br />
              <span className="relative inline-block">
                <span className="gold-text italic font-medium">ambitious</span>
                <span
                  aria-hidden
                  className="absolute -bottom-2 left-0 h-[3px] w-full origin-left"
                  style={{ background: "var(--gradient-gold)", transform: "scaleX(0.7)" }}
                />
              </span>{" "}
              <span className="text-white/95">students.</span>
            </h1>

            <p className="mt-7 max-w-xl text-lg leading-relaxed text-white/80">
              {countLabel} universities. Live scholarships. An AI advisor named{" "}
              <em className="serif-italic text-white">Aria</em>. One honest, beautifully kept atlas — for students applying to the world's best.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 text-[11px] uppercase tracking-[0.24em] text-white/70">
              <span className="inline-flex items-center gap-2"><Globe2 className="h-3.5 w-3.5 text-gold" /> 120+ Countries</span>
              <span className="h-3 w-px bg-white/20" />
              <span className="inline-flex items-center gap-2"><Award className="h-3.5 w-3.5 text-gold" /> 180+ Scholarships</span>
              <span className="h-3 w-px bg-white/20" />
              <span className="inline-flex items-center gap-2"><GraduationCap className="h-3.5 w-3.5 text-gold" /> Trusted by 12k students</span>
            </div>
          </div>

          {/* right — search card */}
          <div className="relative reveal-up" style={{ animationDelay: "0.15s" }}>
            {/* slowly rotating gold ring behind the card */}
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-10 spin-slow opacity-40"
              style={{
                background:
                  "conic-gradient(from 0deg, transparent 0deg, oklch(0.74 0.10 85 / 0.55) 60deg, transparent 130deg, transparent 240deg, oklch(0.74 0.10 85 / 0.4) 300deg, transparent 360deg)",
                borderRadius: "9999px",
                filter: "blur(28px)",
              }}
            />
            <div
              aria-hidden
              className="absolute -inset-1 rounded-2xl opacity-60 blur-2xl"
              style={{ background: "var(--gradient-gold)" }}
            />
            <div className="relative corner-orn rounded-2xl border border-white/15 bg-white/95 p-6 shadow-2xl backdrop-blur-xl md:p-7">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">Begin your journey</div>
                  <h3 className="mt-1 font-heading text-xl font-bold tracking-tight">Find your match</h3>
                </div>
                <div className="hairline-shimmer w-16" />
              </div>

              <div className="space-y-2.5">
                <Select value={country} onValueChange={setCountry}>
                  <SelectTrigger className="h-12 bg-secondary/60"><SelectValue placeholder="Destination country" /></SelectTrigger>
                  <SelectContent>{COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={program} onValueChange={setProgram}>
                  <SelectTrigger className="h-12 bg-secondary/60"><SelectValue placeholder="Field of study" /></SelectTrigger>
                  <SelectContent>{PROGRAMS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={budget} onValueChange={setBudget}>
                  <SelectTrigger className="h-12 bg-secondary/60"><SelectValue placeholder="Yearly budget" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0-2k">$0 – $2,000 / yr</SelectItem>
                    <SelectItem value="2-10k">$2,000 – $10,000 / yr</SelectItem>
                    <SelectItem value="10-25k">$10,000 – $25,000 / yr</SelectItem>
                    <SelectItem value="25k+">$25,000+ / yr</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  asChild
                  className="gold-sheen mt-2 h-12 w-full text-[13px] font-semibold text-primary-foreground"
                  style={{ background: "var(--gradient-emerald)" }}
                >
                  <Link to="/universities" search={{ country: country || undefined, program: program || undefined }}>
                    <Search className="mr-2 h-4 w-4" /> Search the atlas
                  </Link>
                </Button>
                <p className="pt-1 text-center text-[11px] text-muted-foreground">
                  Or <Link to="/ask-ai" className="story-link font-medium text-primary">ask Aria</Link> to recommend universities for you
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* scroll cue */}
        <div className="mt-16 flex justify-center">
          <div className="flex h-9 w-5 items-start justify-center rounded-full border border-white/25 p-1">
            <span className="h-2 w-px animate-bounce bg-white/70" />
          </div>
        </div>
      </div>

      <div className="hairline-shimmer" />
    </section>
  );
}

/* ─────────────────── COUNTRY FLAG MARQUEE ─────────────────── */
function CountriesMarquee() {
  const items = [
    "🇺🇸 USA", "🇬🇧 United Kingdom", "🇩🇪 Germany", "🇫🇮 Finland", "🇳🇴 Norway",
    "🇸🇪 Sweden", "🇳🇱 Netherlands", "🇮🇹 Italy", "🇦🇺 Australia", "🇨🇦 Canada",
    "🇫🇷 France", "🇯🇵 Japan", "🇰🇷 South Korea", "🇨🇭 Switzerland", "🇮🇪 Ireland",
    "🇪🇸 Spain", "🇩🇰 Denmark", "🇸🇬 Singapore", "🇭🇺 Hungary", "🇦🇹 Austria",
  ];
  return (
    <section className="relative border-y border-border bg-foreground py-5 text-background overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0 opacity-40"
        style={{ background: "radial-gradient(800px 80px at 50% 50%, oklch(0.74 0.10 85 / 0.18), transparent 70%)" }}
      />
      <div className="relative flex items-center gap-4 overflow-hidden">
        <span className="shrink-0 pl-6 text-[10px] uppercase tracking-[0.32em] text-background/60">Atlas covers</span>
        <div className="hairline-gold w-12 shrink-0 opacity-60" />
        <div className="relative flex-1 overflow-hidden mask-fade-x">
          <div className="flex animate-[marquee_38s_linear_infinite] gap-10 whitespace-nowrap text-sm tracking-wide text-background/85">
            {[...items, ...items].map((c, i) => (
              <span key={i} className="inline-flex items-center gap-2">
                <span className="text-base">{c.split(" ")[0]}</span>
                <span className="font-medium">{c.substring(c.indexOf(" ") + 1)}</span>
                <span className="ml-6 h-1 w-1 rounded-full bg-gold" />
              </span>
            ))}
          </div>
        </div>
      </div>
      <style>{`@keyframes marquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }`}</style>
    </section>
  );
}

/* ─────────────────────── FEATURE TRIO ─────────────────────── */
function FeatureTrio() {
  const items = [
    {
      icon: Compass, kicker: "Chapter I", title: "Explore the world",
      body: "Browse 10,000+ universities worldwide — filter by region, country, program, and tuition with precision tools.",
      cta: "Open the atlas", to: "/universities" as const, image: exploreImg,
    },
    {
      icon: GitCompare, kicker: "Chapter II", title: "Compare side-by-side",
      body: "Stack up to three universities — tuition, acceptance rate, scholarships, deadlines. Decide with data, not vibes.",
      cta: "Start a comparison", to: "/compare" as const, image: compareImg,
    },
    {
      icon: Lightbulb, kicker: "Chapter III", title: "Tips & hacks from Aria",
      body: "Curated admission hacks, GPA conversions, real student tips — and an AI advisor that remembers your story.",
      cta: "Ask Aria anything", to: "/ask-ai" as const, image: tipsImg,
    },
  ];

  return (
    <section className="relative mx-auto max-w-7xl px-4 py-28 lg:px-8">
      {/* giant ghost serif number behind the heading */}
      <div aria-hidden className="ghost-numeral pointer-events-none absolute -top-6 right-4 select-none text-[14rem] leading-none opacity-60">
        III
      </div>

      <div className="mb-12 flex items-end justify-between gap-6">
        <div>
          <div className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">The Field Guide</div>
          <h2 className="mt-3 font-heading text-4xl font-bold tracking-tight md:text-5xl">
            One umbrella. <em className="gradient-text font-medium not-italic">Three doors in.</em>
          </h2>
        </div>
        <div className="hidden h-px flex-1 bg-border md:block" />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {items.map(({ icon: Icon, kicker, title, body, cta, to, image }, idx) => (
          <Link
            key={title}
            to={to}
            className="group relative isolate flex min-h-[480px] flex-col overflow-hidden rounded-2xl text-white shadow-[0_20px_50px_-20px_rgba(0,60,40,0.4)] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_40px_80px_-20px_rgba(0,60,40,0.6)] reveal-up"
            style={{ animationDelay: `${idx * 0.12}s` }}
          >
            <img src={image} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-1000 group-hover:scale-110" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/55 to-black/95" />
            {/* gold sweep on hover */}
            <div
              aria-hidden
              className="absolute inset-0 -translate-x-full transition-transform duration-1000 group-hover:translate-x-full"
              style={{ background: "linear-gradient(110deg, transparent 40%, oklch(0.74 0.10 85 / 0.22) 50%, transparent 60%)" }}
            />
            {/* corner ornaments */}
            <span aria-hidden className="absolute left-4 top-4 h-4 w-4 border-l border-t border-gold/70" />
            <span aria-hidden className="absolute right-4 top-4 h-4 w-4 border-r border-t border-gold/70" />
            <span aria-hidden className="absolute left-4 bottom-4 h-4 w-4 border-l border-b border-gold/70" />
            <span aria-hidden className="absolute right-4 bottom-4 h-4 w-4 border-r border-b border-gold/70" />
            <div
              aria-hidden
              className="absolute inset-x-0 bottom-0 h-[2px] opacity-90"
              style={{ background: "var(--gradient-gold)" }}
            />
            {/* roman numeral watermark */}
            <div aria-hidden className="ghost-numeral pointer-events-none absolute -bottom-4 -right-2 select-none text-[8rem] opacity-30">
              {["I","II","III"][idx]}
            </div>
            <div className="relative z-[1] flex h-full flex-col p-7">
              <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.28em] text-white/80">
                <span>{kicker}</span>
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gold/60 bg-black/30 backdrop-blur transition-transform duration-500 group-hover:rotate-12">
                  <Icon className="h-4 w-4 text-gold" />
                </span>
              </div>
              <h3 className="mt-auto pt-12 font-heading text-3xl font-bold tracking-tight">{title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-white/85">{body}</p>
              <div className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-white">
                <span className="story-link">{cta}</span>
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

/* ──────────────────── SCHOLARSHIPS BAND ──────────────────── */
function ScholarshipsBand() {
  const featured = SCHOLARSHIPS.slice(0, 6);
  return (
    <section className="relative bg-foreground py-28 text-background">
      <div
        aria-hidden
        className="absolute inset-0 opacity-30"
        style={{
          background:
            "radial-gradient(600px 400px at 15% 30%, oklch(0.52 0.12 160 / 0.5), transparent 70%), radial-gradient(500px 400px at 85% 70%, oklch(0.74 0.10 85 / 0.4), transparent 70%)",
        }}
      />
      <div className="relative mx-auto max-w-7xl px-4 lg:px-8">
        <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-[0.28em] text-gold">Live this season</div>
            <h2 className="mt-3 font-heading text-4xl font-bold tracking-tight text-background md:text-5xl">
              Scholarships, <em className="gold-text not-italic font-medium">handpicked.</em>
            </h2>
            <p className="mt-3 max-w-xl text-background/70">
              Every entry verified against official sources. Real deadlines, real money, real applicants getting in.
            </p>
          </div>
          <Button asChild variant="outline" className="self-start border-gold/40 bg-transparent text-background hover:bg-white/5">
            <Link to="/scholarships">Browse all 180+ <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {featured.map((s) => (
            <Link
              key={s.id}
              to="/scholarships"
              className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-gold/40 hover:bg-white/[0.07]"
            >
              <div className="flex items-start justify-between">
                <span className="text-3xl">{s.countryFlag}</span>
                <span
                  className="rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider"
                  style={{
                    borderColor: "oklch(0.74 0.10 85 / 0.5)",
                    color: "oklch(0.82 0.11 85)",
                  }}
                >
                  {s.type}
                </span>
              </div>
              <h3 className="mt-5 font-heading text-xl font-bold leading-tight text-background">{s.name}</h3>
              <p className="mt-2 line-clamp-2 text-sm text-background/65">{s.description}</p>
              <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4 text-xs">
                <span className="text-background/70"><span className="text-gold">●</span> {s.amount}</span>
                <span className="font-medium text-background/85 transition-transform group-hover:translate-x-0.5">
                  Apply →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────── WTF SECTION ─────────────────────── */
function WtfSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-28 lg:px-8">
      <div className="mb-12">
        <div className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">The plot twists</div>
        <h2 className="mt-3 font-heading text-4xl font-extrabold md:text-5xl">
          Wait… you didn't know this? <span className="inline-block translate-y-1">🤯</span>
        </h2>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Six countries. Six unexpected truths most international students assume aren't possible. They are.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {WTF_FACTS.map((f, i) => (
          <Link
            key={f.country}
            to="/universities"
            search={{ country: f.filter.country }}
            className="group relative isolate flex min-h-[280px] flex-col overflow-hidden rounded-2xl text-white shadow-md transition-all hover:-translate-y-1 hover:shadow-2xl"
          >
            <img src={f.image} alt={f.country} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-1000 group-hover:scale-110" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/55 to-black/95" />
            <div className="absolute left-5 top-5 z-[1] inline-flex items-center gap-3 rounded-full border border-white/20 bg-black/30 px-3 py-1.5 backdrop-blur">
              <span className="text-2xl leading-none">{f.flag}</span>
              <span className="text-xs font-medium tracking-wide text-white">{f.country}</span>
            </div>
            <div className="absolute right-5 top-5 z-[1] rounded-full bg-gold-grad px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-foreground">
              {f.tag}
            </div>
            <div className="relative z-[1] mt-auto p-6">
              <div className="font-heading text-[10px] uppercase tracking-[0.32em] text-gold">No. {String(i + 1).padStart(2, "0")}</div>
              <p className="mt-2 font-heading text-xl font-extrabold leading-snug md:text-2xl">
                "{f.fact}"
              </p>
              <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-white/90">
                <span className="story-link">Show me these universities</span>
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

/* ───────────────────── TESTIMONIAL STRIP ───────────────────── */
function TestimonialStrip() {
  const quotes = [
    { name: "Tahmid R.", got: "MIT '29 · Full Aid", body: "Aria nailed my fit. The financial-aid math alone was worth it — saved me from applying to schools that don't fund internationals." },
    { name: "Sofia M.", got: "TU Munich · €0/sem", body: "I had no idea Germany was actually free for non-EU. The atlas surfaced 14 universities I'd never heard of." },
    { name: "Amara K.", got: "Chevening Scholar", body: "The tips section is real — not the AI-slop you get elsewhere. Reddit-style honesty with editorial polish." },
  ];
  return (
    <section className="bg-secondary py-24">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="mb-12 flex items-end justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">From the journals</div>
            <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight md:text-4xl">
              What students <em className="gradient-text not-italic font-medium">tell us.</em>
            </h2>
          </div>
          <div className="hidden items-center gap-1 md:flex">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="h-4 w-4 fill-gold text-gold" />
            ))}
            <span className="ml-2 text-sm text-muted-foreground">4.9 · 1,200+ reviews</span>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {quotes.map((q) => (
            <figure key={q.name} className="luxe-card relative p-7">
              <Quote className="absolute right-5 top-5 h-8 w-8 text-gold/30" />
              <blockquote className="font-heading text-lg italic leading-relaxed text-foreground">
                "{q.body}"
              </blockquote>
              <figcaption className="mt-6 border-t border-border pt-4">
                <div className="font-semibold text-foreground">{q.name}</div>
                <div className="mt-0.5 text-xs uppercase tracking-wider text-gold">{q.got}</div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────── STATS ──────────────────────────── */
function Stats() {
  const stats = [
    { num: "10,200+", label: "Universities indexed" },
    { num: "180+", label: "Live scholarships" },
    { num: "120+", label: "Countries covered" },
    { num: "12k+", label: "Students guided" },
  ];
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 lg:px-8">
      <div
        className="relative overflow-hidden rounded-2xl border border-border p-10 md:p-14"
        style={{ background: "var(--gradient-hero)" }}
      >
        <div
          aria-hidden
          className="absolute inset-0 opacity-50"
          style={{
            background:
              "radial-gradient(500px 300px at 90% 0%, oklch(0.74 0.10 85 / 0.4), transparent 70%)",
          }}
        />
        <div className="relative grid gap-8 md:grid-cols-4">
          {stats.map((s, i) => (
            <div key={s.label} className={`text-white ${i > 0 ? "md:border-l md:border-white/10 md:pl-8" : ""}`}>
              <div className="gold-text font-heading text-5xl font-extrabold tracking-tight md:text-6xl">{s.num}</div>
              <div className="mt-2 text-xs uppercase tracking-[0.22em] text-white/70">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────── CTA ─────────────────────────── */
function CtaStrip() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-24 lg:px-8">
      <div className="luxe-card relative overflow-hidden p-10 md:p-14">
        <div
          aria-hidden
          className="absolute -right-20 -top-20 h-64 w-64 rounded-full opacity-20"
          style={{ background: "var(--gradient-gold)" }}
        />
        <div className="relative flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div className="max-w-xl">
            <div className="text-[10px] uppercase tracking-[0.28em] text-gold">The final page</div>
            <h3 className="mt-3 font-heading text-3xl font-bold text-foreground md:text-4xl">
              See your <em className="gradient-text not-italic font-medium">best matches</em> in 60 seconds.
            </h3>
            <p className="mt-3 text-base text-muted-foreground">
              Free account. Profile-aware recommendations. An AI advisor named Aria — she remembers everything.
            </p>
          </div>
          <Button
            asChild size="lg"
            className="gold-sheen text-primary-foreground"
            style={{ background: "var(--gradient-emerald)" }}
          >
            <Link to="/auth" search={{ tab: "signup" }}>
              Create a free account <Sparkles className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
        <p className="mt-8 border-t border-border pt-5 text-center text-xs text-muted-foreground">
          {UNIVERSITIES.length} sample universities · {SCHOLARSHIPS.length} live scholarships · updated {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </p>
      </div>
    </section>
  );
}
