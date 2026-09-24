#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""命令行启动器：python -m launcher.cli --strategy spot|grid|futures"""
from __future__ import annotations

import argparse
import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
USER_DATA = ROOT / "user_data"

MAP = {
    "spot": ("user_data/config/config_spot.json", "MACrossover"),
    "grid": ("user_data/config/config_grid.json", "GridSpot"),
    "futures": ("user_data/config/config_futures.json", "FuturesTrendLeverage"),
}


def find_freqtrade() -> str:
    for c in (
        ROOT / ".venv" / "Scripts" / "freqtrade.exe",
        ROOT / ".venv" / "bin" / "freqtrade",
        ROOT / "python" / "Scripts" / "freqtrade.exe",
    ):
        if c.exists():
            return str(c)
    return "freqtrade"


def main() -> int:
    p = argparse.ArgumentParser(description="币安量化 Freqtrade 启动器")
    p.add_argument("--strategy", choices=list(MAP), default="spot")
    p.add_argument("--list", action="store_true", help="列出策略")
    args = p.parse_args()
    ft = find_freqtrade()
    if args.list:
        cmd = [ft, "list-strategies", "--userdir", str(USER_DATA)]
    else:
        cfg, strat = MAP[args.strategy]
        cmd = [
            ft,
            "trade",
            "--config",
            str(ROOT / cfg),
            "--strategy",
            strat,
            "--userdir",
            str(USER_DATA),
        ]
    print(" ".join(cmd))
    return subprocess.call(cmd, cwd=str(ROOT), env={**os.environ, "PYTHONUTF8": "1"})


if __name__ == "__main__":
    sys.exit(main())
