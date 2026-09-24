# 币安量化交易套件（基于 Freqtrade）

> **不是自研交易框架。** 本仓库依赖并复用开源 [Freqtrade](https://github.com/freqtrade/freqtrade)（**GPL-3**）作为交易所连接、下单、回测与模拟盘引擎；本仓库仅提供币安场景配置、三条示例策略、中文说明，以及 Windows `setup.exe` 安装包/启动器。

## 风险警告（必读）

- 量化/合约交易可能导致**本金全部亏损**，尤其是杠杆。
- 仓库与安装包**默认 `dry_run: true`（模拟盘）**，不会真实下单。
- 切换实盘前请自行充分回测与模拟，并自行承担全部风险。
- **不构成任何投资建议。**

## Windows 安装（推荐）

1. 打开 [Releases](https://github.com/misaki-mei-yue/binance-quant-trader/releases) 下载 **`BinanceQuantSetup.exe`**
2. 双击安装 → 下一步 → 安装到 `Program Files\BinanceQuantTrader`
3. 启动「币安量化交易套件」
4. （可选）填写 Binance API Key / Secret
5. 选择策略：
   - **均线交叉（现货）** → `MACrossover`
   - **网格/DCA（现货）** → `GridSpot`
   - **合约趋势** → `FuturesTrendLeverage`
6. **保持勾选「模拟盘 dry_run」** → 点击「启动交易机器人」

> 若 Release 尚无 `setup.exe`：本仓库 GitHub Actions（`windows-setup.yml`）在 `main` 推送或打 `v*` 标签时自动构建，产物在 Actions Artifacts / Release 附件。

本地 Windows 手动打包：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\build_launcher_windows.ps1
powershell -ExecutionPolicy Bypass -File .\scripts\build_setup_windows.ps1
# 输出：dist\BinanceQuantSetup.exe
```

## Python / 开发者安装

```bash
cd binance-quant-trader
python3 -m venv .venv
# Linux/macOS
source .venv/bin/activate
# Windows
# .venv\Scripts\activate

pip install -r requirements.txt
freqtrade --version
```

复制环境变量模板（可选）：

```bash
cp .env.example .env
# 编辑 FREQTRADE__EXCHANGE__KEY / SECRET
```

## 三条模拟盘启动命令

在项目根目录、已激活 venv：

```bash
# 1) 现货均线交叉
freqtrade trade \
  --config user_data/config/config_spot.json \
  --strategy MACrossover \
  --userdir user_data

# 2) 现货网格 / DCA
freqtrade trade \
  --config user_data/config/config_grid.json \
  --strategy GridSpot \
  --userdir user_data

# 3) 合约趋势（isolated + 可空）
freqtrade trade \
  --config user_data/config/config_futures.json \
  --strategy FuturesTrendLeverage \
  --userdir user_data
```

CLI 启动器：

```bash
python -m launcher.cli --strategy spot
python -m launcher.cli --strategy grid
python -m launcher.cli --strategy futures
python -m launcher.cli --list
```

GUI 启动器：

```bash
python launcher/app.py
```

## 如何切换实盘（谨慎）

1. 在币安创建**仅交易权限**的 API（建议限制 IP，关闭提现）。
2. 将对应 config 中 `"dry_run": false`，或通过启动器取消勾选模拟盘（会二次确认）。
3. 写入 API：config 的 `exchange.key` / `exchange.secret`，或环境变量 `FREQTRADE__EXCHANGE__KEY` / `FREQTRADE__EXCHANGE__SECRET`。
4. **使用全新数据库**（勿与 dry-run SQLite 混用）。
5. 合约请确认 `trading_mode: futures`、`margin_mode: isolated`，并理解杠杆与强平。

## 策略说明

| 策略 | 文件 | 市场 | 要点 |
|------|------|------|------|
| MACrossover | `user_data/strategies/MACrossover.py` | 现货 | SMA 快慢线金叉/死叉，止损 + ROI |
| GridSpot | `user_data/strategies/GridSpot.py` | 现货 | 区间 DCA/加仓，`max_entry_position_adjustment` 封顶 |
| FuturesTrendLeverage | `user_data/strategies/FuturesTrendLeverage.py` | 合约 | EMA 趋势，`can_short=True`，杠杆默认 3、硬顶 10，跟踪止损 |

## 来自 Freqtrade vs 本仓库

| 来自 Freqtrade | 本仓库提供 |
|----------------|------------|
| 交易引擎、交易所适配（含 Binance）、dry-run、回测、持久化、RPC | 三条 `IStrategy` 示例 |
| 配置 schema、pairlist、风控基础设施 | 三份币安场景 `config_*.json` |
| CLI（`freqtrade trade/backtesting/...`） | 中文 README、GUI/CLI 启动器 |
| | Windows Inno Setup 脚本 + GitHub Actions 打 `setup.exe` |

## 目录结构

```
binance-quant-trader/
  user_data/
    strategies/     # MACrossover / GridSpot / FuturesTrendLeverage
    config/         # config_spot / config_grid / config_futures
  launcher/         # tkinter GUI + CLI
  installer/        # installer.iss（Inno Setup）
  scripts/          # Windows 打包脚本
  .github/workflows/windows-setup.yml
  dist/             # 构建产物（gitignore；CI 上传）
  requirements.txt  # pip install freqtrade
```

## 许可证与致谢

- **Freqtrade**：[GPL-3.0](https://github.com/freqtrade/freqtrade) — 本套件与之组合分发时遵循 GPL-3 义务，见 `LICENSE`、`THIRD_PARTY_NOTICES.md`。
- 策略社区参考：[freqtrade-strategies](https://github.com/freqtrade/freqtrade-strategies)
- 发行者：misaki-mei-yue
