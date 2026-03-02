import { getEvents, parseTokenIds, parseOutcomes, type GammaEvent, type GammaMarket } from "./gamma.js";
import { config } from "./config.js";

export interface BinaryMarket {
  eventSlug: string;
  eventTitle: string;
  marketSlug: string;
  question: string;
  tokenYes: string;
  tokenNo: string;
  outcomeYes: string;
  outcomeNo: string;
}

function extractBinary(event: GammaEvent): BinaryMarket[] {
  const out: BinaryMarket[] = [];
  const markets = event.markets ?? [];
  for (const m of markets) {
    const tokens = parseTokenIds(m);
    const outcomes = parseOutcomes(m);
    if (tokens.length >= 2 && outcomes.length >= 2) {
      out.push({
        eventSlug: event.slug ?? "",
        eventTitle: event.title ?? "",
        marketSlug: (m as GammaMarket & { slug?: string }).slug ?? m.id ?? "",
        question: m.question ?? event.title ?? "",
        tokenYes: tokens[0]!,
        tokenNo: tokens[1]!,
        outcomeYes: outcomes[0]!,
        outcomeNo: outcomes[1]!,
      });
    }
  }
  return out;
}

export async function discoverSportsMarkets(): Promise<BinaryMarket[]> {
  const events = await getEvents(config.gammaUrl, {
    tagId: config.sportsTagId ?? undefined,
    active: config.activeOnly,
    closed: false,
    limit: config.eventsLimit,
    offset: 0,
  });
  const binaries: BinaryMarket[] = [];
  for (const e of events) {
    binaries.push(...extractBinary(e));
  }
  return binaries;
}
