import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Upload, Database, FileSpreadsheet, Lock, BarChart3, Image as ImageIcon } from "lucide-react";
import {
  verifyAdmin,
  importFromHipolabs,
  importQsRankings,
  importTuition,
} from "@/lib/admin-import.functions";
import { getUniStats } from "@/lib/admin-stats.functions";
import { fixCampusImagesBatch } from "@/lib/admin-wiki-images.functions";

export const Route = createFileRoute("/admin/import")({
  head: () => ({ meta: [{ title: "Admin — Import Data" }, { name: "robots", content: "noindex" }] }),
  component: AdminImportPage,
});

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const split = (line: string) => {
    const out: string[] = [];
    let cur = "", inQ = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') { inQ = !inQ; continue; }
      if (c === "," && !inQ) { out.push(cur); cur = ""; continue; }
      cur += c;
    }
    out.push(cur);
    return out.map((s) => s.trim());
  };
  const headers = split(lines[0]).map((h) => h.toLowerCase().replace(/\s+/g, "_"));
  return lines.slice(1).map((line) => {
    const cells = split(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = cells[i] ?? ""; });
    return row;
  });
}

type Stats = { stats: { total: number; has_image: number; has_logo: number; has_ranking: number; has_tuition: number }; countries: { country: string; count: number }[] };

function AdminImportPage() {
  const [key, setKey] = useState("");
  const [verified, setVerified] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);

  const verify = useServerFn(verifyAdmin);
  const statsFn = useServerFn(getUniStats);
  const hipo = useServerFn(importFromHipolabs);

  async function loadStats() {
    setBusy("stats");
    try { setStats(await statsFn({ data: { key } })); }
    catch (e) { toast.error((e as Error).message); }
    finally { setBusy(null); }
  }
  const qs = useServerFn(importQsRankings);
  const tu = useServerFn(importTuition);

  async function handleVerify() {
    if (!key.trim()) { toast.error("Enter the admin secret"); return; }
    try {
      const r = await verify({ data: { key } });
      if (r.ok) { setVerified(true); toast.success("Admin verified"); }
      else toast.error("Invalid key");
    } catch { toast.error("Invalid key"); }
  }

  async function handleHipo() {
    setBusy("hipo");
    try {
      const r = await hipo({ data: { key } });
      toast.success(`Fetched ${r.totalFetched}, inserted ${r.inserted}`);
      if (r.errors.length) toast.warning(`${r.errors.length} errors`);
    } catch (e) { toast.error((e as Error).message); }
    finally { setBusy(null); }
  }

  async function handleCsv(kind: "qs" | "tuition", file: File) {
    setBusy(kind);
    try {
      const text = await file.text();
      const rows = parseCsv(text);
      if (!rows.length) throw new Error("Empty CSV");
      const r = kind === "qs"
        ? await qs({ data: { key, rows } })
        : await tu({ data: { key, rows } });
      toast.success(`Processed ${rows.length} rows: ${JSON.stringify(r)}`);
    } catch (e) { toast.error((e as Error).message); }
    finally { setBusy(null); }
  }

  if (!verified) {
    return (
      <div className="mx-auto max-w-md px-4 py-20">
        <div className="card-surface p-8">
          <Lock className="h-8 w-8 text-primary" />
          <h1 className="mt-3 font-heading text-2xl font-bold">Admin Access</h1>
          <p className="mt-1 text-sm text-muted-foreground">Enter the admin secret to continue.</p>
          <Input
            type="password" value={key} onChange={(e) => setKey(e.target.value)}
            placeholder="ADMIN_SECRET" className="mt-4"
            onKeyDown={(e) => e.key === "Enter" && handleVerify()}
          />
          <Button onClick={handleVerify} className="mt-3 w-full">Verify</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 space-y-6">
      <h1 className="font-heading text-4xl font-bold">Data Import</h1>
      <p className="text-sm text-muted-foreground">Populate the universities database from free public sources.</p>

      <Card title="Database Stats" icon={<BarChart3 className="h-5 w-5" />}
        desc="Live counts from universities_detail (the actual table — there is no `universities` table; tuition is JSONB).">
        <Button onClick={loadStats} disabled={busy !== null} variant="outline">
          {busy === "stats" ? "Loading…" : stats ? "Refresh" : "Load Stats"}
        </Button>
        {stats && (
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              {[
                ["Total", stats.stats.total],
                ["Has image", stats.stats.has_image],
                ["Has logo", stats.stats.has_logo],
                ["Has ranking", stats.stats.has_ranking],
                ["Has tuition", stats.stats.has_tuition],
              ].map(([label, val]) => (
                <div key={label as string} className="rounded-md border border-border bg-secondary/40 p-3">
                  <div className="text-xs uppercase text-muted-foreground">{label}</div>
                  <div className="font-heading text-2xl font-bold">{val}</div>
                </div>
              ))}
            </div>
            <div>
              <div className="mb-2 text-sm font-medium">Top 20 countries</div>
              <div className="overflow-hidden rounded-md border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-secondary/60 text-left text-xs uppercase text-muted-foreground">
                    <tr><th className="px-3 py-2">Country</th><th className="px-3 py-2 text-right">Count</th></tr>
                  </thead>
                  <tbody>
                    {stats.countries.map((c) => (
                      <tr key={c.country} className="border-t border-border">
                        <td className="px-3 py-2">{c.country}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{c.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </Card>

      <Card title="1. Hipolabs Universities API" icon={<Database className="h-5 w-5" />}
        desc="Fetch ~10k universities from 15 countries. Free public API.">
        <Button onClick={handleHipo} disabled={busy !== null}>
          {busy === "hipo" ? "Importing…" : "Import from Hipolabs"}
        </Button>
      </Card>

      <Card title="2. QS Rankings CSV" icon={<FileSpreadsheet className="h-5 w-5" />}
        desc="Upload QS World University Rankings CSV. Expected columns: institution, rank, country, score, academic_reputation, employer_reputation, citations_per_faculty, international_students.">
        <FilePick disabled={busy !== null} onPick={(f) => handleCsv("qs", f)} label={busy === "qs" ? "Importing…" : "Upload QS CSV"} />
        <p className="mt-2 text-xs text-muted-foreground">
          Free dataset: <a className="underline" target="_blank" rel="noreferrer"
            href="https://www.kaggle.com/datasets/padhmam/qs-world-university-rankings-2017-2022">Kaggle QS 2017-2022</a>
        </p>
      </Card>

      <Card title="3. Tuition Data CSV" icon={<Upload className="h-5 w-5" />}
        desc="Upload tuition CSV. Expected columns: university_name, country, tuition_usd, currency, tuition_display.">
        <FilePick disabled={busy !== null} onPick={(f) => handleCsv("tuition", f)} label={busy === "tuition" ? "Importing…" : "Upload Tuition CSV"} />
        <p className="mt-2 text-xs text-muted-foreground">
          Free dataset: <a className="underline" target="_blank" rel="noreferrer"
            href="https://www.kaggle.com/datasets/mylesoneill/world-university-rankings">Kaggle World University Rankings</a>
        </p>
      </Card>
    </div>
  );
}

function Card({ title, icon, desc, children }: { title: string; icon: React.ReactNode; desc: string; children: React.ReactNode }) {
  return (
    <div className="card-surface p-6">
      <div className="flex items-center gap-2 text-primary">{icon}<h2 className="font-heading text-xl font-bold text-foreground">{title}</h2></div>
      <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function FilePick({ onPick, label, disabled }: { onPick: (f: File) => void; label: string; disabled: boolean }) {
  return (
    <label className={`inline-flex cursor-pointer items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 ${disabled ? "opacity-50 pointer-events-none" : ""}`}>
      <Upload className="h-4 w-4" /> {label}
      <input type="file" accept=".csv" className="hidden" onChange={(e) => {
        const f = e.target.files?.[0]; if (f) onPick(f); e.target.value = "";
      }} />
    </label>
  );
}
