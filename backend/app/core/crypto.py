"""
Cryptographic utilities for encrypting LLM API keys at rest.

API keys are stored encrypted in the database (Supabase) and decrypted
only in memory on the backend when needed to call the LLM provider.
The plaintext key never reaches the browser or localStorage.
"""
import base64
import hashlib
import os
import json
from typing import Optional

from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from ..core.config import settings


class CryptoService:
    """
    Encrypts and decrypts API keys using AES-256-GCM.
    Key derivation: SHA-256 of CRYPT_SECRET -> 32-byte AES key.
    """

    def __init__(self, secret: Optional[str] = None):
        raw = secret or settings.CRYPT_SECRET
        if not raw:
            raise ValueError(
                'CRYPT_SECRET environment variable is required. '
                'Set a secure random secret (e.g. openssl rand -hex 32) and never use a hardcoded fallback.'
            )
        self._key: bytes = hashlib.sha256(raw.encode()).digest()
        self._aesgcm = AESGCM(self._key)

    def _get_nonce(self) -> bytes:
        """Generate a cryptographically random 12-byte nonce."""
        return os.urandom(12)

    def encrypt(self, plaintext: str) -> str:
        """
        Encrypt a plaintext string. Returns a base64-encoded JSON blob:
        {"v": 1, "nonce": "<base64>", "ct": "<base64>"}
        """
        nonce = self._get_nonce()
        ct = self._aesgcm.encrypt(nonce, plaintext.encode(), None)
        return base64.b64encode(
            json.dumps({"v": 1, "nonce": base64.b64encode(nonce).decode(), "ct": base64.b64encode(ct).decode()}).encode()
        ).decode()

    def decrypt(self, ciphertext: str) -> str:
        """
        Decrypt a ciphertext produced by self.encrypt(). Returns the plaintext.
        """
        outer = json.loads(base64.b64decode(ciphertext.encode()).decode())
        nonce = base64.b64decode(outer["nonce"])
        ct = base64.b64decode(outer["ct"])
        return self._aesgcm.decrypt(nonce, ct, None).decode()


# Module-level singleton
_crypto: Optional[CryptoService] = None


def get_crypto() -> CryptoService:
    global _crypto
    if _crypto is None:
        _crypto = CryptoService()
    return _crypto