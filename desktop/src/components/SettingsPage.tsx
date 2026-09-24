import React, { useEffect, useState } from "react";
import { Segmented } from "./Segmented";

const EXCHANGES: { id: string; label: string; needPass?: boolean }[] = [
  { id: "binance", label: "Binance" },
  { id: "okx", label: "OKX", needPass: true },
  { id: "bybit", label: "Bybit" },
  { id: "gate", label: "Gate" },
  { id: "kucoin", label: "KuCoin", needPass: true },
  { id: "bitget", label: "Bitget", needPass: true },
  { id: "mexc", label: "MEXC" },
  { id: "htx", label: "HTX" },
];

const LLM_PRESETS: { label: string; base_url: string; model_name: string }[] = [
  { label: "DeepSeek", base_url: "https://api.deepseek.com/v1", model_name: "deepseek-chat" },
  { label: "OpenAI", base_url: "https://api.openai.com/v1", model_name: "gpt-4o-mini" },
  { label: "OpenRouter", base_url: "https://openrouter.ai/api/v1", model_name: "openai/gpt-4o-mini" },
  { label: "Ollama 本地", base_url: "http://127.0.0.1:11434/v1", model_name: "llama3.2" },
  { label: "通义 Qwen", base_url: "https://dashscope.aliyuncs.com/compatible-mode/v1", model_name: "qwen-plus" },
];

export type SettingsState = {
  exchange: string;
  apiKey: string;
  apiSecret: string;
  password: string;
  dryRun: boolean;
};

export type LlmState = {
  base_url: string;
  api_key: string;
  model_name: string;
  enabled: boolean;
};

export function SettingsPage({
  settings,
  llm,
  onSettings,
  onLlm,
}: {
  settings: SettingsState;
  llm: LlmState;
  onSettings: (p: Partial<SettingsState>) => void;
  onLlm: (p: Partial<LlmState>) => void;
}) {
  const [exMsg, setExMsg] = useState<string>("");
  const [exBusy, setExBusy] = useState(false);
  const [llmMsg, setLlmMsg] = useState<string>("");
  const [llmBusy, setLlmBusy] = useState(false);
  const [savedHint, setSavedHint] = useState("");

  const needPass = EXCHANGES.find((e) => e.id === settings.exchange)?.needPass;

  useEffect(() => {
    setExMsg("");
  }, [settings.exchange]);

  const persist = async () => {
    if (!window.bq?.saveSettings) {
      setSavedHint("浏览器预览模式：设置仅保存在当前页面内存");
      return;
    }
    await window.bq.saveSettings(settings);
    await window.bq.saveLlm?.({
      base_url: llm.base_url,
      api_key: llm.api_key,
      model_name: llm.model_name,
      enabled: llm.enabled,
    });
    setSavedHint("已保存到本地 user_data/config（不会上传）");
    setTimeout(() => setSavedHint(""), 2500);
  };

  const testEx = async () => {
    setExBusy(true);
    setExMsg("正在测试连接…");
    try {
      if (!window.bq?.testExchange) {
        setExMsg("请在桌面客户端中测试（需要本机 Python + ccxt）");
        return;
      }
      await window.bq.saveSettings(settings);
      const r = await window.bq.testExchange(settings);
      setExMsg(r.message || (r.ok ? "连接成功" : "连接失败"));
    } catch (e) {
      setExMsg(`测试异常：${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setExBusy(false);
    }
  };

  const testLlm = async () => {
    setLlmBusy(true);
    setLlmMsg("正在测通模型…");
    try {
      if (!window.bq?.testLlm) {
        setLlmMsg("请在桌面客户端中测通（需要本机 Python + openai）");
        return;
      }
      await window.bq.saveLlm?.({
        base_url: llm.base_url,
        api_key: llm.api_key,
        model_name: llm.model_name,
        enabled: true,
      });
      const r = await window.bq.testLlm({
        base_url: llm.base_url,
        api_key: llm.api_key,
        model_name: llm.model_name,
        enabled: true,
      });
      setLlmMsg(r.message || (r.ok ? "测通成功" : "测通失败"));
      if (r.ok) onLlm({ enabled: true });
    } catch (e) {
      setLlmMsg(`测通异常：${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setLlmBusy(false);
    }
  };

  return (
    <div className="scroll-thin h-full overflow-auto p-8">
      <h2 className="text-2xl font-bold text-apple-text">设置</h2>
      <p className="mt-1 text-sm text-apple-muted">
        在此完成交易所与模型配置。密钥仅保存在本机 <code className="text-[11px]">user_data/config/</code>，请勿泄露。
      </p>

      {/* Exchange card */}
      <div className="mt-6 max-w-xl space-y-4 rounded-card bg-apple-card p-6 shadow-card">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-apple-text">交易所 API</div>
          <span className="text-[10px] text-apple-muted">CCXT · 多交易所</span>
        </div>

        <label className="block">
          <div className="mb-1 text-xs text-apple-muted">选择交易所</div>
          <select
            value={settings.exchange}
            onChange={(e) => onSettings({ exchange: e.target.value })}
            className="glass-input w-full rounded-2xl px-4 py-3 text-sm outline-none"
          >
            {EXCHANGES.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.label}（{ex.id}）
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <div className="mb-1 text-xs text-apple-muted">API Key</div>
          <input
            value={settings.apiKey}
            onChange={(e) => onSettings({ apiKey: e.target.value })}
            className="glass-input w-full rounded-2xl px-4 py-3 text-sm outline-none"
            placeholder="模拟盘可留空（仅测公共行情）"
            autoComplete="off"
          />
        </label>
        <label className="block">
          <div className="mb-1 text-xs text-apple-muted">API Secret</div>
          <input
            type="password"
            value={settings.apiSecret}
            onChange={(e) => onSettings({ apiSecret: e.target.value })}
            className="glass-input w-full rounded-2xl px-4 py-3 text-sm outline-none"
            placeholder="••••••••"
            autoComplete="off"
          />
        </label>
        {needPass && (
          <label className="block">
            <div className="mb-1 text-xs text-apple-muted">Passphrase / 密码（OKX、KuCoin、Bitget 等）</div>
            <input
              type="password"
              value={settings.password}
              onChange={(e) => onSettings({ password: e.target.value })}
              className="glass-input w-full rounded-2xl px-4 py-3 text-sm outline-none"
              placeholder="交易所创建密钥时设置的口令"
              autoComplete="off"
            />
          </label>
        )}

        <div>
          <div className="mb-2 text-xs text-apple-muted">交易模式</div>
          <Segmented
            options={[
              { value: "dry", label: "模拟盘 dry_run（推荐）" },
              { value: "live", label: "实盘（危险）" },
            ]}
            value={settings.dryRun ? "dry" : "live"}
            onChange={(v) => onSettings({ dryRun: v === "dry" })}
          />
        </div>
        {!settings.dryRun && (
          <div className="rounded-2xl bg-red-50 p-3 text-xs text-red-700">
            实盘将使用真实资金。请确认 API <b>无提现权限</b>，并充分了解滑点与强平风险。启动前会再次确认。
          </div>
        )}
        {settings.dryRun && (
          <div className="rounded-2xl bg-sky-50 p-3 text-xs text-sky-800">
            当前为模拟盘：不会真实下单。策略页一键「启动模拟盘」即可看到实时盈亏与持仓。
          </div>
        )}

        <div className="flex flex-wrap gap-2 pt-1">
          <button
            type="button"
            disabled={exBusy}
            onClick={testEx}
            className="rounded-pill bg-apple-pill px-5 py-2.5 text-sm font-semibold text-white shadow-soft disabled:opacity-60"
          >
            {exBusy ? "测试中…" : "测试连接"}
          </button>
          <button
            type="button"
            onClick={persist}
            className="rounded-pill bg-white/80 px-5 py-2.5 text-sm font-medium text-apple-text shadow-soft ring-1 ring-apple-line"
          >
            保存设置
          </button>
        </div>
        {exMsg && (
          <div
            className={`rounded-2xl p-3 text-xs leading-relaxed ${
              exMsg.includes("成功") || exMsg.includes("有效") || exMsg.includes("可达")
                ? "bg-emerald-50 text-emerald-800"
                : "bg-amber-50 text-amber-900"
            }`}
          >
            {exMsg}
          </div>
        )}
      </div>

      {/* LLM card */}
      <div className="mt-6 max-w-xl space-y-4 rounded-card bg-apple-card p-6 shadow-card">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-apple-text">模型 API</div>
          <span className="text-[10px] text-apple-muted">OpenAI 兼容 · 可选</span>
        </div>
        <p className="text-[11px] leading-relaxed text-apple-muted">
          填写 Base URL + Key + 模型名即可对接 DeepSeek / OpenAI / 通义 / Ollama / OpenRouter。用于「LLM 信号」策略，不承诺收益。
        </p>

        <div className="flex flex-wrap gap-1.5">
          {LLM_PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() =>
                onLlm({
                  base_url: p.base_url,
                  model_name: p.model_name,
                })
              }
              className="rounded-pill bg-slate-100 px-3 py-1 text-[11px] font-medium text-slate-700 hover:bg-sky-100 hover:text-sky-800"
            >
              {p.label}
            </button>
          ))}
        </div>

        <label className="block">
          <div className="mb-1 text-xs text-apple-muted">Base URL</div>
          <input
            value={llm.base_url}
            onChange={(e) => onLlm({ base_url: e.target.value })}
            className="glass-input w-full rounded-2xl px-4 py-3 text-sm outline-none"
            placeholder="https://api.deepseek.com/v1"
            autoComplete="off"
          />
        </label>
        <label className="block">
          <div className="mb-1 text-xs text-apple-muted">API Key</div>
          <input
            type="password"
            value={llm.api_key}
            onChange={(e) => onLlm({ api_key: e.target.value })}
            className="glass-input w-full rounded-2xl px-4 py-3 text-sm outline-none"
            placeholder="sk-…（Ollama 可随意填写）"
            autoComplete="off"
          />
        </label>
        <label className="block">
          <div className="mb-1 text-xs text-apple-muted">模型名</div>
          <input
            value={llm.model_name}
            onChange={(e) => onLlm({ model_name: e.target.value })}
            className="glass-input w-full rounded-2xl px-4 py-3 text-sm outline-none"
            placeholder="deepseek-chat"
            autoComplete="off"
          />
        </label>

        <label className="flex items-center gap-2 text-xs text-apple-text">
          <input
            type="checkbox"
            checked={llm.enabled}
            onChange={(e) => onLlm({ enabled: e.target.checked })}
            className="rounded"
          />
          启用 LLM 网关（写入 llm.json，供 LLMSignalStrategy 调用）
        </label>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={llmBusy}
            onClick={testLlm}
            className="rounded-pill bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-soft disabled:opacity-60"
          >
            {llmBusy ? "测通中…" : "测通"}
          </button>
          <button
            type="button"
            onClick={persist}
            className="rounded-pill bg-white/80 px-5 py-2.5 text-sm font-medium text-apple-text shadow-soft ring-1 ring-apple-line"
          >
            保存设置
          </button>
        </div>
        {llmMsg && (
          <div
            className={`rounded-2xl p-3 text-xs leading-relaxed ${
              llmMsg.includes("成功") ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-900"
            }`}
          >
            {llmMsg}
          </div>
        )}
      </div>

      {savedHint && <div className="mt-4 text-xs text-emerald-700">{savedHint}</div>}
    </div>
  );
}
