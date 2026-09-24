# 币安量化交易套件（Freqtrade + Apple/交易终端 UI）

> **不自研交易引擎。** 依赖开源 [Freqtrade](https://github.com/freqtrade/freqtrade)（**GPL-3**）。桌面端为 **Electron + React + Tailwind**：外壳为 Apple 风格毛玻璃，策略页为类 PC 交易工作区（行情列表 / K 线 / 订单簿 / 底部委托区），布局灵感来自常见桌面交易软件，**未使用任何交易所商标或官方 Logo**。

## 风险警告

- 量化与杠杆合约可能导致**本金亏损**。
- 默认 **`dry_run: true`（模拟盘）**。
- **不构成投资建议。**

## Windows 安装（setup.exe）

1. 打开 [Releases](https://github.com/misaki-mei-yue/binance-quant-trader/releases) 下载 **`BinanceQuantSetup-*.exe`**（NSIS，由 electron-builder 构建）
2. 安装 → 启动「币安量化交易套件」
3. **设置**：可选填写 API；保持「模拟盘」
4. 侧栏进入 **现货均线 / 现货网格 / 合约趋势** → 选交易对与周期 → **启动策略机器人**

> 首次若系统无 Python/Freqtrade：请在安装目录按 README 创建 venv 并 `pip install -r requirements.txt`，或等待后续嵌入式运行时包。Actions 产物亦含 **Portable** 免安装版。

本地 Windows 打包：

```powershell
cd desktop
npm install
npm run build
# 输出：desktop/release/BinanceQuantSetup-*.exe
```

CI：`.github/workflows/windows-setup.yml`（`windows-latest` + electron-builder NSIS）。

## UI 结构

| 区域 | 风格 | 内容 |
|------|------|------|
| 窗口外壳 / 侧栏 | Apple 毛玻璃、红绿灯、蓝色胶囊选中 | 总览 / 现货均线 / 现货网格 / 合约趋势 / 持仓与日志 / 设置 |
| 策略工作区 | 类桌面交易布局 | 左：交易对列表；中：lightweight-charts K 线；右：买卖盘+成交；底：策略启动与日志 Tab |
| 合约页 | 同上 + 杠杆分段 / 逐仓徽章 | FuturesTrendLeverage |

设计参考图：`design/ui-reference-apple.jpg`。

## Python / Freqtrade（策略引擎）

```bash
cd binance-quant-trader
python3 -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
freqtrade --version
```

### 三条模拟盘命令

```bash
freqtrade trade --config user_data/config/config_spot.json --strategy MACrossover --userdir user_data
freqtrade trade --config user_data/config/config_grid.json --strategy GridSpot --userdir user_data
freqtrade trade --config user_data/config/config_futures.json --strategy FuturesTrendLeverage --userdir user_data
```

## 策略

| 策略 | 文件 | 说明 |
|------|------|------|
| MACrossover | `user_data/strategies/MACrossover.py` | 现货 SMA 交叉 |
| GridSpot | `user_data/strategies/GridSpot.py` | 现货网格/DCA 加仓 |
| FuturesTrendLeverage | `user_data/strategies/FuturesTrendLeverage.py` | 合约 EMA，可空，杠杆默认 3 硬顶 10 |

## 来自 Freqtrade vs 本仓库

| Freqtrade | 本仓库 |
|-----------|--------|
| 交易/回测/dry-run/交易所适配 | 三条 IStrategy + 币安场景 config |
| CLI | Electron 桌面 UI、NSIS setup.exe CI |
| | 中文 README、启动桥接（spawn freqtrade） |

## 开发桌面端

```bash
cd desktop
npm install
npm run dev          # Vite + Electron
npm run build:ui     # 仅前端
```

`launcher/` 下旧版 tkinter 启动器已保留作备用 CLI/简陋 GUI，**正式 UI 以 `desktop/` 为准**。

## 许可证

Freqtrade 为 **GPL-3**；本套件与之组合分发时遵循 GPL-3，见 `LICENSE`、`THIRD_PARTY_NOTICES.md`。致谢 [freqtrade](https://github.com/freqtrade/freqtrade) / [freqtrade-strategies](https://github.com/freqtrade/freqtrade-strategies)。
