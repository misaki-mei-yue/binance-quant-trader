/** Poll Freqtrade api_server via Electron IPC when bot is running. */

export type LiveTrade = {
  trade_id?: number;
  pair?: string;
  is_open?: boolean;
  amount?: number;
  stake_amount?: number;
  open_rate?: number;
  close_rate?: number;
  current_rate?: number;
  profit_abs?: number;
  profit_ratio?: number;
  open_date?: string;
  close_date?: string;
  enter_tag?: string;
  exit_reason?: string;
};

export type LiveSnapshot = {
  apiReady: boolean;
  running: boolean;
  openTrades: LiveTrade[];
  profit: Record<string, unknown> | null;
  balance: Record<string, unknown> | null;
  whitelist: string[];
  error?: string;
  updatedAt?: number;
};

export const EMPTY_LIVE: LiveSnapshot = {
  apiReady: false,
  running: false,
  openTrades: [],
  profit: null,
  balance: null,
  whitelist: [],
};

export async function fetchLiveSnapshot(running: boolean): Promise<LiveSnapshot> {
  if (!window.bq?.ftApi) {
    return { ...EMPTY_LIVE, running, error: "无 Electron 桥接" };
  }
  if (!running) {
    return { ...EMPTY_LIVE, running: false };
  }
  const meta = await window.bq.ftApi({ action: "meta" });
  if (!meta?.ok && !meta?.apiReady) {
    return { ...EMPTY_LIVE, running: true, apiReady: false, error: meta?.error || "api_server 未就绪" };
  }
  const [status, profit, balance, whitelist] = await Promise.all([
    window.bq.ftApi({ action: "status" }),
    window.bq.ftApi({ action: "profit" }),
    window.bq.ftApi({ action: "balance" }),
    window.bq.ftApi({ action: "whitelist" }),
  ]);
  const statusData = status?.data as LiveTrade[] | { trades?: LiveTrade[] } | undefined;
  const openTrades: LiveTrade[] = Array.isArray(statusData)
    ? statusData
    : Array.isArray((statusData as { trades?: LiveTrade[] } | undefined)?.trades)
      ? ((statusData as { trades: LiveTrade[] }).trades)
      : [];
  let wl: string[] = [];
  const wlData = whitelist?.data as string[] | { whitelist?: string[] } | undefined;
  if (Array.isArray(wlData)) wl = wlData;
  else if (wlData && Array.isArray(wlData.whitelist)) wl = wlData.whitelist;

  return {
    apiReady: true,
    running: true,
    openTrades,
    profit: profit?.ok ? (profit.data as Record<string, unknown>) : null,
    balance: balance?.ok ? (balance.data as Record<string, unknown>) : null,
    whitelist: wl,
    error: status?.ok ? undefined : status?.error,
    updatedAt: Date.now(),
  };
}

export function formatProfit(p: Record<string, unknown> | null): { today: string; total: string; pct: string } {
  if (!p) return { today: "—", total: "—", pct: "—" };
  const abs = p.profit_closed_coin ?? p.profit_all_coin ?? p.profit_total_abs;
  const ratio = p.profit_closed_ratio ?? p.profit_all_ratio ?? p.profit_total;
  const closed = p.profit_closed_coin;
  const fmt = (v: unknown) =>
    typeof v === "number" ? (v >= 0 ? "+" : "") + v.toFixed(2) : "—";
  const pct = typeof ratio === "number" ? `${(ratio * 100).toFixed(2)}%` : "—";
  return {
    today: fmt(closed),
    total: fmt(abs),
    pct,
  };
}
