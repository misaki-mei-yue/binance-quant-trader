"""Thin OpenAI-compatible LLM gateway for strategies.

Works with OpenAI / DeepSeek / Qwen / Ollama / OpenRouter via base_url + api_key.
Does NOT vendor LiteLLM; uses the official openai Python client only.
"""

from .client import chat_json, load_llm_config, test_connection

__all__ = ["chat_json", "load_llm_config", "test_connection"]
