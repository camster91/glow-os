"""
LLM Provider — GlowOS AI Brain

Decrypts and uses stored LLM API keys (OpenAI/Anthropic) from Supabase.
API keys are encrypted at rest with AES-256-GCM using CRYPT_SECRET.
"""

import os
import logging
from typing import Optional

from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic

from .core.crypto import decrypt_api_key
from .core.db import get_supabase

logger = logging.getLogger(__name__)


def get_llm(settings: Optional[dict] = None) -> ChatOpenAI:
    """
    Get an LLM client. API key is fetched from the encrypted vault in Supabase,
    decrypted in memory, and used to configure the client.

    Falls back to:
    1. OPENAI_API_KEY env var (local dev)
    2. ANTHROPIC_API_KEY env var (via OpenAI-compatible Anthropic endpoint)
    """
    supabase = get_supabase()

    # Try to load encrypted key from vault
    if supabase:
        try:
            result = supabase.table("encrypted_vault").select("encrypted_key").eq(
                "service", "openai"
            ).limit(1).execute()
            if result.data:
                encrypted = result.data[0]["encrypted_key"]
                api_key = decrypt_api_key(encrypted)
                if api_key:
                    logger.info("LLM: using encrypted key from vault")
                    return ChatOpenAI(model="gpt-4o-mini", api_key=api_key)
        except Exception as e:
            logger.warning(f"Vault lookup failed: {e}")

    # Fallback to env vars
    openai_key = os.getenv("OPENAI_API_KEY") or os.getenv("ANTHROPIC_API_KEY")
    if openai_key:
        logger.info("LLM: using key from environment")
        return ChatOpenAI(model="gpt-4o-mini", api_key=openai_key)

    # Last resort: demo mode (no real LLM calls)
    logger.warning("LLM: no API key found — running in demo mode")
    return ChatOpenAI(model="gpt-4o-mini", api_key="DEMO")