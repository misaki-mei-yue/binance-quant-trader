import React from "react";
import { SOURCE_BADGE, STRATEGIES, StrategySource } from "../lib/strategies";

const GROUPS: StrategySource[] = ["入门", "NFI", "官方示例"];

export function Overview({
  running,
  apiReady,
  strategyLabel,
  dryRun,
  exchange,
  profitLabel,
  profitPct,
  openCount,
  onNavigate,
}: {
  running: boolean;
  apiReady: boolean;
  strategyLabel?: string;
  dryRun: boolean;
  exchange: string;
  profitLabel: string;
  profitPct: string;
  openCount: number;
  onNavigate: (k: string) => void;
}) {
  const all = Object.values(STRATEGIES);

  return (
    <div className="scroll-thin h-full overflow-auto p-8">
      <div className="mb-6">
        <div className="text-xs font-medium text-[#0ECB81]">
          Freqtrade 引擎 · 默认模拟盘 · 多交易所（CCXT）
        </div>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-apple-text">量化交易套件 2.0</h1>
        <p className="mt-2 max-w-2xl text-sm text-apple-muted">
          不再使用演示假数据冒充实盘。选择策略 →「启动模拟盘」→ 持仓/盈亏经 api_server 实时刷新。
          旧版「demo mock」工作区已替换为真实机器人状态（未启动时图表会明确标注「未连接」）。
        </p>
      </div>

      <div className="mb-8 grid grid-cols-3 gap-4">
        {[
          {
            label: "模拟盈亏",
            value: running && apiReady ? profitLabel : "—",
            sub: running && apiReady ? `收益率 ${profitPct}` : dryRun ? "启动后显示" : "实盘模式",
          },
          {
            label: "持仓数",
            value: running && apiReady ? String(openCount) : "—",
            sub: running ? (apiReady ? "实时" : "连接中…") : "未连接模拟盘",
          },
          {
            label: "机器人状态",
            value: running ? (apiReady ? "运行中 · 已连接" : "启动中") : "空闲",
            sub: `${strategyLabel || exchange} · ${dryRun ? "模拟盘" : "实盘"}`,
          },
        ].map((c) => (
          <div key={c.label} className="rounded-card bg-apple-card p-5 shadow-card">
            <div className="text-xs text-apple-muted">{c.label}</div>
            <div className="mt-2 text-2xl font-semibold text-apple-text">{c.value}</div>
            <div className="mt-1 text-[11px] text-apple-muted">{c.sub}</div>
          </div>
        ))}
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => onNavigate("settings")}
          className="rounded-pill bg-apple-pill px-4 py-2 text-xs font-semibold text-white shadow-soft"
        >
          设置交易所 / 模型 API
        </button>
        <button
          onClick={() => onNavigate("spot_ma")}
          className="rounded-pill bg-white/80 px-4 py-2 text-xs font-medium text-apple-text shadow-soft ring-1 ring-apple-line"
        >
          打开均线策略 → 启动模拟盘
        </button>
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
                {g === "入门" && "本仓库模板（含 LLM / FreqAI 示例）"}
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
