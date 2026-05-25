import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { seedScholarships } from "@/lib/seed-scholarships.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/admin/seed-scholarships")({
  component: SeedPage,
});

function SeedPage() {
  const [secret, setSecret] = useState("");
  const [result, setResult] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const seed = useServerFn(seedScholarships);

  const run = async () => {
    setLoading(true);
    setResult("");
    try {
      const r = await seed({ data: { admin_secret: secret } });
      setResult(JSON.stringify(r, null, 2));
    } catch (e: any) {
      setResult(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl px-6 py-16 space-y-4">
      <h1 className="text-2xl font-semibold">Seed Scholarships Catalog</h1>
      <p className="text-sm text-muted-foreground">
        Upserts the 45-program master catalog plus community tips and success stories.
      </p>
      <Input
        type="password"
        placeholder="Admin secret"
        value={secret}
        onChange={(e) => setSecret(e.target.value)}
      />
      <Button onClick={run} disabled={!secret || loading}>
        {loading ? "Seeding…" : "Run seed"}
      </Button>
      {result && (
        <pre className="text-xs bg-muted p-4 rounded-md overflow-auto">{result}</pre>
      )}
    </div>
  );
}
