import { useEffect, useMemo, useState } from "react";
import { Check, Info, ListChecks, AlertTriangle, PartyPopper } from "lucide-react";

type DocItem = string | { title: string; context?: string | null; note?: string | null };

type Props = {
  slug: string;
  docs: DocItem[];
};

const STORAGE_PREFIX = "bb_docs_status_";
const REGION_KEY = "bb_docs_region";
const SOUTH_ASIA = new Set(["Bangladesh", "India", "Pakistan"]);
const REGIONS = [
  "— Select country —",
  "Bangladesh",
  "India",
  "Pakistan",
  "Nigeria",
  "Kenya",
  "Egypt",
  "Philippines",
  "Vietnam",
  "Other",
];

function normalize(doc: DocItem, idx: number) {
  if (typeof doc === "string") return { id: `${idx}:${doc}`, title: doc, context: null as string | null };
  return { id: `${idx}:${doc.title}`, title: doc.title, context: doc.context ?? doc.note ?? null };
}

export function DocumentTracker({ slug, docs }: Props) {
  const items = useMemo(() => docs.map(normalize), [docs]);
  const storageKey = `${STORAGE_PREFIX}${slug}`;

  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [region, setRegion] = useState<string>(REGIONS[0]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setChecked(JSON.parse(raw));
      const r = localStorage.getItem(REGION_KEY);
      if (r) setRegion(r);
    } catch {
      /* ignore */
    }
  }, [storageKey]);

  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(checked));
    } catch {
      /* ignore */
    }
  }, [checked, storageKey, mounted]);

  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem(REGION_KEY, region);
    } catch {
      /* ignore */
    }
  }, [region, mounted]);

  const total = items.length;
  const done = items.filter((i) => checked[i.id]).length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  const complete = total > 0 && done === total;
  const showSouthAsiaWarning = SOUTH_ASIA.has(region);

  const toggle = (id: string) =>
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));

  const toggleExpand = (id: string) =>
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <section>
      <header className="mb-5">
        <div className="flex items-center gap-2">
          <ListChecks className="h-5 w-5 text-primary" />
          <h2 className="font-heading text-2xl font-bold text-foreground">Document tracker</h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Tick each item as you secure it — progress saves automatically to this device.
        </p>
      </header>

      {/* Progress dashboard */}
      <div className="mb-5 rounded-md border border-border bg-heading p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="font-heading text-lg font-bold text-foreground">
              {done} of {total} documents ready
            </div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              {pct}% complete
            </div>
          </div>
          <div className="text-2xl font-bold tabular-nums" style={{ color: "#1E3A8A" }}>
            {pct}%
          </div>
        </div>
        <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-raised">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{ width: `${pct}%`, backgroundColor: "#1E3A8A" }}
          />
        </div>
        {complete && (
          <div className="mt-4 flex items-center gap-2 rounded-md border border-accent bg-accent px-4 py-3 text-sm font-semibold text-accent">
            <PartyPopper className="h-4 w-4" />
            Profile Complete: You are ready to submit your application.
          </div>
        )}
      </div>

      {/* Region selector */}
      <div className="mb-4 rounded-md border border-border bg-heading p-4">
        <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Where are you applying from?
        </label>
        <select
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          className="mt-2 w-full max-w-sm rounded-md border border-border bg-heading px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          {REGIONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      {showSouthAsiaWarning && (
        <div className="mb-4 flex items-start gap-3 rounded-md border border-earth bg-earth px-4 py-3 text-sm text-earth">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            <strong>⚠️ South Asian Applicants:</strong> Remember to book your Embassy APS Certificate or MOFA attestation
            at least 6 weeks in advance.
          </span>
        </div>
      )}

      {/* Checklist */}
      <ul className="space-y-2">
        {items.map((doc) => {
          const isDone = !!checked[doc.id];
          const isOpen = !!expanded[doc.id];
          return (
            <li
              key={doc.id}
              className={`rounded-md border border-border bg-heading transition-all hover:border-primary/40 hover:shadow-sm ${
                isDone ? "opacity-60" : ""
              }`}
            >
              <div className="flex items-start gap-3 p-4">
                <button
                  type="button"
                  onClick={() => toggle(doc.id)}
                  aria-pressed={isDone}
                  aria-label={`Mark ${doc.title} as ${isDone ? "incomplete" : "complete"}`}
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition-all ${
                    isDone
                      ? "border-[#1E3A8A] bg-[#1E3A8A] text-heading"
                      : "border-border bg-heading hover:border-[#1E3A8A]"
                  }`}
                >
                  {isDone && <Check className="h-4 w-4" strokeWidth={3} />}
                </button>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-sm font-medium text-foreground ${
                        isDone ? "line-through decoration-2" : ""
                      }`}
                    >
                      {doc.title}
                    </span>
                    {doc.context && (
                      <button
                        type="button"
                        onClick={() => toggleExpand(doc.id)}
                        aria-label="Show instructions"
                        aria-expanded={isOpen}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-raised hover:text-primary"
                      >
                        <Info className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  {doc.context && isOpen && (
                    <div className="mt-2 rounded-md bg-raised px-3 py-2 text-xs leading-relaxed text-foreground/80">
                      {doc.context}
                    </div>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
