import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  backfillScholarshipBanners,
  backfillUniversityCampusImages,
} from "@/lib/admin-banner-backfill.functions";
import { fixPlaceImagesBatch } from "@/lib/admin-places-images.functions";

export const Route = createFileRoute("/admin/image-backfill")({
  component: Page,
});

function Page() {
  const [secret, setSecret] = useState("");
  const [log, setLog] = useState<string[]>([]);
  const [running, setRunning] = useState<null | "schol" | "uni" | "places">(null);
  const [force, setForce] = useState(false);
  const runSchol = useServerFn(backfillScholarshipBanners);
  const runUni = useServerFn(backfillUniversityCampusImages);
  const runPlaces = useServerFn(fixPlaceImagesBatch);

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

  const loopPlaces = async () => {
    setRunning("places");
    setLog([]);
    let offset = 0;
    const limit = 5;
    try {
      for (let i = 0; i < 400; i++) {
        const r = await runPlaces({ data: { key: secret, offset, limit, force } });
        setLog((l) => [...l, JSON.stringify(r)]);
        if ((r as any).done || (r as any).batch === 0) break;
        offset += limit;
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
        Google Maps Places gives a unique campus photo per university. Logos now come from Wikipedia/Wikimedia instead of blurry favicon sources.
      </p>
      <Input
        type="password"
        placeholder="Admin secret"
        value={secret}
        onChange={(e) => setSecret(e.target.value)}
      />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={force} onChange={(e) => setForce(e.target.checked)} />
        Force re-fetch (overwrite existing photos/logos)
      </label>
      <div className="flex flex-wrap gap-2">
        <Button onClick={loopPlaces} disabled={!secret || running !== null}>
          {running === "places" ? "Fetching logos and campus images…" : "Backfill logos + campus images"}
        </Button>
        <Button onClick={() => loop("schol")} disabled={!secret || running !== null} variant="outline">
          {running === "schol" ? "Running…" : "Scholarship banners"}
        </Button>
        <Button onClick={() => loop("uni")} disabled={!secret || running !== null} variant="outline">
          {running === "uni" ? "Running…" : "Uni campus (legacy)"}
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
