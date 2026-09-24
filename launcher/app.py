#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
币安量化启动器 — 包装 Freqtrade dry-run / 实盘命令
面向非技术用户：选策略 → 填 API（可选）→ 启动模拟盘
"""
from __future__ import annotations

import json
import os
import subprocess
import sys
import threading
import tkinter as tk
from pathlib import Path
from tkinter import messagebox, scrolledtext, ttk

# 项目根：安装后通常是 Program Files\BinanceQuantTrader
ROOT = Path(__file__).resolve().parents[1]
USER_DATA = ROOT / "user_data"
CONFIG_DIR = USER_DATA / "config"
STRATEGIES = {
    "均线交叉（现货 MACrossover）": {
        "config": CONFIG_DIR / "config_spot.json",
        "strategy": "MACrossover",
        "mode": "spot",
    },
    "网格/DCA（现货 GridSpot）": {
        "config": CONFIG_DIR / "config_grid.json",
        "strategy": "GridSpot",
        "mode": "spot",
    },
    "合约趋势（FuturesTrendLeverage）": {
        "config": CONFIG_DIR / "config_futures.json",
        "strategy": "FuturesTrendLeverage",
        "mode": "futures",
    },
}


def find_freqtrade() -> str:
    """优先使用安装目录内嵌 venv，其次 PATH。"""
    candidates = [
        ROOT / ".venv" / "Scripts" / "freqtrade.exe",
        ROOT / ".venv" / "bin" / "freqtrade",
        ROOT / "python" / "Scripts" / "freqtrade.exe",
        ROOT / "python" / "bin" / "freqtrade",
    ]
    for c in candidates:
        if c.exists():
            return str(c)
    return "freqtrade"


def patch_config_keys(config_path: Path, api_key: str, api_secret: str, dry_run: bool) -> Path:
    """写出一份临时 config（不覆盖模板），注入 key 与 dry_run。"""
    data = json.loads(config_path.read_text(encoding="utf-8"))
    data["dry_run"] = dry_run
    data.setdefault("exchange", {})
    if api_key:
        data["exchange"]["key"] = api_key
    if api_secret:
        data["exchange"]["secret"] = api_secret
    out = USER_DATA / "config" / "_runtime_config.json"
    out.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
    return out


class LauncherApp(tk.Tk):
    def __init__(self) -> None:
        super().__init__()
        self.title("币安量化交易套件 · Freqtrade 启动器")
        self.geometry("720x560")
        self.minsize(640, 480)
        self._proc: subprocess.Popen | None = None
        self._build_ui()

    def _build_ui(self) -> None:
        pad = {"padx": 10, "pady": 6}
        frm = ttk.Frame(self)
        frm.pack(fill=tk.BOTH, expand=True, **pad)

        ttk.Label(frm, text="选择策略", font=("", 11, "bold")).pack(anchor=tk.W)
        self.strategy_var = tk.StringVar(value=list(STRATEGIES.keys())[0])
        ttk.Combobox(
            frm,
            textvariable=self.strategy_var,
            values=list(STRATEGIES.keys()),
            state="readonly",
            width=50,
        ).pack(anchor=tk.W, fill=tk.X)

        ttk.Label(frm, text="Binance API Key（模拟盘可留空）").pack(anchor=tk.W, pady=(12, 0))
        self.key_var = tk.StringVar()
        ttk.Entry(frm, textvariable=self.key_var, width=60).pack(anchor=tk.W, fill=tk.X)

        ttk.Label(frm, text="Binance API Secret").pack(anchor=tk.W)
        self.secret_var = tk.StringVar()
        ttk.Entry(frm, textvariable=self.secret_var, show="*", width=60).pack(anchor=tk.W, fill=tk.X)

        self.dry_var = tk.BooleanVar(value=True)
        ttk.Checkbutton(
            frm,
            text="模拟盘 dry_run（强烈建议保持勾选；取消=实盘，可能亏损全部本金）",
            variable=self.dry_var,
        ).pack(anchor=tk.W, pady=(8, 4))

        btn_row = ttk.Frame(frm)
        btn_row.pack(fill=tk.X, pady=8)
        ttk.Button(btn_row, text="启动交易机器人", command=self.start_bot).pack(side=tk.LEFT, padx=(0, 8))
        ttk.Button(btn_row, text="列出策略", command=self.list_strategies).pack(side=tk.LEFT, padx=(0, 8))
        ttk.Button(btn_row, text="停止", command=self.stop_bot).pack(side=tk.LEFT)

        ttk.Label(frm, text="日志输出").pack(anchor=tk.W)
        self.log = scrolledtext.ScrolledText(frm, height=18, state=tk.DISABLED)
        self.log.pack(fill=tk.BOTH, expand=True)

        warn = (
            "风险提示：量化交易有本金损失风险。默认仅为 Freqtrade 模拟盘。"
            "本程序基于开源 Freqtrade（GPL-3），不构成投资建议。"
        )
        ttk.Label(frm, text=warn, wraplength=680, foreground="#a60").pack(anchor=tk.W, pady=6)

    def append_log(self, text: str) -> None:
        self.log.configure(state=tk.NORMAL)
        self.log.insert(tk.END, text)
        self.log.see(tk.END)
        self.log.configure(state=tk.DISABLED)

    def _run_cmd(self, args: list[str]) -> None:
        def worker() -> None:
            self.append_log(f"$ {' '.join(args)}\n")
            try:
                self._proc = subprocess.Popen(
                    args,
                    cwd=str(ROOT),
                    stdout=subprocess.PIPE,
                    stderr=subprocess.STDOUT,
                    text=True,
                    encoding="utf-8",
                    errors="replace",
                    env={**os.environ, "PYTHONUTF8": "1"},
                )
                assert self._proc.stdout is not None
                for line in self._proc.stdout:
                    self.append_log(line)
                code = self._proc.wait()
                self.append_log(f"\n[进程结束] exit={code}\n")
            except FileNotFoundError:
                self.append_log(
                    "\n错误：找不到 freqtrade。请确认已安装依赖，或使用 setup.exe 完整安装。\n"
                )
            except Exception as exc:  # noqa: BLE001
                self.append_log(f"\n错误：{exc}\n")
            finally:
                self._proc = None

        threading.Thread(target=worker, daemon=True).start()

    def start_bot(self) -> None:
        if self._proc is not None:
            messagebox.showwarning("提示", "已有进程在运行，请先停止。")
            return
        if not self.dry_var.get():
            ok = messagebox.askyesno(
                "实盘确认",
                "你即将关闭模拟盘并使用实盘 API！\n可能造成真实资金亏损。确定继续？",
            )
            if not ok:
                return
        meta = STRATEGIES[self.strategy_var.get()]
        cfg = patch_config_keys(
            meta["config"],
            self.key_var.get().strip(),
            self.secret_var.get().strip(),
            self.dry_var.get(),
        )
        ft = find_freqtrade()
        args = [
            ft,
            "trade",
            "--config",
            str(cfg),
            "--strategy",
            meta["strategy"],
            "--userdir",
            str(USER_DATA),
        ]
        self._run_cmd(args)

    def list_strategies(self) -> None:
        ft = find_freqtrade()
        args = [ft, "list-strategies", "--userdir", str(USER_DATA)]
        self._run_cmd(args)

    def stop_bot(self) -> None:
        if self._proc and self._proc.poll() is None:
            self._proc.terminate()
            self.append_log("\n[已发送停止信号]\n")
        else:
            self.append_log("\n[当前无运行进程]\n")


def main() -> None:
    # Windows 高 DPI 友好
    try:
        from ctypes import windll  # type: ignore

        windll.shcore.SetProcessDpiAwareness(1)
    except Exception:
        pass
    app = LauncherApp()
    app.mainloop()


if __name__ == "__main__":
    main()
