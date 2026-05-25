import { Link } from "@tanstack/react-router";
import { useCompare } from "@/lib/compare-store";
import { Button } from "@/components/ui/button";
import { X, GitCompare, Plus, ArrowRight } from "lucide-react";
import { SmartLogo } from "@/components/SmartLogo";

export function CompareTray() {
  const items = useCompare((s) => s.items);
  const remove = useCompare((s) => s.remove);
  const clear = useCompare((s) => s.clear);
  if (items.length === 0) return null;

  const slots = [0, 1, 2];

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-[#111118]" style={{ borderColor: "#1e1e2a" }}>
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 md:py-3.5">
        <div className="hidden items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/70 md:flex">
          <GitCompare className="h-4 w-4 text-emerald-400" /> Compare
        </div>
        <div className="flex flex-1 items-center gap-2 overflow-x-auto">
          {slots.map((i) => {
            const it = items[i];
            if (!it) {
              return (
                <Link
                  key={i}
                  to="/universities"
                  className="flex h-12 min-w-[150px] items-center gap-2 rounded-lg border border-dashed border-white/20 px-3 text-xs text-white/50 hover:border-white/40 hover:text-white/80"
                >
                  <Plus className="h-3.5 w-3.5" /> Add university
                </Link>
              );
            }
            return (
              <div key={it.slug} className="flex h-12 min-w-[180px] items-center gap-2 rounded-lg bg-white/5 px-2 pr-1">
                <img
                  src={it.logoUrl || it.imageUrl || FALLBACK_IMG}
                  alt=""
                  className="h-9 w-9 flex-none rounded-full border border-white/10 bg-white object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMG; }}
                />
                <span className="min-w-0 flex-1 truncate text-xs font-medium text-white">{it.name}</span>
                <button
                  onClick={() => remove(it.slug)}
                  className="rounded p-1 text-white/60 hover:bg-white/10 hover:text-white"
                  aria-label="Remove"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>
        <Button variant="ghost" size="sm" onClick={clear} className="text-white/70 hover:bg-white/10 hover:text-white">
          Clear
        </Button>
        <Button asChild size="sm" className="bg-emerald-600 text-white hover:bg-emerald-700" disabled={items.length < 2}>
          <Link to="/compare">Compare <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link>
        </Button>
      </div>
    </div>
  );
}
