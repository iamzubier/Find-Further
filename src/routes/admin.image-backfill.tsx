import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  backfillScholarshipBanners,
  backfillUniversityCampusImages,
} from "@/lib/admin-banner-backfill.functions";

export const Route = createFileRoute("/admin/image-backfill")({
  component: Page,
});

function Page() {
  const [secret, setSecret] = useState("");
  const [log, setLog] = useState<string[]>([]);
  const [running, setRunning] = useState<null | "schol" | "uni">(null);
  const runSchol = useServerFn(backfillScholarshipBanners);
  const runUni = useServerFn(backfillUniversityCampusImages);

  const loop = async (which: "schol" | "uni") => {
    setRunning(which);
    setLog([]);
    try {
      for (let i = 0; i < 30; i++) {
        const r =
          which === "schol"
            ? await runSchol({ data: { key: secret, limit: 8 } })
            : await runUni({ data: { key: secret, limit: 8 } });
        setLog((l) => [...l, JSON.stringify(r)]);
        if ((r as any).remaining === 0 || (r as any).batch === 0) break;
      }
    } catch (e: any) {
      setLog((l) => [...l, `error: ${e?.message ?? String(e)}`]);
    } finally {
      setRunning(null);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-6 py-16 space-y-4">
      <h1 className="text-2xl font-semibold">Dynamic Image Backfill</h1>
      <p className="text-sm text-muted-foreground">
        Pulls Unsplash (with Wikipedia fallback for unis) and saves URLs to the database.
      </p>
      <Input
        type="password"
        placeholder="Admin secret"
        value={secret}
        onChange={(e) => setSecret(e.target.value)}
      />
      <div className="flex gap-2">
        <Button onClick={() => loop("schol")} disabled={!secret || running !== null}>
          {running === "schol" ? "Running…" : "Backfill scholarship banners"}
        </Button>
        <Button onClick={() => loop("uni")} disabled={!secret || running !== null} variant="outline">
          {running === "uni" ? "Running…" : "Backfill university campus images"}
        </Button>
      </div>
      {log.length > 0 && (
        <pre className="text-xs bg-muted p-4 rounded-md overflow-auto max-h-96">
          {log.join("\n")}
        </pre>
      )}
    </div>
  );
}
