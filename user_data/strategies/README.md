# 策略目录说明

| 路径 | 来源徽章 | 说明 |
|------|----------|------|
| `starter/` | 入门 | 本仓库自写三套入门模板 |
| `community/NFI/` | NFI | [NostalgiaForInfinity](https://github.com/iterativv/NostalgiaForInfinity)（GPL-3） |
| `community/official/` | 官方示例 | [freqtrade-strategies](https://github.com/freqtrade/freqtrade-strategies)（GPL-3） |

Freqtrade 会递归扫描本目录。启动示例见仓库根 `README.md`「策略来源」一节。

## 递归加载

子目录策略需开启 `recursive_strategy_search`（各 `user_data/config/config_*.json` 已设为 `true`），或 CLI 加 `--recursive-strategy-search`。

## 2.0 新增

- `starter/LLMSignalStrategy.py` — OpenAI 兼容 LLM 信号
- `freqai/FreqaiExampleStrategy.py` — FreqAI LightGBM 示例
