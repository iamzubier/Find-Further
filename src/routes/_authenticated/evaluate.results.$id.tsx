import { createFileRoute, redirect } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { loadEvaluation } from "@/lib/evaluation.functions";
import { ResultsView } from "@/routes/evaluate";

export const Route = createFileRoute("/_authenticated/evaluate/results/$id")({
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({ to: "/auth", search: { tab: "login" } });
    }
  },
  component: SharedResults,
});

function SharedResults() {
  const { id } = Route.useParams();
  const fn = useServerFn(loadEvaluation);
  const { data, isLoading, error } = useQuery({
    queryKey: ["evaluation", id],
    queryFn: () => fn({ data: { id } }),
  });

  if (isLoading) return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (error || !data) return <div className="mx-auto max-w-2xl px-4 py-20 text-center"><p>Evaluation not found.</p></div>;

  return <ResultsView result={data} canSave={false} />;
}
