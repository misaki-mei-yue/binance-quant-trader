import React, { useEffect, useState } from "react";
import { SOURCE_BADGE, StrategyMeta, TIMEFRAMES } from "../lib/strategies";
import { Candle, DepthLevel, TradeTick, displayPair, fetchDepth, fetchKlines, mockTrades } from "../lib/market";
import { PairList } from "./PairList";
import { CandleChart } from "./CandleChart";
import { OrderBook } from "./OrderBook";
import { BottomTicket } from "./BottomTicket";
import { Segmented } from "./Segmented";

export type WorkspaceSettings = {
  apiKey: string;
  apiSecret: string;
  dryRun: boolean;
};

export function TradingWorkspace({
  meta,
  settings,
  running,
  logs,
  onStart,
  onStop,
}: {
  meta: StrategyMeta;
  settings: WorkspaceSettings;
  running: boolean;
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

  useEffect(() => {
    setPair(meta.defaultPair);
    setTf(meta.defaultTf);
  }, [meta.key]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const k = await fetchKlines(pair, tf, 120);
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
      setTrades(mockTrades(d.mid));
    }, 8000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [pair, tf]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* strategy params strip — Apple style */}
      <div className="flex flex-wrap items-center gap-3 border-b border-apple-line bg-white/35 px-4 py-2.5">
        <div>
          <div className="flex items-center gap-2">
            <div className="text-sm font-semibold text-apple-text">{meta.title}</div>
            <span
              className={`rounded-pill px-2 py-0.5 text-[10px] font-medium ${SOURCE_BADGE[meta.source].bg} ${SOURCE_BADGE[meta.source].text}`}
            >
              {SOURCE_BADGE[meta.source].label}
            </span>
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
          <div className="text-[10px] text-apple-muted">
            行情源: {src === "mock" ? "本地模拟（公共 API 不可用）" : "Binance 公共"} · {displayPair(pair)}
          </div>
        </div>
      </div>

      {/* Binance-like workspace */}
      <div className="flex min-h-0 flex-1">
        <PairList mode={meta.mode} value={pair} onChange={setPair} />
        <div className="flex min-w-0 flex-1 flex-col bg-white/30 p-2">
          <div className="min-h-0 flex-1 rounded-2xl bg-white/70 p-2 shadow-soft">
            <CandleChart candles={candles} height={340} />
          </div>
        </div>
        <OrderBook bids={bids} asks={asks} trades={trades} mid={mid || candles.at(-1)?.close || 0} source={src} />
      </div>

      <BottomTicket
        isFutures={meta.mode === "futures"}
        dryRun={settings.dryRun}
        running={running}
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
