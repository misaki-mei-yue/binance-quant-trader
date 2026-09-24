"""OpenAI-compatible client helper (LiteLLM-compatible base_url pattern)."""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any

DEFAULT_CONFIG_PATH = Path(__file__).resolve().parents[1] / "config" / "llm.json"


def load_llm_config(path: Path | None = None) -> dict[str, Any]:
    cfg_path = path or DEFAULT_CONFIG_PATH
    if not cfg_path.exists():
        return {
            "base_url": "",
            "api_key": "",
            "model_name": "",
            "enabled": False,
            "timeout_sec": 20,
        }
    try:
        data = json.loads(cfg_path.read_text(encoding="utf-8"))
    except Exception:
        return {
            "base_url": "",
            "api_key": "",
            "model_name": "",
            "enabled": False,
            "timeout_sec": 20,
        }
    return {
        "base_url": str(data.get("base_url") or "").rstrip("/"),
        "api_key": str(data.get("api_key") or os.environ.get("OPENAI_API_KEY") or ""),
        "model_name": str(data.get("model_name") or ""),
        "enabled": bool(data.get("enabled", False)),
        "timeout_sec": int(data.get("timeout_sec") or 20),
    }


def _make_client(cfg: dict[str, Any]):
    try:
        from openai import OpenAI
    except ImportError as exc:
        raise RuntimeError("未安装 openai 包，请 pip install openai") from exc
    if not cfg.get("base_url"):
        raise RuntimeError("未配置模型 base_url")
    if not cfg.get("model_name"):
        raise RuntimeError("未配置 model_name")
    return OpenAI(
        base_url=cfg["base_url"],
        api_key=cfg.get("api_key") or "sk-local",
        timeout=cfg.get("timeout_sec") or 20,
    )


def chat_json(
    system: str,
    user: str,
    *,
    cfg: dict[str, Any] | None = None,
    temperature: float = 0.1,
) -> dict[str, Any]:
    """Call chat.completions and parse a JSON object from the assistant message."""
    cfg = cfg or load_llm_config()
    if not cfg.get("enabled", True):
        raise RuntimeError("LLM 网关未启用（llm.json enabled=false）")
    client = _make_client(cfg)
    resp = client.chat.completions.create(
        model=cfg["model_name"],
        temperature=temperature,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        response_format={"type": "json_object"},
    )
    content = (resp.choices[0].message.content or "").strip()
    if content.startswith("```"):
        content = content.strip("`")
        if content.startswith("json"):
            content = content[4:].strip()
    return json.loads(content)


def test_connection(cfg: dict[str, Any] | None = None) -> dict[str, Any]:
    """Tiny ping for Settings「测通」button."""
    cfg = dict(cfg or load_llm_config())
    cfg["enabled"] = True
    try:
        client = _make_client(cfg)
        resp = client.chat.completions.create(
            model=cfg["model_name"],
            temperature=0,
            messages=[
                {"role": "system", "content": "Reply with JSON only."},
                {"role": "user", "content": '{"ping":true}'},
            ],
            max_tokens=32,
        )
        text = (resp.choices[0].message.content or "")[:200]
        return {"ok": True, "message": f"测通成功 · 模型已响应", "preview": text}
    except Exception as exc:
        return {"ok": False, "message": f"测通失败：{exc}", "error": str(exc)}


if __name__ == "__main__":
    import sys

    raw = sys.stdin.read().strip()
    payload = json.loads(raw) if raw else {}
    print(json.dumps(test_connection(payload), ensure_ascii=False))
