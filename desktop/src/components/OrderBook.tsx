import React from "react";
import type { DepthLevel, TradeTick } from "../lib/market";

function Row({
  side,
  level,
  maxTotal,
}: {
  side: "bid" | "ask";
  level: DepthLevel;
  maxTotal: number;
}) {
  const pct = Math.min(100, (level.total / maxTotal) * 100);
  const bg = side === "bid" ? "rgba(14,203,129,0.15)" : "rgba(246,70,93,0.15)";
  const color = side === "bid" ? "#0ECB81" : "#F6465D";
  return (
    <div className="relative grid grid-cols-3 gap-1 px-2 py-[3px] text-[11px] font-mono">
      <div className="absolute inset-y-0 right-0" style={{ width: `${pct}%`, background: bg }} />
      <span style={{ color }} className="relative z-[1]">
        {level.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
      </span>
      <span className="relative z-[1] text-right text-apple-text">{level.qty.toFixed(4)}</span>
      <span className="relative z-[1] text-right text-apple-muted">{level.total.toFixed(3)}</span>
    </div>
  );
}

export function OrderBook({
  bids,
  asks,
  trades,
  mid,
  source,
}: {
  bids: DepthLevel[];
  asks: DepthLevel[];
  trades: TradeTick[];
  mid: number;
  source: string;
}) {
  const maxTotal = Math.max(...bids.map((b) => b.total), ...asks.map((a) => a.total), 1);
  return (
    <div className="flex h-full w-[220px] shrink-0 flex-col border-l border-apple-line bg-white/50">
      <div className="flex items-center justify-between border-b border-apple-line px-2 py-1.5">
        <span className="text-xs font-semibold text-apple-text">订单簿</span>
        <span className="rounded-pill bg-apple-bg px-2 py-0.5 text-[10px] text-apple-muted">
          {source === "mock" ? "模拟深度" : "公共深度"}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-1 px-2 py-1 text-[10px] text-apple-muted">
        <span>价格</span>
        <span className="text-right">数量</span>
        <span className="text-right">累计</span>
      </div>
      <div className="flex-1 overflow-hidden">
        <div className="flex flex-col-reverse">
          {asks
            .slice()
            .reverse()
            .map((a) => (
              <Row key={`a-${a.price}`} side="ask" level={a} maxTotal={maxTotal} />
            ))}
        </div>
        <div className="my-1 border-y border-apple-line bg-white/70 px-2 py-1 text-center text-sm font-semibold text-apple-text">
          {mid.toLocaleString(undefined, { maximumFractionDigits: 2 })}
        </div>
        <div>
          {bids.map((b) => (
            <Row key={`b-${b.price}`} side="bid" level={b} maxTotal={maxTotal} />
          ))}
        </div>
      </div>
      <div className="border-t border-apple-line">
        <div className="px-2 py-1 text-[10px] font-semibold text-apple-muted">最新成交</div>
        <div className="scroll-thin max-h-[120px] overflow-y-auto">
          {trades.map((t) => (
            <div key={t.id} className="grid grid-cols-3 px-2 py-[2px] font-mono text-[10px]">
              <span style={{ color: t.side === "buy" ? "#0ECB81" : "#F6465D" }}>
                {t.price.toFixed(2)}
              </span>
              <span className="text-right text-apple-text">{t.qty.toFixed(4)}</span>
              <span className="text-right text-apple-muted">{t.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
