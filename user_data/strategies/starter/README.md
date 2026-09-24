# 入门示例（本仓库自写模板）

以下三套策略为 **本仓库原创入门模板**，逻辑刻意简化，便于理解 Freqtrade `IStrategy` 接口与币安现货/合约配置，**不是**社区实盘验证策略。

| 文件 | 说明 |
|------|------|
| `MACrossover.py` | 现货 SMA 快慢线交叉 |
| `GridSpot.py` | 现货网格 / DCA 加仓示意 |
| `FuturesTrendLeverage.py` | 合约 EMA 趋势，杠杆默认 3× 硬顶 10× |

进阶请使用 `../community/NFI/` 与 `../community/official/` 中的第三方 GPL-3 策略，并自行 dry-run / 回测。
