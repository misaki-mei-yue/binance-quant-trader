# 量化交易套件 2.0（Freqtrade + 多交易所 + 实时模拟盘 UI）

> **不自研撮合引擎。** 执行层是开源 [Freqtrade](https://github.com/freqtrade/freqtrade)（**GPL-3**）：CCXT 多交易所、dry-run 模拟盘、REST/WebSocket `api_server`、FreqAI。  
> 桌面端 **Electron + React**：设置里选交易所与模型 → 策略页一键 **启动模拟盘** → 持仓/盈亏/日志走真实 api_server。  
> **v2.0 起旧版「demo mock 冒充实盘」已替换**；未启动机器人时图表会明确标注「未连接 · 本地示意」。

当前桌面版本：`desktop/package.json` → **2.0.0-dev**（功能开发版；正式发 setup.exe 由你决定是否打 tag）。

## 风险警告

- 量化与杠杆合约可能导致**本金亏损**。
- 默认 **`dry_run: true`（模拟盘）**；实盘前会再次确认。
- **不构成投资建议，不承诺收益。** 第三方策略须自行回测 / dry-run。

## 架构（诚实说明）

```
Electron UI（中文）
  ├─ 设置：交易所 CCXT id + Key/Secret/Passphrase +「测试连接」
  ├─ 设置：模型 API（OpenAI 兼容 base_url）+「测通」
  └─ 策略页：「启动模拟盘」→ IPC spawn freqtrade trade
                    ↓
            _runtime_config.json（注入 api_server + 密钥 + dry_run）
                    ↓
            Freqtrade 引擎 + api_server :8080
                    ↓
            UI 每 1.5s 轮询 status / profit / balance / pair_candles
```

复用而非重写：

| 能力 | 来源 |
|------|------|
| 下单 / 模拟盘 / 回测 / 交易所 | Freqtrade + CCXT |
| 实时状态 | Freqtrade REST + Message WS |
| 经典 ML | FreqAI（LightGBM 示例配置） |
| LLM | 薄封装 `openai` 客户端（兼容 DeepSeek / Qwen / Ollama / OpenRouter） |
| 社区策略 | NFI、freqtrade-strategies（GPL-3，见 ATTRIBUTION） |

## Windows 用户：最短成功路径（无需手改 JSON）

1. 安装 [Releases](https://github.com/misaki-mei-yue/binance-quant-trader/releases) 中的 setup（或本仓库 `desktop/` 自行 `npm run build`），或开发模式见下文。
2. 在安装目录准备 Python 环境（首次）：
   ```bat
   python -m venv .venv
   .venv\Scripts\activate
   pip install -r requirements.txt
   ```
3. 打开桌面端 → **设置**：
   - 选交易所（binance / okx / bybit / gate / kucoin / bitget / mexc …）
   - 粘贴 API Key / Secret（OKX 等填 Passphrase）
   - 保持 **模拟盘 dry_run**
   - 点 **测试连接** → **保存设置**
4. 侧栏点开任意策略 → **启动模拟盘**。
5. 底部「持仓 / 盈亏」与总览卡片会随 api_server 刷新（无需再开终端）。

窗口右上角为 Windows 标准 **最小化 / 最大化 / 关闭（×）**。

> 部分地区访问币安可能 HTTP 451；可在设置中换 OKX/Bybit 等，或在本机可访问的网络使用。盒子/服务器测连失败不代表你的 Windows 本机失败。

## 连接交易所（写入 Freqtrade config.exchange）

设置页保存后写入 `user_data/config/ui_settings.json`（已 gitignore）。  
启动策略时 Electron 合并进 `user_data/config/_runtime_config.json`：

- `exchange.name` = CCXT id  
- `exchange.key` / `secret` / `password`（passphrase）  
- `dry_run` 默认 `true`  
- `api_server.enabled` = `true`（`127.0.0.1:8080`）

命令行等价：

```bash
freqtrade trade --config user_data/config/_runtime_config.json \
  --strategy MACrossover --userdir user_data --recursive-strategy-search
```

## 实时模拟盘 UI

- 所有模板配置已启用 `api_server`（用户名/JWT/ws_token 仅本机模板；运行时由 Electron 注入）。
- 启动后主进程等待 `/api/v1/ping`，登录取 JWT，前端通过 IPC `ftApi` 拉取：
  - `status`（持仓）、`profit`、`balance`、`whitelist`、`pair_candles`、`logs`
- **未运行**时：持仓显示「未连接模拟盘」；K 线若为本地推演会标注 **未连接 · 本地示意（非实盘行情）**。

## 模型 API（LLM）

设置页「模型 API」一卡片：

- Base URL / API Key / 模型名  
- 快捷预设：DeepSeek、OpenAI、OpenRouter、Ollama、通义 Qwen  
- **测通** → 调用 `chat.completions` 小请求  
- 持久化：`user_data/config/llm.json`（**勿提交**；见 `llm.json.example`）

策略：`LLMSignalStrategy`（侧栏「LLM 信号」）读取该配置，要求模型返回 enter/exit JSON；策略内有止损与仓位比例硬帽。LLM 失败则不交易。

后端：`user_data/llm_gateway/`（`openai` Python 客户端 + `base_url`，LiteLLM 兼容用法，未整包 vendoring LiteLLM）。

## FreqAI（机器学习）

- 配置：`user_data/config/config_freqai.json`  
- 策略：`user_data/strategies/freqai/FreqaiExampleStrategy.py`  
- 侧栏「FreqAI」启动时附加 `--freqaimodel LightGBMRegressor`  
- 依赖（按需，体积大）：
  ```bash
  pip install "freqtrade[freqai]"
  # 或：pip install lightgbm datasieve scikit-learn
  ```
- 需先下载历史数据；详见 [FreqAI 文档](https://www.freqtrade.io/en/stable/freqai/)。**学习模板，无收益保证。**

## 策略来源

| 徽章 | 路径 | 说明 |
|------|------|------|
| **入门** | `strategies/starter/`、`freqai/` | 自写模板：均线 / 网格 / 合约 / LLM / FreqAI |
| **NFI** | `strategies/community/NFI/` | [NostalgiaForInfinity](https://github.com/iterativv/NostalgiaForInfinity) GPL-3 |
| **官方示例** | `strategies/community/official/` | [freqtrade-strategies](https://github.com/freqtrade/freqtrade-strategies) GPL-3 |

详见 `user_data/strategies/README.md`、`THIRD_PARTY_NOTICES.md`。

## 开发桌面端

```bash
cd binance-quant-trader
python3 -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt

cd desktop
npm install
npm run dev          # Vite + Electron
npm run build:ui     # 仅前端
```

打包 Windows（在 Windows 上或 CI）：

```powershell
cd desktop
npm run build
# desktop/release/BinanceQuantSetup-*.exe
```

## 与 1.x 的差异

| 1.x（被拒为 toy） | 2.0-dev |
|-------------------|---------|
| 只 spawn 进程 + 看日志 | api_server + 实时持仓/盈亏 |
| 假盘口冒充行情 | 公共 REST / 机器人 K 线；mock **显式标注** |
| 仅 Binance 文案 | 设置页多交易所 CCXT |
| 无 LLM / FreqAI 入口 | 设置测通 + 示例策略 |

**未做（已知缺口）：** 完整 Message WebSocket 推送（当前以轮询为主）、嵌入 FreqUI、密钥系统钥匙串加密、FreqAI 一键下数据向导。欢迎后续迭代。

## 许可证

Freqtrade、NFI、freqtrade-strategies 均为 **GPL-3**；本套件与之组合分发时遵循 GPL-3，见 `LICENSE`、`THIRD_PARTY_NOTICES.md`。
