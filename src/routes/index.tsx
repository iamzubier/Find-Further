import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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
      { title: "FindFurther — The atlas for ambitious students" },
      { name: "description", content: "10,000+ universities. 180+ live scholarships. An AI advisor named Aria. The luxury field guide for studying abroad — built for students from everywhere." },
      { property: "og:title", content: "FindFurther — Find your university. Know your chances. Get in." },
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

/* ─────────────────────────── HERO (Bento Archive Registry) ─────────────────────────── */
function Hero() {
  const countFn = useServerFn(getUniversityCount);
  const { data: countData } = useQuery({ queryKey: ["uni-count"], queryFn: () => countFn(), staleTime: 60_000 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const countLabel = mounted && countData?.count ? `${countData.count.toLocaleString()}+` : "10,000+";
  const featuredSch = SCHOLARSHIPS.slice(0, 3);

  return (
    <section className="relative bg-background py-10 lg:py-16">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-12 md:auto-rows-[minmax(180px,auto)]">

          {/* Brand & Hero — Deep Emerald with library backdrop */}
          <div className="md:col-span-8 md:row-span-2 relative overflow-hidden border-b-4 border-gold p-8 md:p-12 flex flex-col justify-between text-[#f5f0e0] min-h-[460px]">
            <img src={heroLibrary} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <div aria-hidden className="absolute inset-0" style={{ background: "linear-gradient(120deg, rgba(101,31,43,.94) 0%, rgba(101,31,43,.82) 50%, rgba(67,21,29,.95) 100%)" }} />
            <div aria-hidden className="absolute inset-0 grain-overlay pointer-events-none" />
            <div className="relative z-10">
              <span className="font-heading italic text-gold text-lg md:text-xl mb-3 block">FindFurther</span>
              <h1 className="font-heading text-4xl md:text-6xl lg:text-7xl leading-[1.05] max-w-2xl text-[#f5f0e0] drop-shadow-[0_2px_24px_rgba(0,0,0,0.4)]">
                The Global <em className="not-italic" style={{ fontStyle: "italic" }}>Academic</em> Archive.
              </h1>
            </div>
            <div className="relative z-10 mt-10">
              <p className="max-w-md leading-relaxed text-[#f5f0e0]/85 text-base md:text-lg">
                A curated registry of premier universities and prestigious scholarship opportunities — for the modern scholar applying abroad.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Button asChild className="rounded-none bg-[#f5f0e0]! px-7 py-6 font-semibold uppercase tracking-[0.2em] text-xs text-[#651F2B]! hover:bg-gold!">
                  <Link to="/universities">Begin Inquiry</Link>
                </Button>
                <Button asChild className="rounded-none border border-[#C9A24A] bg-transparent! px-7 py-6 font-semibold uppercase tracking-[0.2em] text-xs text-[#f5f0e0]! hover:bg-[#C9A24A]! hover:text-[#651F2B]!">
                  <Link to="/scholarships">View Catalog</Link>
                </Button>
              </div>
            </div>
            {/* corner compass */}
            <div aria-hidden className="absolute -bottom-16 -right-16 opacity-20 pointer-events-none z-[1]">
              <svg width="320" height="320" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.4">
                <circle cx="50" cy="50" r="45" />
                <circle cx="50" cy="50" r="35" />
                <circle cx="50" cy="50" r="25" />
                <path d="M50 5 L50 95 M5 50 L95 50 M22 22 L78 78 M78 22 L22 78" />
              </svg>
            </div>
          </div>

          {/* Registry — vertical list */}
          <div className="md:col-span-4 md:row-span-3 bg-card p-7 md:p-8 border border-gold/30 flex flex-col">
            <div className="border-b border-gold pb-4 mb-6 flex justify-between items-end">
              <h3 className="font-heading text-2xl text-foreground">Registry</h3>
              <span className="text-[10px] uppercase tracking-[0.18em] text-gold font-semibold">Active Grants</span>
            </div>
            <div className="space-y-7 flex-1">
              {featuredSch.map((s, i) => (
                <Link key={s.id} to="/scholarships" className="group block">
                  <span className="text-gold text-[11px] font-bold font-heading tracking-wider mb-1 block">
                    {String(i + 1).padStart(2, "0")} / {(s.country || s.countryFlag).toUpperCase()}
                  </span>
                  <h4 className="font-heading text-lg leading-snug text-foreground group-hover:text-primary-glow transition-colors">{s.name}</h4>
                  <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">{s.description}</p>
                </Link>
              ))}
            </div>
            <Link to="/scholarships" className="mt-7 text-[11px] font-bold uppercase tracking-[0.2em] text-foreground border-b border-foreground self-start py-1 hover:text-gold hover:border-gold transition-colors inline-flex items-center gap-2">
              View All Archives <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {/* Search — Emerald glow */}
          <div className="md:col-span-5 p-7 md:p-8 flex flex-col justify-center text-[#f5f0e0]" style={{ background: "#651F2B" }}>
            <label className="text-[10px] uppercase tracking-[0.22em] mb-4 text-gold font-bold">Discovery Tool</label>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const v = (e.currentTarget.elements.namedItem("q") as HTMLInputElement)?.value;
                if (v) window.location.href = `/universities?q=${encodeURIComponent(v)}`;
              }}
              className="relative"
            >
              <input
                name="q"
                type="text"
                placeholder="Search regions, disciplines, institutions..."
                className="w-full bg-transparent border-b border-gold py-4 pr-10 focus:outline-none placeholder:text-[#f5f0e0]/45 font-heading italic text-lg md:text-xl text-[#f5f0e0]"
              />
              <button type="submit" className="absolute right-0 top-1/2 -translate-y-1/2 text-gold hover:text-[#f5f0e0] transition-colors">
                <Search className="h-6 w-6" />
              </button>
            </form>
            <div className="mt-4 flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.18em] text-[#f5f0e0]/70">
              <Link to="/universities" search={{ country: "United Kingdom" }} className="border border-gold/40 px-2.5 py-1 hover:bg-gold hover:text-foreground transition-colors">UK</Link>
              <Link to="/universities" search={{ country: "Germany" }} className="border border-gold/40 px-2.5 py-1 hover:bg-gold hover:text-foreground transition-colors">Germany</Link>
              <Link to="/universities" search={{ country: "United States" }} className="border border-gold/40 px-2.5 py-1 hover:bg-gold hover:text-foreground transition-colors">USA</Link>
              <Link to="/ask-ai" className="border border-gold/40 px-2.5 py-1 hover:bg-gold hover:text-foreground transition-colors">Ask Aria</Link>
            </div>
          </div>

          {/* Stat — Institutions */}
          <div className="md:col-span-3 bg-card border border-gold/30 p-7 flex flex-col justify-center items-center text-center">
            <span className="text-4xl md:text-5xl font-heading text-primary">{countLabel}</span>
            <span className="text-[10px] uppercase tracking-[0.2em] mt-3 text-gold font-bold">Institutions Cataloged</span>
            <div className="mt-4 h-px w-10 bg-gold/60" />
          </div>

          {/* Spotlight Institution — with campus photo */}
          <div className="md:col-span-8 relative overflow-hidden border border-gold/30 group min-h-[260px] flex">
            <div className="relative w-1/2 overflow-hidden hidden md:block">
              <img src={UNIVERSITIES[0]?.campusImageUrl ?? exploreImg} alt={UNIVERSITIES[0]?.name ?? ""} className="absolute inset-0 h-full w-full object-cover transition-transform duration-1000 group-hover:scale-105" />
              <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-transparent to-[oklch(0.995_0.004_95)]" />
            </div>
            <div className="flex-1 bg-card p-8 md:p-10 flex flex-col justify-center">
              <label className="text-[10px] uppercase tracking-[0.2em] text-gold font-bold block mb-3">Spotlight Institution</label>
              <h3 className="font-heading text-2xl md:text-3xl mb-3 text-foreground">{UNIVERSITIES[0]?.name ?? "Sorbonne Université"}</h3>
              <p className="text-muted-foreground text-sm font-heading italic">
                {UNIVERSITIES[0]?.country ?? "France"} — Heritage Member · QS #{UNIVERSITIES[0]?.qsRank ?? "—"}
              </p>
              <Link to="/universities" className="mt-5 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-foreground border-b border-foreground pb-1 hover:text-gold hover:border-gold transition-colors self-start">
                Explore Dossier <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>

          {/* Closing maxim — lamp backdrop */}
          <div className="md:col-span-4 relative overflow-hidden p-8 flex flex-col justify-center border-l-4 border-gold text-[#f5f0e0] min-h-[260px]">
            <img src={tipsImg} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <div aria-hidden className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(101,31,43,.94) 0%, rgba(67,21,29,.94) 100%)" }} />
            <p className="relative font-heading italic text-base md:text-lg leading-snug text-[#f5f0e0]">
              "The beautiful thing about learning is that no one can take it away from you."
            </p>
            <span className="relative text-gold text-[10px] uppercase tracking-[0.2em] mt-4 font-bold">— The Atlas Codex</span>
          </div>

        </div>

        {/* Lower nav strip */}
        <div className="mt-6 flex flex-col md:flex-row items-center justify-between py-4 border-t border-gold/30 gap-3">
          <span className="text-[10px] uppercase tracking-[0.24em] font-bold text-foreground/60">
            Official Registry • Est. MMXXVI • Vol. II
          </span>
          <div className="flex gap-7 text-[10px] uppercase tracking-[0.24em] font-bold">
            <Link to="/universities" className="hover:text-gold transition-colors">Universities</Link>
            <Link to="/scholarships" className="hover:text-gold transition-colors">Scholarships</Link>
            <Link to="/compare" className="hover:text-gold transition-colors">Compare</Link>
            <Link to="/ask-ai" className="hover:text-gold transition-colors">Aria</Link>
          </div>
        </div>
      </div>
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
        {/* drifting gold orbs */}
        <div
          aria-hidden
          className="absolute -right-32 -top-32 h-[460px] w-[460px] rounded-full opacity-50 blur-3xl orb-drift"
          style={{ background: "radial-gradient(circle, oklch(0.74 0.10 85 / 0.5), transparent 70%)" }}
        />
        <div
          aria-hidden
          className="absolute -left-24 -bottom-24 h-[380px] w-[380px] rounded-full opacity-40 blur-3xl orb-drift"
          style={{ background: "radial-gradient(circle, oklch(0.52 0.12 160 / 0.55), transparent 70%)", animationDelay: "-7s" }}
        />
        <div aria-hidden className="absolute inset-0 grain-overlay pointer-events-none" />
        {/* hairline grid */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
            backgroundSize: "80px 80px",
          }}
        />

        <div className="relative grid gap-10 md:grid-cols-4">
          {stats.map((s, i) => (
            <div key={s.label} className={`text-white relative ${i > 0 ? "md:border-l md:border-white/10 md:pl-8" : ""}`}>
              <div className="gold-text font-heading text-5xl font-extrabold tracking-tight md:text-6xl">{s.num}</div>
              <div className="mt-2 text-xs uppercase tracking-[0.22em] text-white/70">{s.label}</div>
              <div className="mt-4 h-px w-12 bg-gold/60" />
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
      <div className="luxe-card corner-orn relative overflow-hidden p-10 md:p-14">
        {/* ghost serif numeral */}
        <div aria-hidden className="ghost-numeral pointer-events-none absolute -bottom-10 right-6 select-none text-[16rem] opacity-50">
          ∞
        </div>
        <div
          aria-hidden
          className="absolute -right-20 -top-20 h-64 w-64 rounded-full opacity-25 blur-2xl orb-drift"
          style={{ background: "var(--gradient-gold)" }}
        />
        <div
          aria-hidden
          className="absolute -left-16 -bottom-16 h-56 w-56 rounded-full opacity-20 blur-3xl orb-drift"
          style={{ background: "var(--gradient-emerald)", animationDelay: "-5s" }}
        />
        <div className="hairline-shimmer absolute inset-x-10 top-6" />
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
            className="gold-sheen text-primary-foreground shadow-[0_10px_30px_-10px_rgba(0,60,40,0.55)] transition-transform hover:scale-[1.03]"
            style={{ background: "var(--gradient-emerald)" }}
          >
            <Link to="/auth" search={{ tab: "signup" }}>
              Create a free account <Sparkles className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
        <p className="relative mt-8 border-t border-border pt-5 text-center text-xs text-muted-foreground">
          {UNIVERSITIES.length} sample universities · {SCHOLARSHIPS.length} live scholarships · updated October 2026
        </p>
      </div>
    </section>
  );
}
