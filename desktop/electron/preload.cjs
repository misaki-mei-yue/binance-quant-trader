const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("bq", {
  minimize: () => ipcRenderer.invoke("win:minimize"),
  maximize: () => ipcRenderer.invoke("win:maximize"),
  close: () => ipcRenderer.invoke("win:close"),
  platform: process.platform,
  getPaths: () => ipcRenderer.invoke("app:getPaths"),
  start: (opts) => ipcRenderer.invoke("ft:start", opts),
  stop: () => ipcRenderer.invoke("ft:stop"),
  isRunning: () => ipcRenderer.invoke("ft:isRunning"),
  listStrategies: () => ipcRenderer.invoke("ft:listStrategies"),
  ftApi: (req) => ipcRenderer.invoke("ft:api", req),
  getSettings: () => ipcRenderer.invoke("settings:get"),
  saveSettings: (partial) => ipcRenderer.invoke("settings:save", partial),
  testExchange: (opts) => ipcRenderer.invoke("exchange:test", opts),
  getLlm: () => ipcRenderer.invoke("llm:get"),
  saveLlm: (partial) => ipcRenderer.invoke("llm:save", partial),
  testLlm: (partial) => ipcRenderer.invoke("llm:test", partial),
  onLog: (cb) => {
    const listener = (_e, line) => cb(line);
    ipcRenderer.on("ft:log", listener);
    return () => ipcRenderer.removeListener("ft:log", listener);
  },
  onStatus: (cb) => {
    const listener = (_e, payload) => cb(payload);
    ipcRenderer.on("ft:status", listener);
    return () => ipcRenderer.removeListener("ft:status", listener);
  },
});
