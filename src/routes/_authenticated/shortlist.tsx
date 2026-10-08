import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Bookmark, Trash2, ExternalLink, ArrowRight } from "lucide-react";
import { daysLeft } from "@/lib/data";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/shortlist")({
  head: () => ({ meta: [{ title: "Saved — FindFurther" }, { name: "robots", content: "noindex" }] }),
  component: ShortlistPage,
});

type Item = {
  id: string; item_type: "university" | "scholarship";
  item_id: string; item_name: string; item_data: any;
};

function ShortlistPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Item[]>([]);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("shortlist").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setItems((data as any[] ?? []) as Item[]);
  };
  useEffect(() => { load(); }, [user]);

  const remove = async (id: string) => {
    const { error } = await supabase.from("shortlist").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Removed"); load(); }
  };

  const unis = items.filter(i => i.item_type === "university");
  const schs = items.filter(i => i.item_type === "scholarship");

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="font-heading text-3xl font-extrabold md:text-4xl">Saved</h1>
      <p className="mt-1 text-sm text-muted-foreground">Everything you've bookmarked.</p>

      <Tabs defaultValue="universities" className="mt-6">
        <TabsList className="grid w-full grid-cols-2 md:w-96">
          <TabsTrigger value="universities">Universities <span className="ml-2 rounded-full bg-secondary px-2 py-0.5 text-xs">{unis.length}</span></TabsTrigger>
          <TabsTrigger value="scholarships">Scholarships <span className="ml-2 rounded-full bg-secondary px-2 py-0.5 text-xs">{schs.length}</span></TabsTrigger>
        </TabsList>

        <TabsContent value="universities" className="mt-6 space-y-3">
          {unis.length === 0 ? <Empty type="university" /> : unis.map((it) => {
            const u = it.item_data ?? {};
            return (
              <div key={it.id} className="card-surface p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    {u.qsRank && <div className="rounded-md bg-secondary px-2.5 py-1 text-xs font-semibold">#{u.qsRank}</div>}
                    <span className="text-2xl">{u.countryFlag ?? "🎓"}</span>
                    <div>
                      <h3 className="font-heading text-lg font-extrabold">{it.item_name}</h3>
                      <div className="mt-1 text-xs text-muted-foreground">{u.country} · {u.dealTag}</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">View details <ArrowRight className="ml-1 h-4 w-4" /></Button>
                    <Button size="sm" variant="outline" onClick={() => remove(it.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              </div>
            );
          })}
        </TabsContent>

        <TabsContent value="scholarships" className="mt-6 space-y-3">
          {schs.length === 0 ? <Empty type="scholarship" /> : schs.map((it) => {
            const s = it.item_data ?? {};
            const d = s.deadline ? daysLeft(s.deadline) : null;
            return (
              <div key={it.id} className="card-surface p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{s.countryFlag ?? "🏷"}</span>
                    <div>
                      <h3 className="font-heading text-lg font-extrabold">{it.item_name}</h3>
                      <div className="mt-1 text-xs text-muted-foreground">{s.country} · {s.type}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {d !== null && (
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        d < 0 ? "bg-muted text-muted-foreground" :
                        d <= 10 ? "bg-destructive/20 text-destructive ring-1 ring-destructive/40" :
                        d <= 30 ? "bg-warning/20 text-warning ring-1 ring-warning/40" :
                        "bg-secondary text-muted-foreground"
                      }`}>{d < 0 ? "Closed" : `${d} days left`}</span>
                    )}
                    <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">Apply now <ExternalLink className="ml-1 h-4 w-4" /></Button>
                    <Button size="sm" variant="outline" onClick={() => remove(it.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              </div>
            );
          })}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Empty({ type }: { type: "university" | "scholarship" }) {
  return (
    <div className="card-surface flex flex-col items-center py-16 text-center">
      <div className="rounded-full bg-secondary p-4"><Bookmark className="h-7 w-7 text-muted-foreground" /></div>
      <h3 className="mt-4 font-heading text-xl font-extrabold">Nothing saved yet</h3>
      <p className="mt-1 text-sm text-muted-foreground">Browse and tap the heart to save {type === "university" ? "universities" : "scholarships"}.</p>
      <Button asChild className="mt-5 bg-primary text-primary-foreground hover:bg-primary/90">
        <Link to={type === "university" ? "/universities" : "/scholarships"}>Browse {type === "university" ? "universities" : "scholarships"}</Link>
      </Button>
    </div>
  );
}
