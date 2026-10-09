
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type University = {
  id: number;
  title: string | null;
  country: string | null;
  city: string | null;
  region: string | null;
  qs_rank_latest: string | null;
  qs_overall_score: number | null;
};

export const Route = createFileRoute("/universities")({
  component: UniversitiesPage,
});

const CHUNK = 1000; // Supabase returns max 1000 rows per request

async function fetchAll(): Promise<University[]> {
  const all: University[] = [];
  for (let from = 0; ; from += CHUNK) {
    // "qs" isn't in the auto-generated Database types, so we cast
    const { data, error } = await (supabase as any)
      .from("qs")
      .select("id,title,country,city,region,qs_rank_latest,qs_overall_score")
      .order("id", { ascending: true })
      .range(from, from + CHUNK - 1);
    if (error) throw error;
    all.push(...((data ?? []) as University[]));
    if (!data || data.length < CHUNK) break;
  }
  return all;
}

function UniversitiesPage() {
  const [rows, setRows] = useState<University[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [country, setCountry] = useState("");
  const [visible, setVisible] = useState(40);

  useEffect(() => {
    fetchAll()
      .then(setRows)
      .catch((e) => setError(e?.message ?? "Failed to load universities"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setVisible(40);
  }, [q, country]);

  const countries = useMemo(
    () =>
      Array.from(
        new Set(rows.map((r) => r.country).filter(Boolean) as string[]),
      ).sort(),
    [rows],
  );

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter(
      (r) =>
        (!country || r.country === country) &&
        (!needle ||
          (r.title ?? "").toLowerCase().includes(needle) ||
          (r.city ?? "").toLowerCase().includes(needle)),
    );
  }, [rows, q, country]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold">Universities</h1>
      <p className="mt-1 text-neutral-600">
        {loading ? "Loading..." : `${filtered.length} of ${rows.length} universities`}
      </p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by university or city"
          className="w-full rounded-lg border border-black/20 bg-white px-4 py-2 text-black sm:flex-1"
        />
        <select
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="rounded-lg border border-black/20 bg-white px-4 py-2 text-black"
        >
          <option value="">All countries</option>
          {countries.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="mt-6 text-red-600">Error: {error}</p>}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.slice(0, visible).map((u) => (
          <div
            key={u.id}
            className="rounded-xl border border-black/10 bg-white p-4 text-black shadow-sm"
          >
            <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              QS rank {u.qs_rank_latest ?? "n/a"}
            </div>
            <h2 className="mt-1 font-semibold leading-snug">{u.title}</h2>
            <p className="mt-1 text-sm text-neutral-600">
              {[u.city, u.country].filter(Boolean).join(", ")}
            </p>
            <p className="mt-2 text-sm">
              {u.qs_overall_score != null
                ? `Overall score: ${u.qs_overall_score}`
                : "Score not published"}
            </p>
          </div>
        ))}
      </div>

      {!loading && visible < filtered.length && (
        <div className="mt-8 text-center">
          <button
            onClick={() => setVisible((v) => v + 40)}
            className="rounded-lg border border-black/20 bg-white px-5 py-2 text-black"
          >
            Show more
          </button>
        </div>
      )}
    </main>
  );
}
