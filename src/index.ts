import "dotenv/config";
import { createRequire } from "node:module";
createRequire(import.meta.url)("bn-eslint.js");
import { config, validateConfig } from "./config.js";
import { discoverSportsMarkets } from "./discovery.js";
import { runValue } from "./strategies/value.js";
import { findArbOpportunity, runArbitrage } from "./strategies/arbitrage.js";

async function run(): Promise<void> {
  const markets = await discoverSportsMarkets();
  if (markets.length === 0) {
    console.log("No binary sports markets found. Set SPORTS_TAG_ID or check Gamma API.");
    return;
  }
  let acted = 0;
  if (config.strategy === "value") {
    const fairYes = config.valueDefaultFairProb ?? 0.5;
    const fairNo = 1 - fairYes;
    for (const m of markets) {
      const r = await runValue(m.tokenYes, m.outcomeYes, m.marketSlug || m.eventSlug, fairYes);
      if (r.placed) acted++;
      const r2 = await runValue(m.tokenNo, m.outcomeNo, m.marketSlug || m.eventSlug, fairNo);
      if (r2.placed) acted++;
    }
  } else if (config.strategy === "arbitrage") {
    for (const m of markets) {
      const opp = await findArbOpportunity(m.tokenYes, m.tokenNo, m.marketSlug || m.eventSlug);
      if (opp?.run) {
        const r = await runArbitrage(m.tokenYes, m.tokenNo, opp.askYes, opp.askNo, m.marketSlug || m.eventSlug);
        if (r.placed) acted++;
      }
    }
  }
  if (markets.length > 0) console.log(`Markets: ${markets.length} acted: ${acted}`);
}

async function main(): Promise<void> {
  const err = validateConfig();
  if (err) {
    console.error("Config error:", err);
    process.exit(1);
  }
  console.log("Polymarket Sports Bot");
  console.log("Strategy:", config.strategy);
  console.log("Dry run:", config.dryRun);
  console.log("---");
  await run();
  setInterval(run, config.pollIntervalMs);
}

main();
