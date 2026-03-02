const DEFAULT_LIMIT = 50;

export interface GammaMarket {
  id: string;
  slug?: string;
  question?: string;
  conditionId?: string;
  clobTokenIds?: string[];
  outcomes?: string;
  outcomePrices?: string;
  volume?: number;
  active?: boolean;
  closed?: boolean;
  endDate?: string;
}

export interface GammaEvent {
  id: string;
  slug: string;
  title: string;
  markets: GammaMarket[];
  active?: boolean;
  closed?: boolean;
  endDate?: string;
  volume?: number;
}

export interface SportsTag {
  id: number;
  label?: string;
  slug?: string;
}

export async function getSportsTags(base: string): Promise<SportsTag[]> {
  const res = await fetch(`${base}/sports`, { headers: { Accept: "application/json" } });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export async function getEvents(
  base: string,
  opts: { tagId?: string | null; active?: boolean; closed?: boolean; limit?: number; offset?: number } = {}
): Promise<GammaEvent[]> {
  const params = new URLSearchParams();
  if (opts.tagId) params.set("tag_id", opts.tagId);
  if (opts.active != null) params.set("active", String(opts.active));
  if (opts.closed != null) params.set("closed", String(opts.closed));
  params.set("limit", String(opts.limit ?? DEFAULT_LIMIT));
  params.set("offset", String(opts.offset ?? 0));
  const url = `${base}/events?${params}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`Gamma ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export function parseTokenIds(market: GammaMarket): string[] {
  const raw = market.clobTokenIds;
  if (Array.isArray(raw)) return raw.filter((s): s is string => typeof s === "string" && s.length > 0);
  if (typeof raw === "string") {
    try {
      const arr = JSON.parse(raw) as unknown;
      return Array.isArray(arr) ? arr.filter((s): s is string => typeof s === "string") : [];
    } catch {
      return [];
    }
  }
  return [];
}

export function parseOutcomes(market: GammaMarket): string[] {
  const raw = market.outcomes;
  if (Array.isArray(raw)) return raw.filter((s): s is string => typeof s === "string");
  if (typeof raw === "string") {
    try {
      const arr = JSON.parse(raw) as unknown;
      return Array.isArray(arr) ? arr.map(String) : [];
    } catch {
      return raw.split(",").map((s) => s.trim()).filter(Boolean);
    }
  }
  return [];
}
