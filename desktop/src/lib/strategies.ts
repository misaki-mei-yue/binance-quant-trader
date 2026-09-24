export type NavKey =
  | "overview"
  | "spot_ma"
  | "spot_grid"
  | "futures"
  | "llm_signal"
  | "freqai_lgbm"
  | "nfi_x6"
  | "nfi_x7"
  | "official_s001"
  | "official_s002"
  | "official_cluc"
  | "official_macd"
  | "official_bband"
  | "official_super"
  | "positions"
  | "settings";

/** 来源徽章：入门 = 本仓库模板；NFI / 官方示例 = 第三方 GPL-3 */
export type StrategySource = "入门" | "NFI" | "官方示例";

export const NAV_ITEMS: { key: NavKey; label: string; icon: string; group?: string }[] = [
  { key: "overview", label: "总览", icon: "layout" },
  { key: "spot_ma", label: "均线入门", icon: "trending", group: "入门" },
  { key: "spot_grid", label: "网格入门", icon: "grid", group: "入门" },
  { key: "futures", label: "合约入门", icon: "zap", group: "入门" },
  { key: "llm_signal", label: "LLM 信号", icon: "bot", group: "入门" },
  { key: "freqai_lgbm", label: "FreqAI", icon: "brain", group: "入门" },
  { key: "nfi_x6", label: "NFI X6", icon: "star", group: "NFI" },
  { key: "nfi_x7", label: "NFI X7", icon: "star", group: "NFI" },
  { key: "official_s001", label: "Strategy001", icon: "book", group: "官方" },
  { key: "official_s002", label: "Strategy002", icon: "book", group: "官方" },
  { key: "official_cluc", label: "BinH+Cluc", icon: "book", group: "官方" },
  { key: "official_macd", label: "MACD", icon: "book", group: "官方" },
  { key: "official_bband", label: "BBandRSI", icon: "book", group: "官方" },
  { key: "official_super", label: "Supertrend", icon: "book", group: "官方" },
  { key: "positions", label: "持仓日志", icon: "list" },
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
  source: StrategySource;
};

export const STRATEGIES: Record<string, StrategyMeta> = {
  spot_ma: {
    key: "spot_ma",
    mode: "spot",
    strategy: "MACrossover",
    title: "现货均线交叉",
    desc: "【入门示例】本仓库自写 SMA 金叉死叉模板，非社区实盘策略",
    defaultPair: "BTC/USDT",
    defaultTf: "15m",
    source: "入门",
  },
  spot_grid: {
    key: "spot_grid",
    mode: "spot",
    strategy: "GridSpot",
    title: "现货网格 / DCA",
    desc: "【入门示例】本仓库自写区间加仓模板，逻辑刻意简化",
    defaultPair: "BTC/USDT",
    defaultTf: "5m",
    source: "入门",
  },
  futures: {
    key: "futures",
    mode: "futures",
    strategy: "FuturesTrendLeverage",
    title: "合约趋势杠杆",
    desc: "【入门示例】本仓库自写 EMA 多空；杠杆默认 3× 硬顶 10×",
    defaultPair: "BTC/USDT:USDT",
    defaultTf: "15m",
    source: "入门",
  },
  llm_signal: {
    key: "llm_signal",
    mode: "spot",
    strategy: "LLMSignalStrategy",
    title: "LLM 信号策略",
    desc: "【入门】调用设置中的模型 API 生成进出场 JSON · 有硬止损与仓位帽 · 无收益保证",
    defaultPair: "BTC/USDT",
    defaultTf: "15m",
    source: "入门",
  },
  freqai_lgbm: {
    key: "freqai_lgbm",
    mode: "spot",
    strategy: "FreqaiExampleStrategy",
    title: "FreqAI LightGBM 示例",
    desc: "【入门】Freqtrade FreqAI + LightGBM · 需额外 ML 依赖与历史数据 · 学习模板",
    defaultPair: "BTC/USDT",
    defaultTf: "5m",
    source: "入门",
  },
  nfi_x6: {
    key: "nfi_x6",
    mode: "spot",
    strategy: "NostalgiaForInfinityX6",
    title: "NostalgiaForInfinity X6",
    desc: "社区热门 NFI · 建议 5m · 须 dry-run/回测 · GPL-3 · 无收益保证",
    defaultPair: "BTC/USDT",
    defaultTf: "5m",
    source: "NFI",
  },
  nfi_x7: {
    key: "nfi_x7",
    mode: "spot",
    strategy: "NostalgiaForInfinityX7",
    title: "NostalgiaForInfinity X7（可选）",
    desc: "NFI 较新版本 · 建议 5m · 第三方 GPL-3 · 请自行验证",
    defaultPair: "BTC/USDT",
    defaultTf: "5m",
    source: "NFI",
  },
  official_s001: {
    key: "official_s001",
    mode: "spot",
    strategy: "Strategy001",
    title: "Strategy001",
    desc: "freqtrade-strategies 经典指标示例 · 官方仓库 · GPL-3",
    defaultPair: "BTC/USDT",
    defaultTf: "5m",
    source: "官方示例",
  },
  official_s002: {
    key: "official_s002",
    mode: "spot",
    strategy: "Strategy002",
    title: "Strategy002",
    desc: "freqtrade-strategies 经典指标示例 · 官方仓库 · GPL-3",
    defaultPair: "BTC/USDT",
    defaultTf: "5m",
    source: "官方示例",
  },
  official_cluc: {
    key: "official_cluc",
    mode: "spot",
    strategy: "CombinedBinHAndCluc",
    title: "CombinedBinHAndCluc",
    desc: "社区常见 BinHV45 + Cluc 组合 · freqtrade-strategies · GPL-3",
    defaultPair: "BTC/USDT",
    defaultTf: "5m",
    source: "官方示例",
  },
  official_macd: {
    key: "official_macd",
    mode: "spot",
    strategy: "MACDStrategy",
    title: "MACDStrategy",
    desc: "MACD 风格 · freqtrade-strategies/berlinguyinca · GPL-3",
    defaultPair: "BTC/USDT",
    defaultTf: "5m",
    source: "官方示例",
  },
  official_bband: {
    key: "official_bband",
    mode: "spot",
    strategy: "BbandRsi",
    title: "BbandRsi",
    desc: "布林带 + RSI · freqtrade-strategies · GPL-3",
    defaultPair: "BTC/USDT",
    defaultTf: "5m",
    source: "官方示例",
  },
  official_super: {
    key: "official_super",
    mode: "spot",
    strategy: "Supertrend",
    title: "Supertrend",
    desc: "趋势 / Supertrend 突破风格 · freqtrade-strategies · GPL-3",
    defaultPair: "BTC/USDT",
    defaultTf: "5m",
    source: "官方示例",
  },
};

export const SOURCE_BADGE: Record<
  StrategySource,
  { bg: string; text: string; label: string }
> = {
  入门: { bg: "bg-slate-100", text: "text-slate-600", label: "入门" },
  NFI: { bg: "bg-violet-100", text: "text-violet-700", label: "NFI" },
  官方示例: { bg: "bg-sky-100", text: "text-sky-700", label: "官方示例" },
};

export const TIMEFRAMES = ["1m", "5m", "15m", "1h"] as const;
