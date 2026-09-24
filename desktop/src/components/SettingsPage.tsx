import React from "react";
import { Segmented } from "./Segmented";

export function SettingsPage({
  apiKey,
  apiSecret,
  dryRun,
  onChange,
}: {
  apiKey: string;
  apiSecret: string;
  dryRun: boolean;
  onChange: (p: { apiKey?: string; apiSecret?: string; dryRun?: boolean }) => void;
}) {
  return (
    <div className="scroll-thin h-full overflow-auto p-8">
      <h2 className="text-2xl font-bold text-apple-text">设置</h2>
      <p className="mt-1 text-sm text-apple-muted">API 仅保存在本地内存/配置运行时，请勿泄露。</p>

      <div className="mt-6 max-w-lg space-y-4 rounded-card bg-apple-card p-6 shadow-card">
        <label className="block">
          <div className="mb-1 text-xs text-apple-muted">Binance API Key</div>
          <input
            value={apiKey}
            onChange={(e) => onChange({ apiKey: e.target.value })}
            className="glass-input w-full rounded-2xl px-4 py-3 text-sm outline-none"
            placeholder="模拟盘可留空"
            autoComplete="off"
          />
        </label>
        <label className="block">
          <div className="mb-1 text-xs text-apple-muted">Binance API Secret</div>
          <input
            type="password"
            value={apiSecret}
            onChange={(e) => onChange({ apiSecret: e.target.value })}
            className="glass-input w-full rounded-2xl px-4 py-3 text-sm outline-none"
            placeholder="••••••••"
            autoComplete="off"
          />
        </label>
        <div>
          <div className="mb-2 text-xs text-apple-muted">交易模式</div>
          <Segmented
            options={[
              { value: "dry", label: "模拟盘 dry_run" },
              { value: "live", label: "实盘（危险）" },
            ]}
            value={dryRun ? "dry" : "live"}
            onChange={(v) => onChange({ dryRun: v === "dry" })}
          />
        </div>
        {!dryRun && (
          <div className="rounded-2xl bg-red-50 p-3 text-xs text-red-700">
            实盘将使用真实资金。请确认 API 无提现权限，并充分了解强平与滑点风险。
          </div>
        )}
      </div>
    </div>
  );
}
