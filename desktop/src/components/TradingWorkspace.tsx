import React, { useEffect, useState } from "react";
import { SOURCE_BADGE, StrategyMeta, TIMEFRAMES } from "../lib/strategies";
import {
  Candle,
  DepthLevel,
  TradeTick,
  displayPair,
  fetchDepth,
  fetchKlinesPreferBot,
  mockTrades,
  sourceLabel,
} from "../lib/market";
import { EMPTY_LIVE, LiveSnapshot, fetchLiveSnapshot } from "../lib/liveStore";
import { PairList } from "./PairList";
import { CandleChart } from "./CandleChart";
import { OrderBook } from "./OrderBook";
import { BottomTicket } from "./BottomTicket";
import { Segmented } from "./Segmented";

export type WorkspaceSettings = {
  apiKey: string;
  apiSecret: string;
  password: string;
  exchange: string;
  dryRun: boolean;
};

export function TradingWorkspace({
  meta,
  settings,
  running,
  apiReady,
  logs,
  onStart,
  onStop,
}: {
  meta: StrategyMeta;
  settings: WorkspaceSettings;
  running: boolean;
  apiReady: boolean;
  logs: string;
  onStart: (opts: {
    strategyKey: string;
    pairs: string[];
    timeframe: string;
    leverageMax: number;
  }) => void;
  onStop: () => void;
}) {
  const [pair, setPair] = useState(meta.defaultPair);
  const [tf, setTf] = useState(meta.defaultTf);
  const [leverage, setLeverage] = useState(3);
  const [candles, setCandles] = useState<Candle[]>([]);
  const [bids, setBids] = useState<DepthLevel[]>([]);
  const [asks, setAsks] = useState<DepthLevel[]>([]);
  const [trades, setTrades] = useState<TradeTick[]>([]);
  const [mid, setMid] = useState(0);
  const [src, setSrc] = useState("mock");
  const [fastMa, setFastMa] = useState(10);
  const [slowMa, setSlowMa] = useState(30);
  const [live, setLive] = useState<LiveSnapshot>(EMPTY_LIVE);

  useEffect(() => {
    setPair(meta.defaultPair);
    setTf(meta.defaultTf);
  }, [meta.key]);

  // Market data
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const k = await fetchKlinesPreferBot(pair, tf, 120, apiReady, settings.exchange);
      const d = await fetchDepth(pair);
      if (cancelled) return;
      setCandles(k.candles);
      setSrc(k.source);
      setBids(d.bids);
      setAsks(d.asks);
      setMid(d.mid);
      setTrades(mockTrades(d.mid));
    })();
    const id = setInterval(async () => {
      const d = await fetchDepth(pair);
      if (cancelled) return;
      setBids(d.bids);
      setAsks(d.asks);
      setMid(d.mid);
      if (!apiReady) setTrades(mockTrades(d.mid));
    }, 8000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [pair, tf, apiReady, settings.exchange]);

  // Live bot poll
  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      const snap = await fetchLiveSnapshot(running);
      if (!cancelled) setLive(snap);
    };
    tick();
    if (!running) return;
    const id = setInterval(tick, 1500);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [running, apiReady]);

  const connected = running && (apiReady || live.apiReady);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex flex-wrap items-center gap-3 border-b border-apple-line bg-white/35 px-4 py-2.5">
        <div>
          <div className="flex items-center gap-2">
            <div className="text-sm font-semibold text-apple-text">{meta.title}</div>
            <span
              className={`rounded-pill px-2 py-0.5 text-[10px] font-medium ${SOURCE_BADGE[meta.source].bg} ${SOURCE_BADGE[meta.source].text}`}
            >
              {SOURCE_BADGE[meta.source].label}
            </span>
            {settings.dryRun ? (
              <span className="rounded-pill bg-sky-100 px-2 py-0.5 text-[10px] font-medium text-sky-700">模拟盘</span>
            ) : (
              <span className="rounded-pill bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-700">实盘</span>
            )}
          </div>
          <div className="text-[11px] text-apple-muted">{meta.desc}</div>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-3">
          <div className="w-[220px]">
            <div className="mb-1 text-[10px] text-apple-muted">K 线周期</div>
            <Segmented
              options={TIMEFRAMES.map((t) => ({ value: t, label: t }))}
              value={tf as (typeof TIMEFRAMES)[number]}
              onChange={(v) => setTf(v)}
            />
          </div>
          {meta.key === "spot_ma" && (
            <div className="flex gap-2 text-xs text-apple-muted">
              <label className="flex items-center gap-1">
                快线
                <input
                  type="number"
                  value={fastMa}
                  onChange={(e) => setFastMa(Number(e.target.value))}
                  className="glass-input w-14 rounded-lg px-2 py-1 text-apple-text"
                />
              </label>
              <label className="flex items-center gap-1">
                慢线
                <input
                  type="number"
                  value={slowMa}
                  onChange={(e) => setSlowMa(Number(e.target.value))}
                  className="glass-input w-14 rounded-lg px-2 py-1 text-apple-text"
                />
              </label>
            </div>
          )}
          <div
            className={`rounded-pill px-2.5 py-1 text-[10px] font-medium ${
              src === "mock" ? "bg-amber-100 text-amber-900" : "bg-emerald-50 text-emerald-800"
            }`}
          >
            行情：{sourceLabel(src)} · {displayPair(pair)} · {settings.exchange}
          </div>
        </div>
      </div>

      {!connected && (
        <div className="border-b border-amber-200/80 bg-amber-50/90 px-4 py-1.5 text-[11px] text-amber-900">
          {running
            ? "机器人进程已启动，正在连接 api_server… 持仓/盈亏稍后自动出现。"
            : "未连接模拟盘 — 下方图表若标注「未连接」则为本地示意，不是实盘行情。选择参数后点「启动模拟盘」。"}
        </div>
      )}

      <div className="flex min-h-0 flex-1">
        <PairList mode={meta.mode} value={pair} onChange={setPair} />
        <div className="flex min-w-0 flex-1 flex-col bg-white/30 p-2">
          <div className="min-h-0 flex-1 rounded-2xl bg-white/70 p-2 shadow-soft">
            <CandleChart candles={candles} height={320} />
          </div>
        </div>
        <OrderBook bids={bids} asks={asks} trades={trades} mid={mid || candles.at(-1)?.close || 0} source={src} />
      </div>

      <BottomTicket
        isFutures={meta.mode === "futures"}
        dryRun={settings.dryRun}
        running={running}
        apiReady={apiReady || live.apiReady}
        live={live}
        leverage={leverage}
        onLeverage={setLeverage}
        logs={logs}
        onStart={() =>
          onStart({
            strategyKey: meta.key,
            pairs: [pair],
            timeframe: tf,
            leverageMax: leverage,
          })
        }
        onStop={onStop}
      />
    </div>
  );
}
