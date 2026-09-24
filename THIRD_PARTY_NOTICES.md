# 第三方与致谢

## Freqtrade

- 项目：https://github.com/freqtrade/freqtrade
- 许可证：**GPL-3.0**
- 本仓库通过 `pip install freqtrade` 依赖其交易引擎、交易所适配、回测与 dry-run 能力。
- **本仓库不重新实现** 订单路由、交易所 API、撮合模拟等核心逻辑。

## freqtrade-strategies

- 项目：https://github.com/freqtrade/freqtrade-strategies
- 策略思路与社区最佳实践参考；本仓库三条策略为原创适配实现，面向币安现货/合约入门场景。

## 其他

- TA-Lib / pandas / ccxt 等由 Freqtrade 依赖树引入，遵循各自许可证。
