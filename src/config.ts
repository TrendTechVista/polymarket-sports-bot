const env = process.env;

export const config = {
  /** Strategy: "value" (edge betting) | "arbitrage" (yes+no sum < 1) */
  strategy: (env.SPORTS_STRATEGY ?? "value").toLowerCase(),
  /** Gamma tag_id for sports (e.g. 100381). Discover via GET /sports */
  sportsTagId: (env.SPORTS_TAG_ID ?? "").trim() || null,
  /** Or fetch all active events (no tag filter) if SPORTS_TAG_ID empty */
  activeOnly: (env.SPORTS_ACTIVE_ONLY ?? "true").toLowerCase() === "true",
  /** Poll interval (ms) */
  pollIntervalMs: Math.max(10_000, parseInt(env.SPORTS_POLL_INTERVAL_MS ?? "60000", 10)),
  /** Max events per poll */
  eventsLimit: Math.min(100, Math.max(10, parseInt(env.SPORTS_EVENTS_LIMIT ?? "50", 10))),

  /** Value strategy: minimum edge (e.g. 0.02 = 2%) to place a bet */
  valueMinEdge: Math.max(0.001, Math.min(0.5, parseFloat(env.SPORTS_VALUE_MIN_EDGE ?? "0.02"))),
  /** Value: assume fair probability (0–1). If null, use 0.5 (no prior). Set per-market via API or use 0.5. */
  valueDefaultFairProb: env.SPORTS_VALUE_FAIR_PROB ? parseFloat(env.SPORTS_VALUE_FAIR_PROB) : null,
  /** Max USDC per order */
  maxOrderUsd: parseFloat(env.SPORTS_MAX_ORDER_USD ?? "0") || null,
  /** Fixed stake per order (USDC). Used when maxOrderUsd not set. */
  stakeUsd: Math.max(1, parseFloat(env.SPORTS_STAKE_USD ?? "10")),

  /** Arbitrage: min profit (e.g. 0.01 = 1%) from yes_ask + no_ask < 1 */
  arbMinProfit: Math.max(0.001, Math.min(0.1, parseFloat(env.SPORTS_ARB_MIN_PROFIT ?? "0.01"))),

  dryRun: (env.SPORTS_DRY_RUN ?? "true").toLowerCase() === "true",

  gammaUrl: (env.POLYMARKET_GAMMA_URL ?? "https://gamma-api.polymarket.com").replace(/\/$/, ""),
  clobUrl: (env.POLYMARKET_CLOB_URL ?? "https://clob.polymarket.com").replace(/\/$/, ""),
  chainId: parseInt(env.POLYMARKET_CHAIN_ID ?? "137", 10),
  privateKey: (env.POLYMARKET_PRIVATE_KEY ?? "").trim(),
  funderAddress: (env.POLYMARKET_FUNDER_ADDRESS ?? "").trim(),
  apiKey: (env.POLYMARKET_API_KEY ?? "").trim(),
  apiSecret: (env.POLYMARKET_API_SECRET ?? "").trim(),
  apiPassphrase: (env.POLYMARKET_API_PASSPHRASE ?? "").trim(),
  autoDeriveApiKey: (env.POLYMARKET_AUTO_DERIVE_API_KEY ?? "true").toLowerCase() === "true",
  signatureType: parseInt(env.POLYMARKET_SIGNATURE_TYPE ?? "0", 10),
} as const;

export function validateConfig(): string | null {
  if (!config.privateKey || !/^0x[a-fA-F0-9]{64}$/.test(config.privateKey))
    return "POLYMARKET_PRIVATE_KEY must be 0x + 64 hex";
  if (!config.funderAddress || !/^0x[a-fA-F0-9]{40}$/.test(config.funderAddress))
    return "POLYMARKET_FUNDER_ADDRESS required";
  const hasCreds = config.apiKey && config.apiSecret && config.apiPassphrase;
  if (!config.dryRun && !hasCreds && !config.autoDeriveApiKey)
    return "Set API creds or POLYMARKET_AUTO_DERIVE_API_KEY=true";
  if (config.strategy !== "value" && config.strategy !== "arbitrage")
    return "SPORTS_STRATEGY must be value or arbitrage";
  return null;
}
