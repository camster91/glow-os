"""LLM Provider — GlowOS AI Brain"""
import os, logging
from typing import Optional
from langchain_openai import ChatOpenAI

logger = logging.getLogger(__name__)

def _decrypt(encrypted: str, secret: str) -> str:
    """AES-256-GCM inline decryption."""
    import base64, hashlib
    from cryptography.hazmat.primitives.ciphers.aead import AESGCM
    data = base64.b64decode(encrypted)
    key = hashlib.sha256(secret.encode()).digest()
    nonce, ciphertext = data[:12], data[12:]
    return AESGCM(key).decrypt(nonce, ciphertext, None).decode()

def get_llm(settings: Optional[dict] = None) -> ChatOpenAI:
    try:
        from supabase import create_client
        from ..core.config import settings as cfg
        if cfg.SUPABASE_URL and cfg.SUPABASE_KEY:
            sb = create_client(cfg.SUPABASE_URL, cfg.SUPABASE_KEY)
            result = sb.table("encrypted_vault").select("encrypted_key","service").execute()
            for row in (result.data or []):
                if row.get("service") == "openai":
                    key = _decrypt(row["encrypted_key"], cfg.CRYPT_SECRET or "")
                    logger.info("LLM: using encrypted vault key")
                    return ChatOpenAI(model="gpt-4o-mini", api_key=key)
    except Exception as e:
        logger.warning(f"Vault unavailable: {e}")
    key = os.getenv("OPENAI_API_KEY") or os.getenv("ANTHROPIC_API_KEY")
    if key:
        logger.info("LLM: using environment key")
        return ChatOpenAI(model="gpt-4o-mini", api_key=key)
    logger.warning("LLM: no key — demo mode")
    return ChatOpenAI(model="gpt-4o-mini", api_key="DEMO")
