# 第三方与致谢

## Freqtrade

- 项目：https://github.com/freqtrade/freqtrade
- 许可证：**GPL-3.0**
- 本仓库通过 `pip install freqtrade` 依赖其交易引擎、交易所适配、回测与 dry-run 能力。
- **本仓库不重新实现** 订单路由、交易所 API、撮合模拟等核心逻辑。

## NostalgiaForInfinity（NFI）

- 项目：https://github.com/iterativv/NostalgiaForInfinity
- 许可证：**GPL-3.0**
- 本仓库在 `user_data/strategies/community/NFI/` **vendoring** 策略源码（X6 / X7）及 Binance 相关配套 configs。
- 版权归原作者与贡献者；使用前请阅读上游 README。**无收益保证。**

## freqtrade-strategies

- 项目：https://github.com/freqtrade/freqtrade-strategies
- 许可证：**GPL-3.0**
- 本仓库在 `user_data/strategies/community/official/` 收录若干自包含示例策略（Strategy001/002、CombinedBinHAndCluc、MACDStrategy、BbandRsi、Supertrend）。
- 入门三套（`starter/`）为本仓库原创适配模板，与上述社区策略无关。

## 其他

- TA-Lib / pandas / pandas_ta / technical / ccxt 等由 Freqtrade 依赖树引入，遵循各自许可证。

## OpenAI Python client

- Package: `openai` (PyPI)
- Used by: `user_data/llm_gateway/` for OpenAI-compatible chat completions (`base_url` pattern also used by LiteLLM / OpenRouter / DeepSeek / Ollama).
- License: Apache-2.0
- We do **not** vendor the full LiteLLM project; only the thin official client is required.

