import React from "react";
import type { LiveSnapshot } from "../lib/liveStore";
import { formatProfit } from "../lib/liveStore";

export function PositionsLogs({
  logs,
  running,
  apiReady,
  live,
}: {
  logs: string;
  running: boolean;
  apiReady: boolean;
  live: LiveSnapshot;
}) {
  const pf = formatProfit(live.profit);
  const open = live.openTrades.filter((t) => t.is_open !== false);

  return (
    <div className="flex h-full min-h-0 flex-col p-6">
      <div className="mb-4 flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-bold text-apple-text">持仓与日志</h2>
          <p className="text-sm text-apple-muted">实时来自 Freqtrade api_server（非 mock）</p>
        </div>
        <span
          className={`rounded-pill px-3 py-1 text-xs font-medium ${
            running
              ? apiReady
                ? "bg-emerald-100 text-emerald-700"
                : "bg-amber-100 text-amber-800"
              : "bg-slate-100 text-slate-600"
          }`}
        >
          {!running ? "未连接模拟盘" : apiReady ? "实时已连接" : "等待 api_server"}
        </span>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-3">
        {[
          { label: "累计盈亏", value: apiReady ? pf.total : "—" },
          { label: "收益率", value: apiReady ? pf.pct : "—" },
          { label: "开仓数", value: apiReady ? String(open.length) : "—" },
        ].map((c) => (
          <div key={c.label} className="rounded-2xl bg-apple-card p-4 shadow-card">
            <div className="text-[10px] text-apple-muted">{c.label}</div>
            <div className="mt-1 text-xl font-semibold text-apple-text">{c.value}</div>
          </div>
        ))}
      </div>

      <div className="mb-4 max-h-40 overflow-auto rounded-card bg-apple-card p-3 shadow-card">
        {!apiReady ? (
          <div className="py-6 text-center text-sm text-apple-muted">
            {running ? "正在连接…" : "未连接模拟盘 — 请在策略页点击「启动模拟盘」"}
          </div>
        ) : open.length === 0 ? (
          <div className="py-6 text-center text-sm text-apple-muted">暂无持仓</div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="text-apple-muted">
              <tr>
                <th className="px-2 py-1">交易对</th>
                <th className="px-2 py-1">数量</th>
                <th className="px-2 py-1">开仓价</th>
                <th className="px-2 py-1">盈亏</th>
              </tr>
            </thead>
            <tbody>
              {open.map((t, i) => (
                <tr key={t.trade_id ?? i} className="border-t border-apple-line/50">
                  <td className="px-2 py-1.5 font-medium">{t.pair}</td>
                  <td className="px-2 py-1.5">{t.amount?.toFixed?.(4) ?? t.amount}</td>
                  <td className="px-2 py-1.5">{t.open_rate?.toFixed?.(4)}</td>
                  <td className="px-2 py-1.5">
                    {typeof t.profit_abs === "number" ? t.profit_abs.toFixed(2) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="min-h-0 flex-1 rounded-card bg-apple-card p-4 shadow-card">
        <pre className="scroll-thin h-full overflow-auto font-mono text-[11px] leading-relaxed text-apple-text whitespace-pre-wrap">
          {logs || "尚无日志。在策略页启动机器人后，输出将出现在这里。"}
        </pre>
      </div>
    </div>
  );
}
