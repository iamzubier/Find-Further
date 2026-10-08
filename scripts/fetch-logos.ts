// scripts/fetch-logos.ts
// Matches universities (Hipolabs) to logos on Wikidata/Wikimedia Commons by website domain,
// then writes a coverage report plus two CSVs: matched logos and universities still missing one.
// Run locally: bun run scripts/fetch-logos.ts   (or via the GitHub Action)

import { appendFile, mkdir, writeFile } from "node:fs/promises";

// Wikimedia asks scripts to identify themselves
const UA = "FindFurtherLogoScript/1.0 (https://github.com/iamzubier)";
const HIPOLABS_URL = "https://universities.hipolabs.com/search";
const HIPOLABS_FALLBACK_URL =
  "https://raw.githubusercontent.com/Hipo/university-domains-list/master/world_universities_and_domains.json";

type Uni = { name: string; country: string; domains?: string[]; web_pages?: string[] };
type WdRow = {
  item: { value: string };
  itemLabel?: { value: string };
  site: { value: string };
  logo: { value: string };
};
type Logo = { logo: string; label: string; item: string };

// Universities, colleges, public/private/research universities, higher-education institutions.
// `wdt:` returns only the best-ranked logo (preferred rank wins, deprecated is skipped).
const SPARQL = `
SELECT ?item ?itemLabel ?site ?logo WHERE {
  VALUES ?c { wd:Q3918 wd:Q875538 wd:Q23002054 wd:Q15936437 wd:Q189004 wd:Q38723 }
  ?item wdt:P31 ?c ; wdt:P856 ?site ; wdt:P154 ?logo .
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}`;

async function getJson<T>(url: string, headers: Record<string, string> = {}): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": UA, ...headers } });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url.slice(0, 80)}`);
      return (await res.json()) as T;
    } catch (err) {
      lastErr = err;
      await new Promise((r) => setTimeout(r, 2000 * attempt));
    }
  }
  throw lastErr;
}

function host(url: string): string | null {
  try {
    const h = new URL(url.includes("://") ? url : `https://${url}`).hostname.toLowerCase();
    return h.replace(/^www\./, "");
  } catch {
    return null;
  }
}

// "cs.stanford.edu" -> ["cs.stanford.edu", "stanford.edu"]; never strips down to "ac.uk" or "edu.au"
const GENERIC = /^(ac|edu|co|com|org|net|gov|sch)\.[a-z]{2}$/;
function candidates(domain: string): string[] {
  const parts = domain.split(".");
  const out: string[] = [];
  for (let i = 0; i < parts.length - 1; i++) {
    const c = parts.slice(i).join(".");
    if (c.split(".").length < 2 || GENERIC.test(c)) break;
    out.push(c);
  }
  return out;
}

// Commons "FilePath" links redirect to the file; ?width=256 gives a PNG render of SVGs
const toLogoUrl = (raw: string) => raw.replace(/^http:/, "https:") + "?width=256";

const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
const toCsv = (rows: string[][]) => rows.map((r) => r.map(esc).join(",")).join("\n") + "\n";

async function main() {
  console.log("Loading universities from Hipolabs...");
  let unis: Uni[];
  try {
    unis = await getJson<Uni[]>(HIPOLABS_URL);
  } catch (err) {
    console.warn("Hipolabs API unavailable, retrying with GitHub mirror dataset...");
    console.warn(err);
    unis = await getJson<Uni[]>(HIPOLABS_FALLBACK_URL);
  }
  console.log(`  ${unis.length} universities`);

  console.log("Loading logos from Wikidata...");
  const wd = await getJson<{ results: { bindings: WdRow[] } }>(
    "https://query.wikidata.org/sparql?format=json&query=" + encodeURIComponent(SPARQL),
    { Accept: "application/sparql-results+json" },
  );
  const byHost = new Map<string, Logo>();
  for (const row of wd.results.bindings) {
    const h = host(row.site.value);
    if (!h || byHost.has(h)) continue;
    byHost.set(h, {
      logo: toLogoUrl(row.logo.value),
      label: row.itemLabel?.value ?? "",
      item: row.item.value,
    });
  }
  console.log(`  ${byHost.size} Wikidata institutions with a website and a logo`);

  const matched: string[][] = [["name", "country", "domain", "logo_url", "match", "wikidata_item"]];
  const missing: string[][] = [["name", "country", "domain", "website"]];
  const missingByCountry = new Map<string, number>();
  let exact = 0;
  let parent = 0;

  for (const u of unis) {
    let hit: { domain: string; logo: Logo; kind: "exact" | "parent" } | null = null;

    for (const d of u.domains ?? []) {
      const dom = host(d);
      if (!dom) continue;
      for (const c of candidates(dom)) {
        const logo = byHost.get(c);
        if (logo) {
          hit = { domain: dom, logo, kind: c === dom ? "exact" : "parent" };
          break;
        }
      }
      if (hit) break;
    }

    if (hit) {
      hit.kind === "exact" ? exact++ : parent++;
      matched.push([u.name, u.country, hit.domain, hit.logo.logo, hit.kind, hit.logo.item]);
    } else {
      missing.push([u.name, u.country, u.domains?.[0] ?? "", u.web_pages?.[0] ?? ""]);
      missingByCountry.set(u.country, (missingByCountry.get(u.country) ?? 0) + 1);
    }
  }

  const total = unis.length;
  const found = exact + parent;
  const pct = ((found / total) * 100).toFixed(1);
  const topMissing = [...missingByCountry.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);

  const report = [
    "## University logo coverage",
    "",
    `- Universities checked: **${total}**`,
    `- Matched to a Wikidata logo: **${found}** (${pct}%)`,
    `  - exact domain match: ${exact}`,
    `  - parent-domain match (spot-check these in logos.csv): ${parent}`,
    `- Still missing (favicon/initials fallback, or add manually): **${total - found}**`,
    "",
    "### Countries with the most missing logos",
    "| Country | Missing |",
    "|---|---|",
    ...topMissing.map(([c, n]) => `| ${c} | ${n} |`),
    "",
  ].join("\n");

  await mkdir("out", { recursive: true });
  await writeFile("out/logos.csv", toCsv(matched));
  await writeFile("out/missing.csv", toCsv(missing));
  await writeFile("out/report.md", report);

  console.log("\n" + report);
  if (process.env.GITHUB_STEP_SUMMARY) {
    await appendFile(process.env.GITHUB_STEP_SUMMARY, report);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
