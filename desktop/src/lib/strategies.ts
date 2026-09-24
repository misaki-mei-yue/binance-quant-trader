export type NavKey = "overview" | "spot_ma" | "spot_grid" | "futures" | "positions" | "settings";

export const NAV_ITEMS: { key: NavKey; label: string; icon: string }[] = [
  { key: "overview", label: "总览", icon: "layout" },
  { key: "spot_ma", label: "现货均线", icon: "trending" },
  { key: "spot_grid", label: "现货网格", icon: "grid" },
  { key: "futures", label: "合约趋势", icon: "zap" },
  { key: "positions", label: "持仓与日志", icon: "list" },
  { key: "settings", label: "设置", icon: "settings" },
];

export type StrategyMeta = {
  key: NavKey;
  mode: "spot" | "futures";
  strategy: string;
  title: string;
  desc: string;
  defaultPair: string;
  defaultTf: string;
};

export const STRATEGIES: Record<string, StrategyMeta> = {
  spot_ma: {
    key: "spot_ma",
    mode: "spot",
    strategy: "MACrossover",
    title: "现货均线交叉",
    desc: "SMA 快慢线金叉死叉 · Freqtrade MACrossover",
    defaultPair: "BTC/USDT",
    defaultTf: "15m",
  },
  spot_grid: {
    key: "spot_grid",
    mode: "spot",
    strategy: "GridSpot",
    title: "现货网格 / DCA",
    desc: "区间加仓 · Freqtrade GridSpot",
    defaultPair: "BTC/USDT",
    defaultTf: "5m",
  },
  futures: {
    key: "futures",
    mode: "futures",
    strategy: "FuturesTrendLeverage",
    title: "合约趋势杠杆",
    desc: "EMA 多空 · 杠杆默认 3× 硬顶 10×",
    defaultPair: "BTC/USDT:USDT",
    defaultTf: "15m",
  },
};

export const TIMEFRAMES = ["1m", "5m", "15m", "1h"] as const;
