import React, { useEffect, useState } from "react";
import { TrafficLights } from "./components/TrafficLights";
import { WinControls } from "./components/WinControls";
import { Sidebar } from "./components/Sidebar";
import { Overview } from "./components/Overview";
import { TradingWorkspace } from "./components/TradingWorkspace";
import { SettingsPage } from "./components/SettingsPage";
import { PositionsLogs } from "./components/PositionsLogs";
import { NavKey, STRATEGIES } from "./lib/strategies";

export default function App() {
  const [nav, setNav] = useState<NavKey>("overview");
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [dryRun, setDryRun] = useState(true);
  const [running, setRunning] = useState(false);
  const [strategyLabel, setStrategyLabel] = useState<string | undefined>();
  const [logs, setLogs] = useState("");

  useEffect(() => {
    if (!window.bq) {
      setLogs((l) => l + "[浏览器预览模式] 无 Electron 桥接，策略启动不可用。请用桌面客户端。\n");
      return;
    }
    const offLog = window.bq.onLog((line) => setLogs((prev) => (prev + line).slice(-80000)));
    const offStatus = window.bq.onStatus((s) => {
      setRunning(!!s.running);
      if (s.strategy) setStrategyLabel(s.strategy);
    });
    window.bq.isRunning().then(setRunning);
    window.bq.getPaths().then((p) => {
      setLogs((l) => l + `[路径] root=${p.root}\n[Freqtrade] ${p.freqtrade}\n`);
    });
    return () => {
      offLog();
      offStatus();
    };
  }, []);

  const settings = { apiKey, apiSecret, dryRun };

  const handleStart = async (opts: {
    strategyKey: string;
    pairs: string[];
    timeframe: string;
    leverageMax: number;
  }) => {
    if (!dryRun) {
      const ok = window.confirm("确认关闭模拟盘并以实盘启动？可能导致真实亏损。");
      if (!ok) return;
    }
    if (!window.bq) {
      alert("请在 Electron 桌面端运行");
      return;
    }
    const res = await window.bq.start({
      strategyKey: opts.strategyKey,
      apiKey,
      apiSecret,
      pairs: opts.pairs,
      timeframe: opts.timeframe,
      dryRun,
      leverageMax: opts.leverageMax,
    });
    if (!res.ok) {
      setLogs((l) => l + `\n[错误] ${res.error}\n`);
      alert(res.error || "启动失败");
    }
  };

  const handleStop = async () => {
    await window.bq?.stop();
  };

  const meta = STRATEGIES[nav];

  return (
    <div className="app-gradient flex h-full flex-col overflow-hidden rounded-window">
      {/* Apple titlebar */}
      <header className="drag-region relative flex h-12 shrink-0 items-center px-4">
        <TrafficLights />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-[#7EC2F5] to-[#4A9FE0]">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path d="M12 3L20 19H4L12 3Z" fill="white" />
            </svg>
          </div>
          <span className="text-sm font-semibold tracking-wide text-apple-text">币安量化交易套件</span>
        </div>
        <div className="ml-auto flex items-center">
          <div className="pointer-events-none mr-3 text-[10px] text-apple-muted">
            {dryRun ? "DRY-RUN" : "LIVE"} · Freqtrade
          </div>
          <WinControls />
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <Sidebar active={nav} onChange={setNav} />
        <main className="min-w-0 flex-1">
          {nav === "overview" && (
            <Overview
              running={running}
              strategyLabel={strategyLabel}
              dryRun={dryRun}
              onNavigate={(k) => setNav(k as NavKey)}
            />
          )}
          {meta && (
            <TradingWorkspace
              meta={meta}
              settings={settings}
              running={running}
              logs={logs}
              onStart={handleStart}
              onStop={handleStop}
            />
          )}
          {nav === "positions" && <PositionsLogs logs={logs} running={running} />}
          {nav === "settings" && (
            <SettingsPage
              apiKey={apiKey}
              apiSecret={apiSecret}
              dryRun={dryRun}
              onChange={(p) => {
                if (p.apiKey !== undefined) setApiKey(p.apiKey);
                if (p.apiSecret !== undefined) setApiSecret(p.apiSecret);
                if (p.dryRun !== undefined) setDryRun(p.dryRun);
              }}
            />
          )}
        </main>
      </div>
    </div>
  );
}
