import { ExternalLink } from "lucide-react";

type SourceType = "reddit" | "quora" | "official" | "youtube" | "ai";

const SOURCE_META: Record<SourceType, { label: string; color: string; icon: string }> = {
  reddit:   { label: "Reddit",   color: "bg-orange-500/15 text-orange-400 ring-orange-500/30", icon: "🔶" },
  quora:    { label: "Quora",    color: "bg-rose-500/15 text-rose-400 ring-rose-500/30",        icon: "Q" },
  official: { label: "Official", color: "bg-primary/15 text-primary ring-primary/30",           icon: "✓" },
  youtube:  { label: "YouTube",  color: "bg-red-500/15 text-red-400 ring-red-500/30",            icon: "▶" },
  ai:       { label: "AI Summary", color: "bg-violet-500/15 text-violet-300 ring-violet-500/30", icon: "✦" },
};

export type Hack = {
  id: string;
  hack_text: string;
  source_url: string | null;
  source_type: string;
  upvotes?: number;
};

export function HackCard({ hack }: { hack: Hack }) {
  const meta = SOURCE_META[(hack.source_type as SourceType)] ?? SOURCE_META.official;
  return (
    <div className="card-surface p-4 transition-colors hover:border-primary/40">
      <div className="flex items-start gap-3">
        <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs font-bold ring-1 ${meta.color}`}>
          {meta.icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm leading-relaxed text-foreground">{hack.hack_text}</p>
          <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
            <span className={`rounded-full px-2 py-0.5 ring-1 ${meta.color}`}>{meta.label}</span>
            {typeof hack.upvotes === "number" && hack.upvotes > 0 && (
              <span>▲ {hack.upvotes}</span>
            )}
            {hack.source_url && (
              <a href={hack.source_url} target="_blank" rel="noopener noreferrer"
                 className="inline-flex items-center gap-1 text-primary hover:underline">
                Source <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
