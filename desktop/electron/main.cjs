const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");
const http = require("http");
const https = require("https");
const { spawn } = require("child_process");
const { URL } = require("url");

let mainWindow = null;
let ftProc = null;
let ftAccessToken = null;
let ftApiMeta = null; // { base, username, password, wsToken, port }
const isDev = !app.isPackaged;

const DEFAULT_API = {
  enabled: true,
  listen_ip_address: "127.0.0.1",
  listen_port: 8080,
  verbosity: "error",
  enable_openapi: false,
  jwt_secret_key: "ad96225355154d04a4678842d539b77da6f9fb2df47c98f3",
  ws_token: "ceb13247d4faa2f4b31118357308fb70",
  username: "freqtrader",
  password: "xk4P8SSZlhR_GyRLPNwmyw",
  CORS_origins: ["http://127.0.0.1:5173", "http://localhost:5173", "app://."],
};

function projectRoot() {
  if (isDev) return path.resolve(__dirname, "..", "..");
  return process.resourcesPath;
}

function userDataDir() {
  return path.join(projectRoot(), "user_data");
}

function settingsPath() {
  return path.join(userDataDir(), "config", "ui_settings.json");
}

function llmConfigPath() {
  return path.join(userDataDir(), "config", "llm.json");
}

function findPython() {
  const root = projectRoot();
  const candidates = [
    path.join(root, ".venv", "Scripts", "python.exe"),
    path.join(root, ".venv", "bin", "python"),
    path.join(root, "python", "Scripts", "python.exe"),
    "python",
    "python3",
  ];
  for (const c of candidates) {
    if (c === "python" || c === "python3") return c;
    if (fs.existsSync(c)) return c;
  }
  return process.platform === "win32" ? "python" : "python3";
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

function loadUiSettings() {
  const p = settingsPath();
  const defaults = {
    exchange: "binance",
    apiKey: "",
    apiSecret: "",
    password: "",
    dryRun: true,
  };
  try {
    if (fs.existsSync(p)) return { ...defaults, ...JSON.parse(fs.readFileSync(p, "utf8")) };
  } catch (_) {}
  return defaults;
}

function saveUiSettings(partial) {
  const cur = loadUiSettings();
  const next = { ...cur, ...partial };
  fs.mkdirSync(path.dirname(settingsPath()), { recursive: true });
  fs.writeFileSync(settingsPath(), JSON.stringify(next, null, 2), "utf8");
  return next;
}

function loadLlmConfig() {
  const p = llmConfigPath();
  const defaults = {
    base_url: "",
    api_key: "",
    model_name: "",
    enabled: false,
    timeout_sec: 20,
  };
  try {
    if (fs.existsSync(p)) return { ...defaults, ...JSON.parse(fs.readFileSync(p, "utf8")) };
  } catch (_) {}
  return defaults;
}

function saveLlmConfig(partial) {
  const cur = loadLlmConfig();
  const next = { ...cur, ...partial };
  fs.mkdirSync(path.dirname(llmConfigPath()), { recursive: true });
  fs.writeFileSync(llmConfigPath(), JSON.stringify(next, null, 2), "utf8");
  return next;
}

const STRATEGY_MAP = {
  overview: null,
  spot_ma: {
    config: "config/config_spot.json",
    strategy: "MACrossover",
    label: "入门·现货均线",
    source: "入门",
  },
  spot_grid: {
    config: "config/config_grid.json",
    strategy: "GridSpot",
    label: "入门·现货网格",
    source: "入门",
  },
  futures: {
    config: "config/config_futures.json",
    strategy: "FuturesTrendLeverage",
    label: "入门·合约趋势",
    source: "入门",
  },
  nfi_x6: {
    config: "config/config_nfi.json",
    strategy: "NostalgiaForInfinityX6",
    label: "NFI X6",
    source: "NFI",
  },
  nfi_x7: {
    config: "config/config_nfi.json",
    strategy: "NostalgiaForInfinityX7",
    label: "NFI X7",
    source: "NFI",
  },
  official_s001: {
    config: "config/config_spot.json",
    strategy: "Strategy001",
    label: "官方·Strategy001",
    source: "官方示例",
  },
  official_s002: {
    config: "config/config_spot.json",
    strategy: "Strategy002",
    label: "官方·Strategy002",
    source: "官方示例",
  },
  official_cluc: {
    config: "config/config_spot.json",
    strategy: "CombinedBinHAndCluc",
    label: "官方·BinH+Cluc",
    source: "官方示例",
  },
  official_macd: {
    config: "config/config_spot.json",
    strategy: "MACDStrategy",
    label: "官方·MACD",
    source: "官方示例",
  },
  official_bband: {
    config: "config/config_spot.json",
    strategy: "BbandRsi",
    label: "官方·BBandRSI",
    source: "官方示例",
  },
  official_super: {
    config: "config/config_spot.json",
    strategy: "Supertrend",
    label: "官方·Supertrend",
    source: "官方示例",
  },
  llm_signal: {
    config: "config/config_llm.json",
    strategy: "LLMSignalStrategy",
    label: "入门·LLM 信号",
    source: "入门",
  },
  freqai_lgbm: {
    config: "config/config_freqai.json",
    strategy: "FreqaiExampleStrategy",
    label: "FreqAI·LightGBM 示例",
    source: "入门",
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

function httpRequest(method, urlStr, { headers = {}, body = null, timeoutMs = 8000 } = {}) {
  return new Promise((resolve, reject) => {
    let u;
    try {
      u = new URL(urlStr);
    } catch (err) {
      reject(err);
      return;
    }
    const lib = u.protocol === "https:" ? https : http;
    const req = lib.request(
      {
        protocol: u.protocol,
        hostname: u.hostname,
        port: u.port,
        path: u.pathname + u.search,
        method,
        headers,
        timeout: timeoutMs,
      },
      (res) => {
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          const raw = Buffer.concat(chunks).toString("utf8");
          let data = raw;
          try {
            data = JSON.parse(raw);
          } catch (_) {}
          resolve({ status: res.statusCode, data, headers: res.headers });
        });
      }
    );
    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("请求超时"));
    });
    if (body) req.write(body);
    req.end();
  });
}

async function waitForPing(base, maxMs = 45000) {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    try {
      const r = await httpRequest("GET", `${base}/api/v1/ping`, { timeoutMs: 2000 });
      if (r.status === 200) return true;
    } catch (_) {}
    await new Promise((r) => setTimeout(r, 800));
  }
  return false;
}

async function ftLogin(base, username, password) {
  const body = new URLSearchParams({ username, password }).toString();
  const r = await httpRequest("POST", `${base}/api/v1/token/login`, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body,
    timeoutMs: 10000,
  });
  if (r.status !== 200 || !r.data || !r.data.access_token) {
    throw new Error(`登录 api_server 失败 (HTTP ${r.status})`);
  }
  return r.data.access_token;
}

async function ftGet(pathSuffix, query = {}) {
  if (!ftApiMeta || !ftAccessToken) {
    return { ok: false, error: "api_server 未就绪" };
  }
  const u = new URL(`${ftApiMeta.base}${pathSuffix}`);
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined && v !== null && v !== "") u.searchParams.set(k, String(v));
  }
  try {
    const r = await httpRequest("GET", u.toString(), {
      headers: {
        Authorization: `Bearer ${ftAccessToken}`,
        Accept: "application/json",
      },
      timeoutMs: 10000,
    });
    if (r.status === 401) {
      // refresh token once
      ftAccessToken = await ftLogin(ftApiMeta.base, ftApiMeta.username, ftApiMeta.password);
      const r2 = await httpRequest("GET", u.toString(), {
        headers: {
          Authorization: `Bearer ${ftAccessToken}`,
          Accept: "application/json",
        },
        timeoutMs: 10000,
      });
      if (r2.status >= 400) return { ok: false, error: `HTTP ${r2.status}`, data: r2.data };
      return { ok: true, data: r2.data };
    }
    if (r.status >= 400) return { ok: false, error: `HTTP ${r.status}`, data: r.data };
    return { ok: true, data: r.data };
  } catch (err) {
    return { ok: false, error: String(err.message || err) };
  }
}

function spawnPythonJson(scriptRel, payload) {
  return new Promise((resolve) => {
    const py = findPython();
    const script = path.join(projectRoot(), scriptRel);
    if (!fs.existsSync(script)) {
      resolve({ ok: false, message: `脚本不存在：${scriptRel}` });
      return;
    }
    const child = spawn(py, [script], {
      cwd: projectRoot(),
      env: { ...process.env, PYTHONUTF8: "1", PYTHONIOENCODING: "utf-8" },
      shell: process.platform === "win32",
    });
    let out = "";
    let err = "";
    child.stdout?.on("data", (b) => (out += b.toString()));
    child.stderr?.on("data", (b) => (err += b.toString()));
    child.on("error", (e) => {
      resolve({ ok: false, message: `无法启动 Python：${e.message}。请先创建 .venv 并 pip install -r requirements.txt` });
    });
    child.on("close", () => {
      const text = (out || err || "").trim();
      try {
        const lastLine = text.split(/\r?\n/).filter(Boolean).pop() || "{}";
        resolve(JSON.parse(lastLine));
      } catch (_) {
        resolve({
          ok: false,
          message: text
            ? `脚本输出无法解析：${text.slice(0, 300)}`
            : "测试失败：无输出（请确认已安装 ccxt / openai）",
        });
      }
    });
    try {
      child.stdin.write(JSON.stringify(payload || {}));
      child.stdin.end();
    } catch (_) {}
  });
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
  python: findPython(),
  packaged: !isDev,
}));

ipcMain.handle("settings:get", () => loadUiSettings());
ipcMain.handle("settings:save", (_e, partial) => saveUiSettings(partial || {}));

ipcMain.handle("llm:get", () => {
  const c = loadLlmConfig();
  return {
    base_url: c.base_url || "",
    api_key: c.api_key || "",
    model_name: c.model_name || "",
    enabled: !!c.enabled,
    timeout_sec: c.timeout_sec || 20,
  };
});
ipcMain.handle("llm:save", (_e, partial) => saveLlmConfig(partial || {}));
ipcMain.handle("llm:test", async (_e, partial) => {
  const cfg = { ...loadLlmConfig(), ...(partial || {}), enabled: true };
  // Write temp so python module can also read; but we pass via stdin to client.py __main__
  return spawnPythonJson("user_data/llm_gateway/client.py", cfg);
});

ipcMain.handle("exchange:test", async (_e, opts) => {
  const s = { ...loadUiSettings(), ...(opts || {}) };
  return spawnPythonJson("scripts/test_exchange.py", {
    exchange: s.exchange || "binance",
    apiKey: s.apiKey || "",
    apiSecret: s.apiSecret || "",
    password: s.password || "",
  });
});

ipcMain.handle("ft:isRunning", () => !!(ftProc && ftProc.exitCode === null && !ftProc.killed));

ipcMain.handle("ft:stop", async () => {
  if (ftProc && !ftProc.killed) {
    ftProc.kill("SIGTERM");
    sendLog("[系统] 已发送停止信号\n");
    ftAccessToken = null;
    ftApiMeta = null;
    sendStatus({ running: false, apiReady: false });
    return true;
  }
  return false;
});

ipcMain.handle("ft:api", async (_e, req) => {
  const action = req?.action;
  if (action === "meta") {
    return {
      ok: !!(ftApiMeta && ftAccessToken),
      base: ftApiMeta?.base || null,
      wsUrl: ftApiMeta
        ? `ws://127.0.0.1:${ftApiMeta.port}/api/v1/message/ws?token=${encodeURIComponent(ftApiMeta.wsToken)}`
        : null,
      apiReady: !!(ftApiMeta && ftAccessToken),
    };
  }
  if (!ftApiMeta || !ftAccessToken) {
    return { ok: false, error: "机器人未连接 api_server" };
  }
  const map = {
    ping: ["/api/v1/ping", {}],
    status: ["/api/v1/status", {}],
    profit: ["/api/v1/profit", {}],
    balance: ["/api/v1/balance", {}],
    count: ["/api/v1/count", {}],
    whitelist: ["/api/v1/whitelist", {}],
    blacklist: ["/api/v1/blacklist", {}],
    locks: ["/api/v1/locks", {}],
    logs: ["/api/v1/logs", { limit: req?.limit || 100 }],
    show_config: ["/api/v1/show_config", {}],
    performance: ["/api/v1/performance", {}],
    stats: ["/api/v1/stats", {}],
    pair_candles: [
      "/api/v1/pair_candles",
      { pair: req?.pair, timeframe: req?.timeframe || "5m", limit: req?.limit || 120 },
    ],
    open_orders: ["/api/v1/status", {}], // open trades double as positions; orders via trades
  };
  const entry = map[action];
  if (!entry) return { ok: false, error: `未知 action: ${action}` };
  return ftGet(entry[0], entry[1]);
});

ipcMain.handle("ft:start", async (_e, opts) => {
  if (ftProc && ftProc.exitCode === null && !ftProc.killed) {
    return { ok: false, error: "已有实例在运行，请先停止" };
  }
  const key = opts?.strategyKey || "spot_ma";
  const meta = STRATEGY_MAP[key];
  if (!meta) return { ok: false, error: "请选择具体策略页再启动" };

  const ud = userDataDir();
  const cfgPath = path.join(ud, meta.config);
  if (!fs.existsSync(cfgPath)) {
    return { ok: false, error: `配置不存在: ${meta.config}` };
  }

  let data;
  try {
    data = JSON.parse(fs.readFileSync(cfgPath, "utf8"));
  } catch (err) {
    return { ok: false, error: `配置读取失败：${err.message || err}` };
  }

  const ui = loadUiSettings();
  const dryRun = opts?.dryRun !== undefined ? opts.dryRun !== false : ui.dryRun !== false;
  data.dry_run = dryRun;

  data.exchange = data.exchange || {};
  const exchangeId = opts?.exchange || ui.exchange || data.exchange.name || "binance";
  data.exchange.name = exchangeId;
  const apiKey = opts?.apiKey !== undefined ? opts.apiKey : ui.apiKey;
  const apiSecret = opts?.apiSecret !== undefined ? opts.apiSecret : ui.apiSecret;
  const passphrase = opts?.password !== undefined ? opts.password : ui.password;
  if (apiKey) data.exchange.key = apiKey;
  if (apiSecret) data.exchange.secret = apiSecret;
  if (passphrase) data.exchange.password = passphrase;

  if (opts?.pairs && Array.isArray(opts.pairs) && opts.pairs.length) {
    data.exchange.pair_whitelist = opts.pairs;
  }
  if (opts?.timeframe) data.timeframe = opts.timeframe;
  if (opts?.leverageMax && data.trading_mode === "futures") {
    data._ui_leverage_cap = opts.leverageMax;
  }

  // Always enable api_server for live UI
  const port = DEFAULT_API.listen_port;
  data.api_server = {
    ...DEFAULT_API,
    ...(data.api_server || {}),
    enabled: true,
    listen_ip_address: "127.0.0.1",
    listen_port: port,
    jwt_secret_key: (data.api_server && data.api_server.jwt_secret_key) || DEFAULT_API.jwt_secret_key,
    ws_token: (data.api_server && data.api_server.ws_token) || DEFAULT_API.ws_token,
    username: (data.api_server && data.api_server.username) || DEFAULT_API.username,
    password: (data.api_server && data.api_server.password) || DEFAULT_API.password,
  };

  const runtime = path.join(ud, "config", "_runtime_config.json");
  fs.mkdirSync(path.dirname(runtime), { recursive: true });
  fs.writeFileSync(runtime, JSON.stringify(data, null, 2), "utf8");

  // Persist exchange into ui settings (not secrets to git — local only)
  saveUiSettings({
    exchange: exchangeId,
    apiKey: apiKey || "",
    apiSecret: apiSecret || "",
    password: passphrase || "",
    dryRun,
  });

  const ft = findFreqtrade();
  const args = [
    "trade",
    "--config",
    runtime,
    "--strategy",
    meta.strategy,
    "--userdir",
    ud,
    "--recursive-strategy-search",
  ];
  if (key === "freqai_lgbm") {
    args.push("--freqaimodel", "LightGBMRegressor");
  }

  sendLog(`$ ${ft} ${args.join(" ")}\n`);
  sendLog(`[系统] dry_run=${dryRun} · exchange=${exchangeId} · api_server=127.0.0.1:${port}\n`);
  sendStatus({ running: true, strategy: meta.label, dryRun, apiReady: false, exchange: exchangeId });

  try {
    ftProc = spawn(ft, args, {
      cwd: projectRoot(),
      env: { ...process.env, PYTHONUTF8: "1", PYTHONIOENCODING: "utf-8" },
      shell: process.platform === "win32",
    });
  } catch (err) {
    sendStatus({ running: false, apiReady: false });
    return { ok: false, error: `启动失败：${err.message || err}` };
  }

  ftProc.stdout?.on("data", (buf) => sendLog(buf.toString()));
  ftProc.stderr?.on("data", (buf) => sendLog(buf.toString()));
  ftProc.on("exit", (code) => {
    sendLog(`\n[进程结束] exit=${code}\n`);
    ftAccessToken = null;
    ftApiMeta = null;
    sendStatus({ running: false, apiReady: false });
    ftProc = null;
  });
  ftProc.on("error", (err) => {
    sendLog(
      `\n[启动失败] ${err.message}\n请先在安装目录创建虚拟环境并执行：pip install -r requirements.txt\n`
    );
    sendStatus({ running: false, apiReady: false, error: err.message });
    ftProc = null;
  });

  // Wait for api_server in background
  const base = `http://127.0.0.1:${port}`;
  ftApiMeta = {
    base,
    username: data.api_server.username,
    password: data.api_server.password,
    wsToken: data.api_server.ws_token,
    port,
  };
  (async () => {
    const ok = await waitForPing(base, 60000);
    if (!ok) {
      sendLog("[系统] 等待 api_server /ping 超时 — 界面将仅显示进程日志\n");
      sendStatus({ running: true, strategy: meta.label, dryRun, apiReady: false, exchange: exchangeId });
      return;
    }
    try {
      ftAccessToken = await ftLogin(base, data.api_server.username, data.api_server.password);
      sendLog("[系统] 已连接 Freqtrade api_server，模拟盘数据将实时刷新\n");
      sendStatus({ running: true, strategy: meta.label, dryRun, apiReady: true, exchange: exchangeId });
    } catch (err) {
      sendLog(`[系统] api_server 登录失败：${err.message}\n`);
      sendStatus({ running: true, strategy: meta.label, dryRun, apiReady: false, exchange: exchangeId });
    }
  })();

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
