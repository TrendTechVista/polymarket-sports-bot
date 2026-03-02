# polymarket sports bot

TypeScript/Node bot for **sports prediction markets** on Polymarket. Implements **value betting** and **arbitrage** strategies.

## Contact me for more profitable bots
<a href="https://t.me/cashblaze129" target="_blank">
  <img src="https://img.shields.io/badge/Telegram-@Contact_Me-0088cc?style=for-the-badge&logo=telegram&logoColor=white" alt="Telegram Support" />
</a>

## Sports types supported

The bot works with **any binary sports market** on Polymarket. You choose which sport (or mix) to trade by setting **`SPORTS_TAG_ID`** to a Gamma API tag, or leave it empty to scan **all active events** (all sports).

Examples of sports you can trade (tags are listed by Polymarket; IDs may change — check `GET https://gamma-api.polymarket.com/sports`):

| Sport | Description |
|-------|-------------|
| **NBA** | Basketball: game winners, playoffs, MVP, props |
| **Soccer** | Football / soccer: match result, league winner, cups (e.g. Champions League, World Cup) |
| **NFL** | American football: game spread, totals, Super Bowl |
| **MLB** | Baseball: game winner, World Series, awards |
| **NHL** | Hockey: game winner, Stanley Cup |
| **UFC / MMA** | Fight winner, method of victory |
| **Tennis** | Grand Slams, match winner |
| **Other** | Cricket, esports, Olympics, etc. — any category Polymarket exposes via tags |

- **Single sport:** Set `SPORTS_TAG_ID` to that sport’s tag ID from `/sports`.
- **All sports:** Leave `SPORTS_TAG_ID` empty; the bot fetches all active events (any sport with binary Yes/No markets).

## Strategies (profitable logic)

### 1. Value (edge betting)

- **Idea:** Buy when the market’s **implied probability** (best ask) is **below** your **fair probability** by at least a minimum edge.
- **Logic:** Place a limit BUY at `fair - minEdge` (or one tick below best ask). You only trade when `ask < fair - edge`, so in expectation you profit if your fair value is correct.
- **Config:** `SPORTS_VALUE_MIN_EDGE` (e.g. `0.02` = 2%), optional `SPORTS_VALUE_FAIR_PROB` (default 0.5). For real edge you’d plug in your own model or external odds.
- **Best for:** When you have a view (or data) that disagrees with the market; the bot executes when the market is “cheap” vs that view.

### 2. Arbitrage

- **Idea:** In binary markets, if **best_ask_yes + best_ask_no < 1 - fee**, buying both sides locks in profit.
- **Logic:** When `askYes + askNo < 1 - SPORTS_ARB_MIN_PROFIT`, place BUY orders on both outcomes with sized stakes so total cost is below 1 per share; payout is 1 per share.
- **Best for:** Rare mispricings; often short-lived. Set `SPORTS_ARB_MIN_PROFIT` (e.g. `0.01`) to filter noise.

## Setup

```bash
cd polymarket-sports-bot
npm install
cp .env.example .env
# Edit .env: POLYMARKET_PRIVATE_KEY, POLYMARKET_FUNDER_ADDRESS, SPORTS_STRATEGY, SPORTS_TAG_ID (optional)
npm run dev
```

## Config

| Variable | Description |
|----------|-------------|
| `SPORTS_STRATEGY` | `value` or `arbitrage` |
| `SPORTS_TAG_ID` | Gamma sports tag (GET `/sports`). Empty = all active events |
| `SPORTS_VALUE_MIN_EDGE` | Min edge for value (e.g. 0.02) |
| `SPORTS_VALUE_FAIR_PROB` | Optional fair prob (0–1). Default 0.5 |
| `SPORTS_STAKE_USD` | Stake per order (USDC) |
| `SPORTS_MAX_ORDER_USD` | Cap per order (0 = no cap) |
| `SPORTS_ARB_MIN_PROFIT` | Min arb profit (e.g. 0.01) |
| `SPORTS_DRY_RUN` | If true, no real orders |

Wallet/API: same as copy-trading bot (`POLYMARKET_PRIVATE_KEY`, `POLYMARKET_FUNDER_ADDRESS`, optional API key or auto-derive).

## Discovery

- Uses **Gamma API** `GET /events?tag_id=...&active=true&closed=false` (or no tag to scan all).
- **List sports and tag IDs:** `GET https://gamma-api.polymarket.com/sports` (e.g. NBA, soccer, NFL each have a tag ID).
- Bot parses **binary markets** (two tokens: Yes/No) and runs the chosen strategy on each. Works the same for NBA, soccer, or any other sport Polymarket lists.

## Disclaimer

No strategy guarantees profit. Value betting depends on accurate fair values; arbitrage is rare and can vanish quickly. Use `SPORTS_DRY_RUN=true` first.
