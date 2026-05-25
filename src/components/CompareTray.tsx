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
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-white shadow-[0_-4px_12px_-2px_rgba(0,0,0,0.08)]">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
        <div className="hidden items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground md:flex">
          <GitCompare className="h-4 w-4 text-primary" /> Compare
        </div>
        <div className="flex flex-1 items-center gap-2 overflow-x-auto">
          {slots.map((i) => {
            const it = items[i];
            if (!it) {
              return (
                <Link
                  key={i}
                  to="/universities"
                  className="flex h-12 min-w-[150px] items-center gap-2 rounded border border-dashed border-border px-3 text-xs text-muted-foreground hover:border-primary hover:text-primary"
                >
                  <Plus className="h-3.5 w-3.5" /> Add university
                </Link>
              );
            }
            return (
              <div key={it.slug} className="flex h-12 min-w-[180px] items-center gap-2 rounded border border-border bg-white px-2 pr-1">
                <SmartLogo name={it.name} logoUrl={it.logoUrl} size={32} />
                <span className="min-w-0 flex-1 truncate text-xs font-semibold text-foreground">{it.name}</span>
                <button
                  onClick={() => remove(it.slug)}
                  className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
                  aria-label="Remove"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>
        <Button variant="ghost" size="sm" onClick={clear} className="text-muted-foreground hover:text-foreground">
          Clear
        </Button>
        <Button asChild size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90" disabled={items.length < 2}>
          <Link to="/compare">Compare Now <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link>
        </Button>
      </div>
    </div>
  );
}
