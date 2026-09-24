#!/usr/bin/env python3
"""Test CCXT exchange credentials. Usage: python test_exchange.py <<JSON"""
from __future__ import annotations

import json
import sys


def main() -> int:
    try:
        payload = json.loads(sys.stdin.read() or "{}")
    except Exception as exc:
        print(json.dumps({"ok": False, "message": f"参数无效：{exc}"}, ensure_ascii=False))
        return 1

    exchange_id = (payload.get("exchange") or "binance").strip().lower()
    api_key = payload.get("apiKey") or payload.get("key") or ""
    secret = payload.get("apiSecret") or payload.get("secret") or ""
    password = payload.get("password") or payload.get("passphrase") or ""
    sandbox = bool(payload.get("sandbox", False))

    try:
        import ccxt
    except ImportError:
        print(json.dumps({"ok": False, "message": "未安装 ccxt，请先 pip install -r requirements.txt"}, ensure_ascii=False))
        return 1

    if not hasattr(ccxt, exchange_id):
        print(json.dumps({"ok": False, "message": f"不支持的交易所 ID：{exchange_id}"}, ensure_ascii=False))
        return 1

    klass = getattr(ccxt, exchange_id)
    conf: dict = {"enableRateLimit": True, "timeout": 20000}
    if api_key:
        conf["apiKey"] = api_key
    if secret:
        conf["secret"] = secret
    if password:
        conf["password"] = password

    try:
        ex = klass(conf)
        if sandbox and hasattr(ex, "set_sandbox_mode"):
            try:
                ex.set_sandbox_mode(True)
            except Exception:
                pass
        # Public ping first (works without keys; may 451 on geo-block)
        markets = None
        try:
            markets = ex.load_markets()
        except Exception as exc:
            msg = str(exc)
            if "451" in msg or "restricted" in msg.lower():
                print(
                    json.dumps(
                        {
                            "ok": False,
                            "message": f"公共行情被拦截（可能地区限制 HTTP 451）。请在可访问该交易所的网络重试。详情：{exc}",
                            "code": "GEO_BLOCK",
                        },
                        ensure_ascii=False,
                    )
                )
                return 2
            print(json.dumps({"ok": False, "message": f"连接失败：{exc}"}, ensure_ascii=False))
            return 2

        if not api_key or not secret:
            n = len(markets or {})
            print(
                json.dumps(
                    {
                        "ok": True,
                        "message": f"公共 API 可达 · {exchange_id} · 市场数 {n}（未填密钥，仅测通网络）",
                        "markets": n,
                        "auth": False,
                    },
                    ensure_ascii=False,
                )
            )
            return 0

        # Private: fetch balance
        bal = ex.fetch_balance()
        total = bal.get("total") or {}
        non_zero = {k: v for k, v in total.items() if isinstance(v, (int, float)) and v}
        preview = ", ".join(f"{k}:{v}" for k, v in list(non_zero.items())[:5]) or "（空余额或仅交易权限）"
        print(
            json.dumps(
                {
                    "ok": True,
                    "message": f"密钥有效 · {exchange_id} · {preview}",
                    "auth": True,
                    "currencies": list(non_zero.keys())[:10],
                },
                ensure_ascii=False,
            )
        )
        return 0
    except Exception as exc:
        print(json.dumps({"ok": False, "message": f"测试失败：{exc}"}, ensure_ascii=False))
        return 3


if __name__ == "__main__":
    raise SystemExit(main())
