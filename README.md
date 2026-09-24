# 币安量化交易套件（Freqtrade + Apple/交易终端 UI）

> **不自研交易引擎。** 依赖开源 [Freqtrade](https://github.com/freqtrade/freqtrade)（**GPL-3**）。桌面端为 **Electron + React + Tailwind**：外壳为 Apple 风格毛玻璃，策略页为类 PC 交易工作区（行情列表 / K 线 / 订单簿 / 底部委托区），布局灵感来自常见桌面交易软件，**未使用任何交易所商标或官方 Logo**。

## 风险警告

- 量化与杠杆合约可能导致**本金亏损**。
- 默认 **`dry_run: true`（模拟盘）**。
- **不构成投资建议。** 第三方社区策略**无收益保证**，必须自行 dry-run / 回测后再考虑实盘。

## Windows 安装（setup.exe）

1. 打开 [Releases](https://github.com/misaki-mei-yue/binance-quant-trader/releases) 下载 **`BinanceQuantSetup-*.exe`**（NSIS，由 electron-builder 构建）
2. 安装 → 启动「币安量化交易套件」
3. **设置**：可选填写 API；保持「模拟盘」
4. 侧栏选择策略（入门 / NFI / 官方示例）→ 选交易对与周期 → **启动策略机器人**

> 首次若系统无 Python/Freqtrade：请在安装目录按 README 创建 venv 并 `pip install -r requirements.txt`，或等待后续嵌入式运行时包。Actions 产物亦含 **Portable** 免安装版。
>
> **v1.1.0**：策略选择器新增社区策略与来源徽章；新 setup.exe 由推送 `main` / 打 `v*` 标签后的 GitHub Actions 构建。

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
| 窗口外壳 / 侧栏 | Apple 毛玻璃、红绿灯、蓝色胶囊选中 | 总览 / 入门三套 / NFI / 官方示例 / 持仓与日志 / 设置 |
| 策略工作区 | 类桌面交易布局 + **来源徽章**（入门 / NFI / 官方示例） | 左：交易对；中：K 线；右：盘口；底：启动与日志 |
| 合约入门页 | 同上 + 杠杆分段 / 逐仓徽章 | FuturesTrendLeverage |

设计参考图：`design/ui-reference-apple.jpg`。

## Python / Freqtrade（策略引擎）

```bash
cd binance-quant-trader
python3 -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
freqtrade --version
freqtrade list-strategies --userdir user_data --recursive-strategy-search
```

### 入门三套（本仓库自写模板）

```bash
freqtrade trade --config user_data/config/config_spot.json --strategy MACrossover --userdir user_data
freqtrade trade --config user_data/config/config_grid.json --strategy GridSpot --userdir user_data
freqtrade trade --config user_data/config/config_futures.json --strategy FuturesTrendLeverage --userdir user_data
```

### NFI（第三方）

```bash
# 推荐 X6；周期必须 5m（见 config_nfi.json）
freqtrade trade --config user_data/config/config_nfi.json \
  --strategy NostalgiaForInfinityX6 --userdir user_data

# 可选 X7
freqtrade trade --config user_data/config/config_nfi.json \
  --strategy NostalgiaForInfinityX7 --userdir user_data

# 进阶：多配置合并（上游推荐 pairlist / blacklist）
freqtrade trade \
  --config user_data/config/config_nfi.json \
  --config user_data/strategies/community/NFI/configs/blacklist-binance.json \
  --config user_data/strategies/community/NFI/configs/pairlist-volume-binance-usdt.json \
  --strategy NostalgiaForInfinityX6 --userdir user_data
```

### 官方示例（freqtrade-strategies）

```bash
freqtrade trade --config user_data/config/config_spot.json --strategy Strategy001 --userdir user_data
freqtrade trade --config user_data/config/config_spot.json --strategy Strategy002 --userdir user_data
freqtrade trade --config user_data/config/config_spot.json --strategy CombinedBinHAndCluc --userdir user_data
freqtrade trade --config user_data/config/config_spot.json --strategy MACDStrategy --userdir user_data
freqtrade trade --config user_data/config/config_spot.json --strategy BbandRsi --userdir user_data
freqtrade trade --config user_data/config/config_spot.json --strategy Supertrend --userdir user_data
```

## 策略来源

诚实说明：

| 徽章 | 路径 | 来源 | 说明 |
|------|------|------|------|
| **入门** | `user_data/strategies/starter/` | **本仓库自写模板** | `MACrossover` / `GridSpot` / `FuturesTrendLeverage` — 逻辑刻意简化，仅供学习接口与配置，**不是**社区验证策略 |
| **NFI** | `user_data/strategies/community/NFI/` | [iterativv/NostalgiaForInfinity](https://github.com/iterativv/NostalgiaForInfinity)（**GPL-3**） | 社区最热门策略之一；本仓库 vendoring `X6`（偏稳定）与 `X7`（可选）；配套 `configs/` + `user_data/config/config_nfi.json` |
| **官方示例** | `user_data/strategies/community/official/` | [freqtrade/freqtrade-strategies](https://github.com/freqtrade/freqtrade-strategies)（**GPL-3**） | Strategy001/002、CombinedBinHAndCluc、MACDStrategy、BbandRsi、Supertrend |

**重要：**

- 第三方策略版权与许可证归原作者；本仓库仅复制以便本地使用，见各目录 `ATTRIBUTION.md` / `LICENSE`。
- **无利润保证。** 历史回测 ≠ 未来收益。请先 `dry_run`，再用自己的数据回测。
- 部分地区访问币安行情可能被拦截（HTTP 451）；不影响策略文件 import，但 live/download 需自行解决网络。

详见 `user_data/strategies/README.md`、`THIRD_PARTY_NOTICES.md`。

## 来自 Freqtrade vs 本仓库

| Freqtrade | 本仓库 |
|-----------|--------|
| 交易/回测/dry-run/交易所适配 | 入门三套 IStrategy + 币安场景 config |
| CLI | Electron 桌面 UI、NSIS setup.exe CI |
| | 社区策略 vendoring（NFI / 官方示例）、中文 README、启动桥接 |

## 开发桌面端

```bash
cd desktop
npm install
npm run dev          # Vite + Electron
npm run build:ui     # 仅前端
```

`launcher/` 下旧版 tkinter 启动器已保留作备用 CLI/简陋 GUI，**正式 UI 以 `desktop/` 为准**。

## 许可证

Freqtrade、NostalgiaForInfinity、freqtrade-strategies 均为 **GPL-3**；本套件与之组合分发时遵循 GPL-3，见 `LICENSE`、`THIRD_PARTY_NOTICES.md`。
