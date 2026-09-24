/** Public/mock market helpers — always label source; never pretend mock is live */

export type Candle = { time: number; open: number; high: number; low: number; close: number; volume: number };
export type DepthLevel = { price: number; qty: number; total: number };
export type TradeTick = { id: string; price: number; qty: number; side: "buy" | "sell"; time: string };
export type MarketSource = "binance" | "okx" | "bybit" | "mock" | "freqtrade";

const PAIRS_SPOT = ["BTC/USDT", "ETH/USDT", "BNB/USDT", "SOL/USDT", "XRP/USDT", "DOGE/USDT", "ADA/USDT", "AVAX/USDT"];
const PAIRS_FUTURES = ["BTC/USDT:USDT", "ETH/USDT:USDT", "BNB/USDT:USDT", "SOL/USDT:USDT"];

export function pairList(mode: "spot" | "futures") {
  return mode === "futures" ? PAIRS_FUTURES : PAIRS_SPOT;
}

export function displayPair(p: string) {
  return p.replace(":USDT", "").replace("/", "");
}

export function sourceLabel(src: MarketSource | string): string {
  switch (src) {
    case "binance":
      return "Binance 公共行情";
    case "okx":
      return "OKX 公共行情";
    case "bybit":
      return "Bybit 公共行情";
    case "freqtrade":
      return "Freqtrade 机器人";
    case "mock":
    default:
      return "未连接 · 本地示意（非实盘行情）";
  }
}

/** Generate deterministic mock OHLCV — clearly labeled as mock by callers */
export function mockCandles(pair: string, count = 120, timeframeMin = 15): Candle[] {
  let seed = 0;
  for (let i = 0; i < pair.length; i++) seed += pair.charCodeAt(i);
  const base = pair.includes("BTC") ? 64000 : pair.includes("ETH") ? 3200 : 500;
  const now = Math.floor(Date.now() / 1000);
  const step = timeframeMin * 60;
  const out: Candle[] = [];
  let price = base * (1 + ((seed % 100) - 50) / 1000);
  for (let i = count; i >= 0; i--) {
    const t = now - i * step;
    const drift = Math.sin((seed + i) / 9) * 0.004 + Math.cos((seed + i) / 17) * 0.002;
    const open = price;
    const close = open * (1 + drift);
    const high = Math.max(open, close) * (1 + Math.abs(Math.sin(i + seed)) * 0.002);
    const low = Math.min(open, close) * (1 - Math.abs(Math.cos(i + seed)) * 0.002);
    const volume = Math.abs(Math.sin(i * 0.7 + seed)) * 50 + 10;
    out.push({ time: t as number, open, high, low, close, volume });
    price = close;
  }
  return out;
}

export function mockDepth(mid: number): { bids: DepthLevel[]; asks: DepthLevel[] } {
  const bids: DepthLevel[] = [];
  const asks: DepthLevel[] = [];
  let bt = 0;
  let at = 0;
  for (let i = 1; i <= 14; i++) {
    const bq = Math.random() * 2 + 0.1;
    const aq = Math.random() * 2 + 0.1;
    bt += bq;
    at += aq;
    bids.push({ price: mid * (1 - i * 0.0004), qty: bq, total: bt });
    asks.push({ price: mid * (1 + i * 0.0004), qty: aq, total: at });
  }
  return { bids, asks };
}

export function mockTrades(mid: number, n = 20): TradeTick[] {
  const trades: TradeTick[] = [];
  for (let i = 0; i < n; i++) {
    const side = Math.random() > 0.5 ? "buy" : "sell";
    const px = mid * (1 + (Math.random() - 0.5) * 0.001);
    const d = new Date(Date.now() - i * 4000);
    trades.push({
      id: `${i}`,
      price: px,
      qty: Math.random() * 0.5 + 0.01,
      side,
      time: d.toLocaleTimeString("zh-CN", { hour12: false }),
    });
  }
  return trades;
}

function tfMinutes(interval: string): number {
  if (interval.endsWith("h")) return parseInt(interval) * 60;
  if (interval.endsWith("m")) return parseInt(interval);
  return 15;
}

/** Public klines — try Binance then OKX; fall back to labeled mock */
export async function fetchKlines(
  pair: string,
  interval = "15m",
  limit = 120,
  preferExchange = "binance"
): Promise<{ candles: Candle[]; source: MarketSource }> {
  const symbol = displayPair(pair.includes(":") ? pair.split(":")[0] : pair);
  const attempts: { src: MarketSource; url: string; map: (raw: unknown) => Candle[] }[] = [
    {
      src: "binance",
      url: `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`,
      map: (raw) =>
        (raw as (string | number)[][]).map((k) => ({
          time: Math.floor(Number(k[0]) / 1000),
          open: Number(k[1]),
          high: Number(k[2]),
          low: Number(k[3]),
          close: Number(k[4]),
          volume: Number(k[5]),
        })),
    },
    {
      src: "okx",
      url: `https://www.okx.com/api/v5/market/candles?instId=${symbol.replace("USDT", "-USDT")}&bar=${interval}&limit=${limit}`,
      map: (raw) => {
        const arr = (raw as { data?: string[][] }).data || [];
        return [...arr]
          .reverse()
          .map((k) => ({
            time: Math.floor(Number(k[0]) / 1000),
            open: Number(k[1]),
            high: Number(k[2]),
            low: Number(k[3]),
            close: Number(k[4]),
            volume: Number(k[5]),
          }));
      },
    },
  ];
  if (preferExchange === "okx") attempts.reverse();

  for (const a of attempts) {
    try {
      const res = await fetch(a.url);
      if (!res.ok) continue;
      const raw = await res.json();
      const candles = a.map(raw);
      if (candles.length) return { candles, source: a.src };
    } catch {
      /* try next */
    }
  }
  return { candles: mockCandles(pair, limit, tfMinutes(interval)), source: "mock" };
}

export async function fetchDepth(
  pair: string
): Promise<{ bids: DepthLevel[]; asks: DepthLevel[]; source: MarketSource; mid: number }> {
  const symbol = displayPair(pair.includes(":") ? pair.split(":")[0] : pair);
  try {
    const res = await fetch(`https://api.binance.com/api/v3/depth?symbol=${symbol}&limit=14`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const raw = await res.json();
    let bt = 0;
    let at = 0;
    const bids = raw.bids.map(([p, q]: string[]) => {
      bt += Number(q);
      return { price: Number(p), qty: Number(q), total: bt };
    });
    const asks = raw.asks.map(([p, q]: string[]) => {
      at += Number(q);
      return { price: Number(p), qty: Number(q), total: at };
    });
    const mid = (bids[0].price + asks[0].price) / 2;
    return { bids, asks, source: "binance", mid };
  } catch {
    const candles = mockCandles(pair, 2);
    const mid = candles[candles.length - 1].close;
    const d = mockDepth(mid);
    return { ...d, source: "mock", mid };
  }
}

/** Prefer Freqtrade pair_candles when bot api is ready */
export async function fetchKlinesPreferBot(
  pair: string,
  interval: string,
  limit: number,
  apiReady: boolean,
  preferExchange = "binance"
): Promise<{ candles: Candle[]; source: MarketSource }> {
  if (apiReady && window.bq?.ftApi) {
    try {
      const r = await window.bq.ftApi({ action: "pair_candles", pair, timeframe: interval, limit });
      const raw = r?.data as { data?: (string | number)[][]; columns?: string[] } | undefined;
      if (r?.ok && raw) {
        // Freqtrade returns { columns, data } or array of candles depending on version
        let candles: Candle[] = [];
        if (Array.isArray(raw) && raw.length && typeof (raw as unknown[])[0] === "object") {
          candles = (raw as Record<string, number>[]).map((k) => ({
            time: Math.floor(Number(k.date || k.time || 0) / (String(k.date).length > 12 ? 1000 : 1)),
            open: Number(k.open),
            high: Number(k.high),
            low: Number(k.low),
            close: Number(k.close),
            volume: Number(k.volume || 0),
          }));
        } else if (raw.data && raw.columns) {
          const cols = raw.columns;
          const iDate = cols.indexOf("date");
          const iO = cols.indexOf("open");
          const iH = cols.indexOf("high");
          const iL = cols.indexOf("low");
          const iC = cols.indexOf("close");
          const iV = cols.indexOf("volume");
          candles = raw.data.map((row) => {
            const d = Number(row[iDate]);
            return {
              time: Math.floor(d > 1e12 ? d / 1000 : d),
              open: Number(row[iO]),
              high: Number(row[iH]),
              low: Number(row[iL]),
              close: Number(row[iC]),
              volume: Number(row[iV] || 0),
            };
          });
        }
        if (candles.length) return { candles, source: "freqtrade" };
      }
    } catch {
      /* fall through */
    }
  }
  return fetchKlines(pair, interval, limit, preferExchange);
}
