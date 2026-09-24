import React, { useState } from "react";
import { Segmented } from "./Segmented";
import type { LiveSnapshot, LiveTrade } from "../lib/liveStore";
import { formatProfit } from "../lib/liveStore";

export type BottomTab = "ticket" | "orders" | "positions" | "history" | "logs";

function TradeTable({ trades, empty }: { trades: LiveTrade[]; empty: string }) {
  if (!trades.length) {
    return <div className="flex flex-1 items-center justify-center text-sm text-apple-muted">{empty}</div>;
  }
  return (
    <div className="scroll-thin flex-1 overflow-auto">
      <table className="w-full text-left text-[11px]">
        <thead className="sticky top-0 bg-white/90 text-apple-muted">
          <tr>
            <th className="px-3 py-1.5 font-medium">交易对</th>
            <th className="px-3 py-1.5 font-medium">数量</th>
            <th className="px-3 py-1.5 font-medium">开仓价</th>
            <th className="px-3 py-1.5 font-medium">现价</th>
            <th className="px-3 py-1.5 font-medium">盈亏</th>
          </tr>
        </thead>
        <tbody>
          {trades.map((t, i) => {
            const pr = typeof t.profit_ratio === "number" ? t.profit_ratio : 0;
            const pa = typeof t.profit_abs === "number" ? t.profit_abs : 0;
            const pos = pr >= 0;
            return (
              <tr key={t.trade_id ?? i} className="border-t border-apple-line/60">
                <td className="px-3 py-1.5 font-medium text-apple-text">{t.pair}</td>
                <td className="px-3 py-1.5">{t.amount?.toFixed?.(4) ?? t.amount}</td>
                <td className="px-3 py-1.5">{t.open_rate?.toFixed?.(4) ?? "—"}</td>
                <td className="px-3 py-1.5">{t.current_rate?.toFixed?.(4) ?? t.close_rate?.toFixed?.(4) ?? "—"}</td>
                <td className={`px-3 py-1.5 font-medium ${pos ? "text-emerald-600" : "text-red-500"}`}>
                  {pa >= 0 ? "+" : ""}
                  {pa.toFixed(2)} ({(pr * 100).toFixed(2)}%)
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function BottomTicket({
  isFutures,
  dryRun,
  running,
  apiReady,
  live,
  leverage,
  onLeverage,
  logs,
  onStart,
  onStop,
}: {
  isFutures: boolean;
  dryRun: boolean;
  running: boolean;
  apiReady: boolean;
  live: LiveSnapshot;
  leverage: number;
  onLeverage: (n: number) => void;
  logs: string;
  onStart: () => void;
  onStop: () => void;
}) {
  const [tab, setTab] = useState<BottomTab>("ticket");
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const pf = formatProfit(live.profit);
  const open = live.openTrades.filter((t) => t.is_open !== false);

  return (
    <div className="flex h-[220px] shrink-0 flex-col border-t border-apple-line bg-white/70">
      <div className="flex items-center gap-1 border-b border-apple-line px-3 pt-2">
        {(
          [
            ["ticket", "策略控制"],
            ["positions", "持仓"],
            ["orders", "盈亏"],
            ["history", "状态"],
            ["logs", "机器人日志"],
          ] as [BottomTab, string][]
        ).map(([k, label]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`relative px-3 pb-2 text-xs font-medium ${
              tab === k ? "text-apple-pill" : "text-apple-muted hover:text-apple-text"
            }`}
          >
            {label}
            {tab === k && <span className="absolute bottom-0 left-3 right-3 h-[2px] rounded bg-apple-pill" />}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2 pb-2">
          {isFutures && (
            <span className="rounded-pill bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
              逐仓 Isolated
            </span>
          )}
          <span
            className={`rounded-pill px-2 py-0.5 text-[10px] font-medium ${
              dryRun ? "bg-sky-100 text-sky-700" : "bg-red-100 text-red-700"
            }`}
          >
            {dryRun ? "模拟盘 dry_run" : "实盘 LIVE"}
          </span>
          {running && (
            <span
              className={`rounded-pill px-2 py-0.5 text-[10px] font-medium ${
                apiReady ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-800"
              }`}
            >
              {apiReady ? "实时数据已连接" : "等待 api_server…"}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {tab === "ticket" && (
          <div className="flex w-full gap-4 p-3">
            <div className="w-[300px] space-y-2">
              <Segmented
                options={[
                  { value: "buy", label: isFutures ? "开多方向偏好" : "做多偏好" },
                  { value: "sell", label: isFutures ? "开空方向偏好" : "观望" },
                ]}
                value={side}
                onChange={setSide}
              />
              {isFutures && (
                <div>
                  <div className="mb-1 text-[11px] text-apple-muted">杠杆上限（策略硬顶 10×）</div>
                  <Segmented
                    options={[1, 2, 3, 5, 10].map((n) => ({ value: String(n), label: `${n}×` }))}
                    value={String(leverage)}
                    onChange={(v) => onLeverage(Number(v))}
                  />
                </div>
              )}
              <p className="text-[11px] leading-relaxed text-apple-muted">
                下单由 <b>Freqtrade 策略</b>自动执行。点下方主按钮即可启动
                {dryRun ? "模拟盘" : "实盘"}，持仓与盈亏会自动刷新。
              </p>
            </div>
            <div className="flex flex-1 flex-col justify-end gap-2">
              {!running ? (
                <button
                  onClick={onStart}
                  className="rounded-pill bg-apple-cta py-3.5 text-sm font-semibold text-white shadow-soft transition hover:bg-apple-ctaHover"
                >
                  {dryRun ? "启动模拟盘" : "启动实盘（危险）"}
                </button>
              ) : (
                <button
                  onClick={onStop}
                  className="rounded-pill bg-[#F6465D] py-3.5 text-sm font-semibold text-white shadow-soft"
                >
                  停止机器人
                </button>
              )}
              {running && apiReady && (
                <div className="text-center text-[11px] text-apple-muted">
                  开仓 {open.length} · 累计盈亏 {pf.total}（{pf.pct}）
                </div>
              )}
            </div>
          </div>
        )}
        {tab === "logs" && (
          <pre className="scroll-thin flex-1 overflow-auto p-3 font-mono text-[11px] text-apple-text whitespace-pre-wrap">
            {logs || "暂无日志。启动策略后将显示 Freqtrade 输出。"}
          </pre>
        )}
        {tab === "positions" && (
          <TradeTable
            trades={open}
            empty={
              !running
                ? "未连接模拟盘 — 请先启动策略"
                : apiReady
                  ? "暂无持仓"
                  : "等待 api_server 连接…"
            }
          />
        )}
        {tab === "orders" && (
          <div className="flex flex-1 flex-col justify-center gap-3 px-6">
            {!running || !apiReady ? (
              <div className="text-center text-sm text-apple-muted">
                {!running ? "未连接模拟盘" : "等待实时数据…"}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "已平仓盈亏", value: pf.today },
                  { label: "累计盈亏", value: pf.total },
                  { label: "收益率", value: pf.pct },
                ].map((c) => (
                  <div key={c.label} className="rounded-2xl bg-white/80 p-3 shadow-soft">
                    <div className="text-[10px] text-apple-muted">{c.label}</div>
                    <div className="mt-1 text-lg font-semibold text-apple-text">{c.value}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {tab === "history" && (
          <div className="flex flex-1 items-center justify-center p-4 text-sm text-apple-muted">
            {running
              ? apiReady
                ? `机器人运行中 · 白名单 ${(live.whitelist || []).slice(0, 4).join(", ") || "—"}`
                : "进程已启动，正在连接 api_server…"
              : "未连接模拟盘"}
          </div>
        )}
      </div>
    </div>
  );
}
