import React, { useEffect, useState } from "react";
import { TrafficLights } from "./components/TrafficLights";
import { WinControls } from "./components/WinControls";
import { Sidebar } from "./components/Sidebar";
import { Overview } from "./components/Overview";
import { TradingWorkspace } from "./components/TradingWorkspace";
import { SettingsPage } from "./components/SettingsPage";
import { PositionsLogs } from "./components/PositionsLogs";
import { NavKey, STRATEGIES } from "./lib/strategies";
import { EMPTY_LIVE, LiveSnapshot, fetchLiveSnapshot, formatProfit } from "./lib/liveStore";

export default function App() {
  const [nav, setNav] = useState<NavKey>("overview");
  const [exchange, setExchange] = useState("binance");
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [password, setPassword] = useState("");
  const [dryRun, setDryRun] = useState(true);
  const [llm, setLlm] = useState({
    base_url: "",
    api_key: "",
    model_name: "",
    enabled: false,
  });
  const [running, setRunning] = useState(false);
  const [apiReady, setApiReady] = useState(false);
  const [strategyLabel, setStrategyLabel] = useState<string | undefined>();
  const [logs, setLogs] = useState("");
  const [live, setLive] = useState<LiveSnapshot>(EMPTY_LIVE);

  useEffect(() => {
    if (!window.bq) {
      setLogs((l) => l + "[浏览器预览模式] 无 Electron 桥接，策略启动不可用。请用桌面客户端。\n");
      return;
    }
    const offLog = window.bq.onLog((line) => setLogs((prev) => (prev + line).slice(-80000)));
    const offStatus = window.bq.onStatus((s) => {
      setRunning(!!s.running);
      setApiReady(!!s.apiReady);
      if (s.strategy) setStrategyLabel(s.strategy);
      if (s.dryRun !== undefined) setDryRun(!!s.dryRun);
    });
    window.bq.isRunning().then(setRunning);
    window.bq.getPaths().then((p) => {
      setLogs((l) => l + `[路径] root=${p.root}\n[Freqtrade] ${p.freqtrade}\n`);
    });
    window.bq.getSettings?.().then((s) => {
      if (!s) return;
      setExchange(s.exchange || "binance");
      setApiKey(s.apiKey || "");
      setApiSecret(s.apiSecret || "");
      setPassword(s.password || "");
      setDryRun(s.dryRun !== false);
    });
    window.bq.getLlm?.().then((c) => {
      if (!c) return;
      setLlm({
        base_url: c.base_url || "",
        api_key: c.api_key || "",
        model_name: c.model_name || "",
        enabled: !!c.enabled,
      });
    });
    return () => {
      offLog();
      offStatus();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      const snap = await fetchLiveSnapshot(running);
      if (!cancelled) {
        setLive(snap);
        if (snap.apiReady) setApiReady(true);
      }
    };
    tick();
    if (!running) return;
    const id = setInterval(tick, 1500);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [running]);

  const settings = { apiKey, apiSecret, password, exchange, dryRun };
  const pf = formatProfit(live.profit);

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
      password,
      exchange,
      pairs: opts.pairs,
      timeframe: opts.timeframe,
      dryRun,
      leverageMax: opts.leverageMax,
    });
    if (!res.ok) {
      const msg = res.error || "启动失败";
      setLogs((l) => l + `\n[错误] ${msg}\n`);
      alert(msg.includes("Freqtrade") || msg.includes("pip") ? msg : `启动失败：${msg}`);
    }
  };

  const handleStop = async () => {
    await window.bq?.stop();
    setApiReady(false);
  };

  const meta = STRATEGIES[nav];

  return (
    <div className="app-gradient flex h-full flex-col overflow-hidden rounded-window">
      <header className="drag-region relative flex h-12 shrink-0 items-center px-4">
        <TrafficLights />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-[#7EC2F5] to-[#4A9FE0]">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path d="M12 3L20 19H4L12 3Z" fill="white" />
            </svg>
          </div>
          <span className="text-sm font-semibold tracking-wide text-apple-text">量化交易套件</span>
        </div>
        <div className="ml-auto flex items-center">
          <div className="pointer-events-none mr-3 text-[10px] text-apple-muted">
            {dryRun ? "模拟盘 DRY-RUN" : "实盘 LIVE"} · {exchange} · Freqtrade
            {running ? (apiReady ? " · 已连接" : " · 启动中") : ""}
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
              apiReady={apiReady}
              strategyLabel={strategyLabel}
              dryRun={dryRun}
              exchange={exchange}
              profitLabel={pf.total}
              profitPct={pf.pct}
              openCount={live.openTrades.filter((t) => t.is_open !== false).length}
              onNavigate={(k) => setNav(k as NavKey)}
            />
          )}
          {meta && (
            <TradingWorkspace
              meta={meta}
              settings={settings}
              running={running}
              apiReady={apiReady}
              logs={logs}
              onStart={handleStart}
              onStop={handleStop}
            />
          )}
          {nav === "positions" && (
            <PositionsLogs logs={logs} running={running} apiReady={apiReady} live={live} />
          )}
          {nav === "settings" && (
            <SettingsPage
              settings={settings}
              llm={llm}
              onSettings={(p) => {
                if (p.exchange !== undefined) setExchange(p.exchange);
                if (p.apiKey !== undefined) setApiKey(p.apiKey);
                if (p.apiSecret !== undefined) setApiSecret(p.apiSecret);
                if (p.password !== undefined) setPassword(p.password);
                if (p.dryRun !== undefined) setDryRun(p.dryRun);
              }}
              onLlm={(p) => setLlm((prev) => ({ ...prev, ...p }))}
            />
          )}
        </main>
      </div>
    </div>
  );
}
