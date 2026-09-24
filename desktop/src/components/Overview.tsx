import React from "react";
import { STRATEGIES } from "../lib/strategies";

export function Overview({
  running,
  strategyLabel,
  dryRun,
  onNavigate,
}: {
  running: boolean;
  strategyLabel?: string;
  dryRun: boolean;
  onNavigate: (k: string) => void;
}) {
  return (
    <div className="scroll-thin h-full overflow-auto p-8">
      <div className="mb-6">
        <div className="text-xs font-medium text-[#0ECB81]">Freqtrade · dry_run 默认开启</div>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-apple-text">币安量化交易套件</h1>
        <p className="mt-2 max-w-xl text-sm text-apple-muted">
          Apple 风格外壳 + 类桌面交易工作区。引擎为开源 Freqtrade（GPL-3），本仓库提供策略与配置，不自研撮合。
        </p>
      </div>

      <div className="mb-8 grid grid-cols-3 gap-4">
        {[
          { label: "权益（模拟）", value: "1,000.00 USDT", sub: "dry_run_wallet" },
          { label: "今日盈亏", value: "—", sub: running ? "运行中统计见日志" : "未启动" },
          {
            label: "机器人状态",
            value: running ? "运行中" : "空闲",
            sub: strategyLabel || (dryRun ? "模拟盘" : "实盘"),
          },
        ].map((c) => (
          <div key={c.label} className="rounded-card bg-apple-card p-5 shadow-card">
            <div className="text-xs text-apple-muted">{c.label}</div>
            <div className="mt-2 text-2xl font-semibold text-apple-text">{c.value}</div>
            <div className="mt-1 text-[11px] text-apple-muted">{c.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {Object.values(STRATEGIES).map((s) => (
          <button
            key={s.key}
            onClick={() => onNavigate(s.key)}
            className="rounded-card bg-apple-card p-5 text-left shadow-card transition hover:-translate-y-0.5 hover:shadow-soft"
          >
            <div className="text-sm font-semibold text-apple-text">{s.title}</div>
            <div className="mt-2 text-xs leading-relaxed text-apple-muted">{s.desc}</div>
            <div className="mt-4 inline-flex rounded-pill bg-apple-pill/15 px-3 py-1 text-[11px] font-medium text-apple-pill">
              进入工作区 →
            </div>
          </button>
        ))}
      </div>

      <div className="mt-8 rounded-card border border-amber-200/80 bg-amber-50/80 p-4 text-xs leading-relaxed text-amber-900">
        <b>风险提示：</b>
        量化与合约交易可能导致本金亏损。默认模拟盘不会真实下单。切换实盘前请充分测试。不构成投资建议。界面布局仅作体验参考，未使用任何交易所注册商标。
      </div>
    </div>
  );
}
