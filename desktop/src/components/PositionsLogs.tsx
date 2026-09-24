import React from "react";

export function PositionsLogs({ logs, running }: { logs: string; running: boolean }) {
  return (
    <div className="flex h-full min-h-0 flex-col p-6">
      <div className="mb-4 flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-bold text-apple-text">持仓与日志</h2>
          <p className="text-sm text-apple-muted">Freqtrade 输出与运行状态</p>
        </div>
        <span
          className={`rounded-pill px-3 py-1 text-xs font-medium ${
            running ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
          }`}
        >
          {running ? "机器人运行中" : "未运行"}
        </span>
      </div>
      <div className="min-h-0 flex-1 rounded-card bg-apple-card p-4 shadow-card">
        <pre className="scroll-thin h-full overflow-auto font-mono text-[11px] leading-relaxed text-apple-text whitespace-pre-wrap">
          {logs || "尚无日志。在策略页启动机器人后，输出将出现在这里。"}
        </pre>
      </div>
    </div>
  );
}
