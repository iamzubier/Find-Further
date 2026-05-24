import { VERDICT_STYLES, type Verdict } from "@/lib/matching";

export function MatchBadge({ verdict, score, size = "md" }: { verdict: Verdict; score: number; size?: "sm" | "md" }) {
  const s = VERDICT_STYLES[verdict];
  const sz = size === "sm" ? "px-2.5 py-0.5 text-xs" : "px-3 py-1 text-sm";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-semibold ring-1 ${s.bg} ${s.text} ${s.ring} ${sz}`}>
      <span className="tabular-nums">{score}%</span>
      <span className="opacity-70">·</span>
      <span>{verdict}</span>
    </span>
  );
}
