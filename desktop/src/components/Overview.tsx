import React from "react";
import { SOURCE_BADGE, STRATEGIES, StrategySource } from "../lib/strategies";

const GROUPS: StrategySource[] = ["入门", "NFI", "官方示例"];

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
  const all = Object.values(STRATEGIES);

  return (
    <div className="scroll-thin h-full overflow-auto p-8">
      <div className="mb-6">
        <div className="text-xs font-medium text-[#0ECB81]">Freqtrade · dry_run 默认开启</div>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-apple-text">币安量化交易套件</h1>
        <p className="mt-2 max-w-2xl text-sm text-apple-muted">
          Apple 风格外壳 + 类桌面交易工作区。引擎为开源 Freqtrade（GPL-3）。
          入门三套为自写模板；NFI 与官方示例为第三方社区策略（GPL-3），无收益保证，请先模拟盘/回测。
        </p>
      </div>

      <div className="mb-8 grid grid-cols-3 gap-4">
        {[
          { label: "权益（模拟）", value: "1,000.00 USDT", sub: "dry_run_wallet（NFI 默认 10000）" },
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

      {GROUPS.map((g) => {
        const badge = SOURCE_BADGE[g];
        const items = all.filter((s) => s.source === g);
        return (
          <div key={g} className="mb-8">
            <div className="mb-3 flex items-center gap-2">
              <span className={`rounded-pill px-2.5 py-0.5 text-[11px] font-semibold ${badge.bg} ${badge.text}`}>
                {badge.label}
              </span>
              <span className="text-xs text-apple-muted">
                {g === "入门" && "本仓库自写模板，仅供学习"}
                {g === "NFI" && "iterativv/NostalgiaForInfinity · GPL-3"}
                {g === "官方示例" && "freqtrade/freqtrade-strategies · GPL-3"}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {items.map((s) => (
                <button
                  key={s.key}
                  onClick={() => onNavigate(s.key)}
                  className="rounded-card bg-apple-card p-5 text-left shadow-card transition hover:-translate-y-0.5 hover:shadow-soft"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-sm font-semibold text-apple-text">{s.title}</div>
                    <span className={`shrink-0 rounded-pill px-2 py-0.5 text-[10px] font-medium ${badge.bg} ${badge.text}`}>
                      {badge.label}
                    </span>
                  </div>
                  <div className="mt-2 text-xs leading-relaxed text-apple-muted">{s.desc}</div>
                  <div className="mt-4 inline-flex rounded-pill bg-apple-pill/15 px-3 py-1 text-[11px] font-medium text-apple-pill">
                    进入工作区 →
                  </div>
                </button>
              ))}
            </div>
          </div>
        );
      })}

      <div className="mt-2 rounded-card border border-amber-200/80 bg-amber-50/80 p-4 text-xs leading-relaxed text-amber-900">
        <b>风险提示：</b>
        量化与合约交易可能导致本金亏损。默认模拟盘不会真实下单。第三方策略不保证盈利，切换实盘前请充分回测。不构成投资建议。
      </div>
    </div>
  );
}
