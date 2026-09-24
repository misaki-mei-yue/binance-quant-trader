const { app, BrowserWindow, ipcMain, shell } = require("electron");
const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");

let mainWindow = null;
let ftProc = null;
const isDev = !app.isPackaged;

function projectRoot() {
  // Packaged: resources/user_data ; Dev: repo root (parent of desktop/)
  if (isDev) return path.resolve(__dirname, "..", "..");
  return process.resourcesPath;
}

function userDataDir() {
  return path.join(projectRoot(), "user_data");
}

function findFreqtrade() {
  const root = projectRoot();
  const candidates = [
    path.join(root, ".venv", "Scripts", "freqtrade.exe"),
    path.join(root, ".venv", "bin", "freqtrade"),
    path.join(root, "python", "Scripts", "freqtrade.exe"),
    "freqtrade",
  ];
  for (const c of candidates) {
    if (c === "freqtrade") return c;
    if (fs.existsSync(c)) return c;
  }
  return "freqtrade";
}

const STRATEGY_MAP = {
  overview: null,
  spot_ma: {
    config: "config/config_spot.json",
    strategy: "MACrossover",
    label: "现货均线",
  },
  spot_grid: {
    config: "config/config_grid.json",
    strategy: "GridSpot",
    label: "现货网格",
  },
  futures: {
    config: "config/config_futures.json",
    strategy: "FuturesTrendLeverage",
    label: "合约趋势",
  },
};

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1180,
    height: 760,
    minWidth: 960,
    minHeight: 640,
    frame: false,
    transparent: false,
    backgroundColor: "#E8F1FA",
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "hidden",
    trafficLightPosition: { x: 16, y: 16 },
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    show: false,
  });

  mainWindow.once("ready-to-show", () => mainWindow.show());

  if (isDev) {
    mainWindow.loadURL("http://127.0.0.1:5173");
  } else {
    mainWindow.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  }
}

function sendLog(line) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send("ft:log", line);
  }
}

function sendStatus(payload) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send("ft:status", payload);
  }
}

ipcMain.handle("win:minimize", () => mainWindow?.minimize());
ipcMain.handle("win:maximize", () => {
  if (!mainWindow) return;
  if (mainWindow.isMaximized()) mainWindow.unmaximize();
  else mainWindow.maximize();
});
ipcMain.handle("win:close", () => mainWindow?.close());

ipcMain.handle("app:getPaths", () => ({
  root: projectRoot(),
  userData: userDataDir(),
  freqtrade: findFreqtrade(),
  packaged: !isDev,
}));

ipcMain.handle("ft:isRunning", () => !!(ftProc && ftProc.exitCode === null && !ftProc.killed));

ipcMain.handle("ft:stop", async () => {
  if (ftProc && !ftProc.killed) {
    ftProc.kill("SIGTERM");
    sendLog("[系统] 已发送停止信号\n");
    sendStatus({ running: false });
    return true;
  }
  return false;
});

ipcMain.handle("ft:start", async (_e, opts) => {
  if (ftProc && ftProc.exitCode === null && !ftProc.killed) {
    return { ok: false, error: "已有实例在运行" };
  }
  const key = opts?.strategyKey || "spot_ma";
  const meta = STRATEGY_MAP[key];
  if (!meta) return { ok: false, error: "请选择具体策略页再启动" };

  const ud = userDataDir();
  const cfgPath = path.join(ud, meta.config);
  if (!fs.existsSync(cfgPath)) {
    return { ok: false, error: `配置不存在: ${cfgPath}` };
  }

  // Write runtime config with API + dry_run + optional overrides
  let data;
  try {
    data = JSON.parse(fs.readFileSync(cfgPath, "utf8"));
  } catch (err) {
    return { ok: false, error: String(err) };
  }
  data.dry_run = opts?.dryRun !== false; // default true
  data.exchange = data.exchange || {};
  if (opts?.apiKey) data.exchange.key = opts.apiKey;
  if (opts?.apiSecret) data.exchange.secret = opts.apiSecret;
  if (opts?.pairs && Array.isArray(opts.pairs) && opts.pairs.length) {
    data.exchange.pair_whitelist = opts.pairs;
  }
  if (opts?.timeframe) data.timeframe = opts.timeframe;
  if (opts?.leverageMax && data.trading_mode === "futures") {
    // informational only; strategy leverage() still caps
    data._ui_leverage_cap = opts.leverageMax;
  }

  const runtime = path.join(ud, "config", "_runtime_config.json");
  fs.mkdirSync(path.dirname(runtime), { recursive: true });
  fs.writeFileSync(runtime, JSON.stringify(data, null, 2), "utf8");

  const ft = findFreqtrade();
  const args = [
    "trade",
    "--config",
    runtime,
    "--strategy",
    meta.strategy,
    "--userdir",
    ud,
  ];
  sendLog(`$ ${ft} ${args.join(" ")}\n`);
  sendStatus({ running: true, strategy: meta.label, dryRun: data.dry_run });

  try {
    ftProc = spawn(ft, args, {
      cwd: projectRoot(),
      env: { ...process.env, PYTHONUTF8: "1", PYTHONIOENCODING: "utf-8" },
      shell: process.platform === "win32",
    });
  } catch (err) {
    sendStatus({ running: false });
    return { ok: false, error: String(err) };
  }

  ftProc.stdout?.on("data", (buf) => sendLog(buf.toString()));
  ftProc.stderr?.on("data", (buf) => sendLog(buf.toString()));
  ftProc.on("exit", (code) => {
    sendLog(`\n[进程结束] exit=${code}\n`);
    sendStatus({ running: false });
    ftProc = null;
  });
  ftProc.on("error", (err) => {
    sendLog(`\n[启动失败] ${err.message}\n请确认已安装 Freqtrade（见 README / first_run）。\n`);
    sendStatus({ running: false, error: err.message });
    ftProc = null;
  });

  return { ok: true };
});

ipcMain.handle("ft:listStrategies", async () => {
  return Object.entries(STRATEGY_MAP)
    .filter(([, v]) => v)
    .map(([k, v]) => ({ key: k, ...v }));
});

app.whenReady().then(createWindow);
app.on("window-all-closed", () => {
  if (ftProc && !ftProc.killed) ftProc.kill("SIGTERM");
  if (process.platform !== "darwin") app.quit();
});
app.on("before-quit", () => {
  if (ftProc && !ftProc.killed) ftProc.kill("SIGTERM");
});
