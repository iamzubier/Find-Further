import { Link } from "@tanstack/react-router";
import { useCompare } from "@/lib/compare-store";
import { UNIVERSITIES } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { X, GitCompare } from "lucide-react";

export function CompareTray() {
  const ids = useCompare((s) => s.ids);
  const remove = useCompare((s) => s.remove);
  const clear = useCompare((s) => s.clear);
  if (ids.length === 0) return null;

  const unis = ids.map((id) => UNIVERSITIES.find((u) => u.id === id)).filter(Boolean) as typeof UNIVERSITIES;

  return (
    <div className="fixed inset-x-3 bottom-3 z-40 mx-auto max-w-3xl rounded-2xl border border-border bg-card/95 p-3 shadow-2xl backdrop-blur-md md:inset-x-auto md:right-6 md:left-auto">
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1.5 px-2 text-xs font-semibold uppercase text-muted-foreground">
          <GitCompare className="h-3.5 w-3.5 text-primary" /> Compare ({ids.length}/3)
        </span>
        {unis.map((u) => (
          <span key={u.id} className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs">
            {u.countryFlag} <span className="max-w-[140px] truncate">{u.name}</span>
            <button onClick={() => remove(u.id)} className="text-muted-foreground hover:text-foreground" aria-label="Remove">
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <div className="ml-auto flex gap-2">
          <Button size="sm" variant="ghost" onClick={clear}>Clear</Button>
          <Button asChild size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90" disabled={ids.length < 2}>
            <Link to="/compare">Compare →</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
