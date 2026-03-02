import { getOrderBook, getTickSize, placeLimitOrder } from "../clob.js";
import { config } from "../config.js";

function bestAsk(book: Awaited<ReturnType<typeof getOrderBook>>): number | null {
  if (!book?.asks?.length) return null;
  const p = parseFloat(book.asks[0]![0]);
  return Number.isFinite(p) ? p : null;
}

/**
 * Arbitrage: for binary markets, if best_ask_yes + best_ask_no < 1 - minProfit, buy both for guaranteed profit.
 * Split stake so we spend the same on each leg and lock in profit.
 */
export async function runArbitrage(
  tokenYes: string,
  tokenNo: string,
  askYes: number,
  askNo: number,
  marketSlug: string
): Promise<{ placed: boolean; reason: string }> {
  const sum = askYes + askNo;
  const minProfit = config.arbMinProfit;
  if (sum >= 1 - minProfit) return { placed: false, reason: `sum ${sum.toFixed(3)} >= ${(1 - minProfit).toFixed(3)}` };
  const totalStake = config.stakeUsd;
  const stakeYes = (totalStake / 2) * (askYes / (askYes + askNo));
  const stakeNo = (totalStake / 2) * (askNo / (askYes + askNo));
  const sizeYes = stakeYes / askYes;
  const sizeNo = stakeNo / askNo;
  const tickYes = await getTickSize(tokenYes);
  const tickNo = await getTickSize(tokenNo);
  const round = (x: number) => Math.max(0.01, Math.round(x * 100) / 100);
  if (config.dryRun) {
    console.log(`[DRY RUN] ARB BUY Yes @ ${askYes} size=${round(sizeYes)} No @ ${askNo} size=${round(sizeNo)} slug=${marketSlug}`);
    return { placed: true, reason: "dry run" };
  }
  const [resYes, resNo] = await Promise.all([
    placeLimitOrder(tokenYes, "BUY", askYes, round(sizeYes), tickYes, false),
    placeLimitOrder(tokenNo, "BUY", askNo, round(sizeNo), tickNo, false),
  ]);
  if (resYes.error || resNo.error)
    return { placed: false, reason: [resYes.error, resNo.error].filter(Boolean).join("; ") };
  console.log(`ARB placed Yes orderID=${resYes.orderID} No orderID=${resNo.orderID} slug=${marketSlug}`);
  return { placed: true, reason: "placed" };
}

export async function findArbOpportunity(
  tokenYes: string,
  tokenNo: string,
  marketSlug: string
): Promise<{ run: boolean; askYes: number; askNo: number } | null> {
  const [bookYes, bookNo] = await Promise.all([getOrderBook(tokenYes), getOrderBook(tokenNo)]);
  const askYes = bestAsk(bookYes);
  const askNo = bestAsk(bookNo);
  if (askYes == null || askNo == null) return null;
  const minProfit = config.arbMinProfit;
  if (askYes + askNo >= 1 - minProfit) return null;
  return { run: true, askYes, askNo };
}
