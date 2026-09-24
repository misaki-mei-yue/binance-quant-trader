import React, { useState } from "react";
import { Segmented } from "./Segmented";

export type BottomTab = "ticket" | "orders" | "positions" | "history" | "logs";

export function BottomTicket({
  isFutures,
  dryRun,
  running,
  leverage,
  onLeverage,
  logs,
  onStart,
  onStop,
}: {
  isFutures: boolean;
  dryRun: boolean;
  running: boolean;
  leverage: number;
  onLeverage: (n: number) => void;
  logs: string;
  onStart: () => void;
  onStop: () => void;
}) {
  const [tab, setTab] = useState<BottomTab>("ticket");
  const [side, setSide] = useState<"buy" | "sell">("buy");

  return (
    <div className="flex h-[210px] shrink-0 flex-col border-t border-apple-line bg-white/70">
      <div className="flex items-center gap-1 border-b border-apple-line px-3 pt-2">
        {(
          [
            ["ticket", "策略下单"],
            ["orders", "当前委托"],
            ["positions", "持仓"],
            ["history", "历史"],
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
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {tab === "ticket" && (
          <div className="flex w-full gap-4 p-3">
            <div className="w-[280px] space-y-2">
              <Segmented
                options={[
                  { value: "buy", label: isFutures ? "开多 / 买入" : "买入" },
                  { value: "sell", label: isFutures ? "开空 / 卖出" : "卖出" },
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
                实际下单由 <b>Freqtrade 策略</b>驱动，此处为启动控制（非手动盘口抄袭品牌）。
                {dryRun ? " 当前为模拟盘，不会真实成交。" : " 实盘有亏损风险！"}
              </p>
            </div>
            <div className="flex flex-1 flex-col justify-end gap-2">
              {!running ? (
                <button
                  onClick={onStart}
                  className="rounded-pill bg-apple-cta py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-apple-ctaHover"
                >
                  启动策略机器人
                </button>
              ) : (
                <button
                  onClick={onStop}
                  className="rounded-pill bg-[#F6465D] py-3 text-sm font-semibold text-white shadow-soft"
                >
                  停止机器人
                </button>
              )}
            </div>
          </div>
        )}
        {tab === "logs" && (
          <pre className="scroll-thin flex-1 overflow-auto p-3 font-mono text-[11px] text-apple-text whitespace-pre-wrap">
            {logs || "暂无日志。启动策略后将显示 Freqtrade 输出。"}
          </pre>
        )}
        {(tab === "orders" || tab === "positions" || tab === "history") && (
          <div className="flex flex-1 items-center justify-center text-sm text-apple-muted">
            {dryRun ? "模拟盘：委托/持仓由 Freqtrade dry-run 数据库维护，启动后见日志。" : "实盘数据将在机器人运行后展示。"}
          </div>
        )}
      </div>
    </div>
  );
}
