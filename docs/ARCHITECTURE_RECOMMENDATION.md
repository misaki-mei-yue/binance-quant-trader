# Architecture Recommendation: Serious Multi-Exchange Quant Desktop

**Date:** 2026-09-24 (CST)  
**Repo:** `misaki-mei-yue/binance-quant-trader` (Freqtrade + Electron v1.1.0)  
**Goal:** Stop feeling like a "toy"; maximize reuse of mature OSS; ship Windows `setup.exe`.

---

## 0. Why it feels like a toy today (root cause)

Current Electron bridge (`desktop/electron/main.cjs`):

- `spawn(freqtrade trade …)` only
- UI gets **stdout logs** via IPC (`ft:log` / `ft:status`)
- Config has `"api_server": { "enabled": false }`
- Charts / order book / positions are **not** bound to live bot state

**Fix is not replacing Freqtrade.** Fix is wiring the **existing** Freqtrade REST + WebSocket into the UI, then layer FreqAI + LLM gateway.

---

## 1. Framework comparison (researched 2026-09)

| Project | Stars | License | Role | Fit for this product |
|--------|------:|---------|------|----------------------|
| [freqtrade/freqtrade](https://github.com/freqtrade/freqtrade) | **54.7k** | **GPL-3.0** | Spot/futures bot, dry-run, backtest, CCXT, REST/WS, FreqAI | **KEEP as engine** |
| [freqtrade/frequi](https://github.com/freqtrade/frequi) | 1.1k | GPL-3.0 | Official Vue UI over same API | **Reference / optional embed**; do not discard custom Apple UI |
| [ccxt/ccxt](https://github.com/ccxt/ccxt) | **44.1k** | MIT | 100+ exchange unified API | Already via Freqtrade; use same for UI market data |
| [BerriAI/litellm](https://github.com/BerriAI/litellm) | **59.5k** | MIT core (+ enterprise extras) | OpenAI-compatible multi-LLM SDK/proxy | **LLM gateway** (SDK in-process preferred) |
| [HKUDS/Vibe-Trading](https://github.com/HKUDS/Vibe-Trading) | **34.0k** | MIT | Electron + LLM agent + CCXT | **Inspiration only** (agent UX, LLM key UI); do not swap engines |
| [nautechsystems/nautilus_trader](https://github.com/nautechsystems/nautilus_trader) | **29.3k** | LGPL-3.0 | Rust event engine, research↔live parity | Later optional HFT path; **too heavy for Phase 1** |
| [hummingbot/hummingbot](https://github.com/hummingbot/hummingbot) | **20.2k** | Apache-2.0 | Market making / DEX+CEX | Wrong product shape (MM, not discretionary strat UI) |
| [jesse-ai/jesse](https://github.com/jesse-ai/jesse) | **8.6k** | MIT | Strict backtest + ML + JesseGPT | Research companion later; weaker live+desktop story |
| [Drakkar-Software/OctoBot](https://github.com/Drakkar-Software/OctoBot) | **6.6k** | GPL-3.0 | GUI-first multi-strategy | Parallel product; switching loses NFI + current UI investment |
| [Open-Trader/opentrader](https://github.com/Open-Trader/opentrader) | **2.9k** | Apache-2.0 | TS bot + web UI, CCXT, DCA/GRID | UI patterns only; smaller community |
| OpenRouter | SaaS | Commercial | Hosted OpenAI-compatible multi-model | Optional **provider**, not vendored code |

### Verdict: **Keep Freqtrade. Do not rewrite the engine.**

Reasons:

1. Already vendored strategies (NFI X6/X7, official examples) are Freqtrade `IStrategy`.
2. Dry-run / live / backtest / CCXT / FreqAI already exist.
3. REST + Message WebSocket already exist — current app simply does not use them.
4. Repo is already **GPL-3** (compatible with Freqtrade). Switching to MIT engines would force strategy rewrite and license rethink for little gain.

**When to revisit Nautilus:** if you later need sub-second HFT / deterministic tick sim. Not needed for “serious paper-trading desktop”.

---

## 2. Concrete architecture (maximize reuse)

```
┌─────────────────────────────────────────────────────────────┐
│  Electron shell (keep Apple UI)                             │
│  React + lightweight-charts                                 │
│  · Settings: exchange keys, dry_run, LLM baseURL+key        │
│  · Strategy click → start bot                               │
│  · Live panels: positions, trades, PnL, candles, markers    │
└───────────────┬─────────────────────────────┬───────────────┘
                │ IPC                         │ HTTP/WS (localhost)
                ▼                             ▼
┌──────────────────────────┐    ┌─────────────────────────────────┐
│  main.cjs process mgr    │    │  Freqtrade api_server           │
│  spawn/kill ftProc       │───▶│  REST /api/v1/*                 │
│  write _runtime_config   │    │  WS  /api/v1/message/ws?token=  │
│  inject api_server+ws    │    │  dry_run paper fills            │
└──────────────────────────┘    └──────────────┬──────────────────┘
                                               │ CCXT
                                               ▼
                                    Exchanges (Binance, OKX, …)

Optional sidecar (same Python venv):
┌─────────────────────────────────┐
│  LLM assist service (FastAPI)   │  litellm.completion()
│  POST /assist/strategy|signal   │  OpenAI-compatible base_url
│  stores keys in OS keychain /   │  + OpenRouter / DeepSeek / …
│  encrypted local config         │
└─────────────────────────────────┘

Classical ML (no new engine):
  FreqAI inside same Freqtrade process (--freqaimodel LightGBMRegressor …)
```

### 2.1 Keep or replace Freqtrade?

| Decision | Detail |
|----------|--------|
| **KEEP** | Trading engine, dry_run wallet, strategy loader, CCXT exchange layer, backtest |
| **KEEP** | Electron + React Apple shell + NSIS packaging |
| **ADD** | Live bridge: enable `api_server` + consume REST/WS in renderer |
| **ADD** | FreqAI deps + example strategy + UI toggle |
| **ADD** | LiteLLM-based OpenAI-compatible model settings + assist panel |
| **DO NOT** | Replace with Hummingbot / OctoBot / Jesse as primary engine |
| **DO NOT** | Reimplement order matching / exchange adapters |

### 2.2 Real-time paper trading → Electron UI

**Use Freqtrade API server — not a custom matching engine.**

1. On `ft:start`, force into `_runtime_config.json`:
   ```json
   "api_server": {
     "enabled": true,
     "listen_ip_address": "127.0.0.1",
     "listen_port": 0,          // or pick free port via get-port
     "username": "…",
     "password": "…",
     "jwt_secret_key": "…",
     "ws_token": "…",
     "CORS_origins": ["http://127.0.0.1:5173", "file://"]
   },
   "dry_run": true,
   "dry_run_wallet": 10000
   ```
2. Discover bound port (parse FT log line, or pre-allocate free port and write config).
3. Renderer (or preload) clients:
   - **Poll/REST** (JWT login → refresh): `/status`, `/profit`, `/balance`, `/trades`, `/count`, `/pair_candles`, `/show_config`
   - **WebSocket** `ws://127.0.0.1:{port}/api/v1/message/ws?token={ws_token}`  
     Subscribe: `["status", "entry_fill", "exit_fill", "whitelist", "analyzed_df", "protection_trigger", …]`  
     (see `freqtrade/enums/rpcmessagetype.py`)
4. Optional: `pip install freqtrade-client` and call `FtRestClient` from a tiny Python helper if you prefer not to reimplement JWT in JS — but JS `fetch` + JWT is fine.

**UI mapping (kills the “toy” feel):**

| Panel | Source |
|-------|--------|
| Open positions | `GET /status` + WS fills |
| Trade history | `GET /trades` |
| PnL / daily | `GET /profit`, `/daily` |
| Wallet | `GET /balance` |
| Chart candles | `GET /pair_candles` + WS `analyzed_df` for markers |
| Bot health | `GET /health`, `/sysinfo` |
| Force enter/exit | `POST /forceenter`, `/forceexit` (gated behind confirm) |

Docs: https://docs.freqtrade.io/en/stable/rest-api/ · https://docs.freqtrade.io/en/stable/freq-ui/

### 2.3 Classical ML → FreqAI

- Install: `pip install -r requirements-freqai.txt` (or Docker tag `stable_freqai`)
- Ship example: copy/adapt `freqtrade/templates/FreqaiExampleStrategy.py` → `user_data/strategies/ml/FreqaiExampleStrategy.py`
- Config snippet: `config_examples/config_freqai.example.json` → `user_data/config/config_freqai.json`
- Models out of box: `LightGBMRegressor`, `XGBoostRegressor`, classifiers, `PyTorchMLPRegressor` (extra torch deps)
- UI: “ML strategy” badge + model selector dropdown → pass `--freqaimodel LightGBMRegressor`
- Retrain runs in FT background thread; surface logs + `/pair_candles` prediction columns (`&-*`, `do_predict`, `DI_values`)

Docs: https://docs.freqtrade.io/en/stable/freqai/

**Do not** invent a parallel sklearn pipeline for Phase 1–2.

### 2.4 LLM model gateway (URL + key, one-click)

**Prefer LiteLLM Python SDK in a small local FastAPI sidecar** (not full LiteLLM proxy + Postgres unless you need admin UI).

Why:

- One call style for OpenAI / DeepSeek / Moonshot / Azure / OpenRouter / local Ollama
- User fields: `base_url`, `api_key`, `model` — OpenAI-compatible
- MIT core; no need to vendor enterprise features
- OpenRouter = just another `base_url=https://openrouter.ai/api/v1` + key

**UX (Settings → Models):**

1. Presets: OpenAI / OpenRouter / DeepSeek / Custom
2. Base URL + API Key + Model name
3. “Test connection” → `litellm.completion(model=…, messages=[…], api_base=…, api_key=…)`
4. Persist encrypted (Electron `safeStorage` or OS credential store)

**Use cases (assist only — never silent live order without confirm):**

- Explain strategy code / suggest hyperopt ranges
- Summarize last N trades / drawdown narrative
- Optional: strategy that calls LLM for **advisory** signal tag (store as `enter_tag`); execution still Freqtrade rules

**Do not** auto-execute LLM “buy now” without explicit user gate + dry_run default.

Reference UX: Vibe-Trading LLM settings (MIT) — copy interaction patterns, not the whole agent stack.

### 2.5 Multi-exchange config UX

Freqtrade already supports `exchange.name` via CCXT. UI:

1. Exchange dropdown (whitelist: `binance`, `binanceus`, `okx`, `bybit`, `gate`, `kucoin`, `htx`, …)
2. Spot vs Futures (`trading_mode`, `margin_mode`)
3. API Key / Secret / Password (OKX passphrase) / sandbox toggle
4. “Test connectivity” → `freqtrade list-markets` or thin CCXT `fetch_balance` / `load_markets` in helper
5. Pair whitelist editor + VolumePairList presets
6. Write into `_runtime_config.json` on start

Note: Box cannot reach Binance (HTTP 451); validate on **user Windows machine**.

---

## 3. What to vendor / wrap (specific paths + licenses)

| Component | How to use | License impact |
|-----------|------------|----------------|
| Freqtrade | `pip` dependency (already) | **GPL-3** → whole distributed app stays GPL-3 (already is) |
| FreqUI | Optional: embed iframe to `http://127.0.0.1:port/` **or** study Vue API usage in `frequi` | GPL-3 |
| FreqAI templates | Copy `FreqaiExampleStrategy.py`, `config_freqai.example.json` into `user_data/` | GPL-3 |
| NFI / official strategies | Already vendored under `user_data/strategies/community/` | GPL-3 |
| CCXT | Via Freqtrade; optional `ccxt` in Electron for public tickers only | MIT |
| LiteLLM | `pip install litellm` in venv; thin FastAPI wrapper in `services/llm_gateway/` | MIT (avoid `enterprise/` tree) |
| freqtrade-client | Optional JS alternative: reimplement REST; or call Python helper | same GPL ecosystem |
| Vibe-Trading | **Do not vendor wholesale**; skim Settings/LLM UX ideas | MIT |
| electron-builder NSIS | Already in `desktop/package.json` | — |

**GPL note:** Linking Freqtrade as the trading core means the desktop product remains GPL-3. That matches current `LICENSE` / `package.json`. Do not claim MIT for the combined binary.

Update `THIRD_PARTY_NOTICES.md` when adding LiteLLM / FreqAI / any new vendored files.

---

## 4. Phased plan (“not a toy” ASAP)

### Phase 0 — Diagnosis done (this doc)
Confirm gap = no API/WS bridge.

### Phase 1 — Live paper cockpit (1–2 weeks) ← **do first**
**Success metric:** Click strategy → within seconds see updating positions, fills, PnL, wallet, candle markers in dry_run.

1. Enable `api_server` + generate secrets on every start in `main.cjs`
2. Free port selection; pass port to renderer via IPC
3. New module `desktop/src/lib/freqtradeApi.ts` (login, refresh JWT, REST helpers)
4. New module `desktop/src/lib/freqtradeWs.ts` (subscribe fills / status)
5. Wire `PositionsLogs`, PnL header, TradingWorkspace chart markers to live data
6. Keep stdout log panel as secondary
7. Default `dry_run: true`; hard confirm for live

### Phase 2 — Multi-exchange + first-run polish (1 week)
1. Exchange picker + credential form → runtime config
2. Connectivity test button (user machine)
3. Embed portable Python / first-run `pip install -r requirements.txt` (biggest “toy” install pain)
4. Release `BinanceQuantSetup-*.exe` with working live dry_run demo

### Phase 3 — FreqAI classical ML (1–2 weeks)
1. `requirements-freqai.txt` in installer extras
2. Vendor example FreqAI strategy + config
3. UI: ML model dropdown, train status from logs / custom data
4. Show `do_predict` / DI on chart

### Phase 4 — LLM assist gateway (1 week)
1. `services/llm_gateway` FastAPI + LiteLLM SDK
2. Settings: base URL + key + model + Test
3. Chat / “Explain this strategy” / “Summarize trades” panels
4. Optional advisory signal strategy (dry_run only by default)

### Phase 5 — Hardening & Release
1. Keychain storage, CSP, localhost-only API
2. Crash recovery (reload FT with same `identifier` for FreqAI)
3. CI: smoke test API ping + WS subscribe on Windows
4. Tag `v2.0.0` GitHub Release setup.exe

### Explicitly defer
- NautilusTrader migration
- Hummingbot MM
- Full LiteLLM proxy + Postgres admin
- Auto-live LLM trading agents (Vibe-Trading style) without mandate UI

---

## 5. Immediate implementation checklist (parent can start today)

**Backend config (`main.cjs` / runtime JSON):**
- [ ] Set `api_server.enabled = true`, localhost, random `ws_token` / JWT / password
- [ ] Allocate free port; expose via `ft:status` IPC
- [ ] Keep `dry_run: true` default

**Frontend:**
- [ ] `freqtradeApi.ts` + `freqtradeWs.ts`
- [ ] Bind Positions / Profit / Balance / Candles
- [ ] Status badge: `DRY RUN` / `LIVE` / `API connected`

**Deps:**
- [ ] Bump `requirements.txt`: `freqtrade[…];` add comment for FreqAI extras
- [ ] Later: `litellm`, `fastapi`, `uvicorn` for Phase 4

**Docs:**
- [ ] Keep GPL notices; extend `THIRD_PARTY_NOTICES.md`

---

## 6. One-sentence strategy

> **Keep Freqtrade as the brain, turn on its REST/WebSocket so Electron becomes a real terminal, add FreqAI for classical ML, and LiteLLM (OpenAI-compatible URL+key) for LLM assist — package as GPL-3 Windows setup.exe. Do not rewrite the exchange/strategy engine.**

