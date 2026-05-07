from pydantic_settings import BaseSettings
import os

class Settings(BaseSettings):
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""
    # AES-256 encryption key for LLM API keys (32 bytes hex-encoded)
    CRYPT_SECRET: str = os.getenv("CRYPT_SECRET", "")

    class Config:
        env_file = ".env"

settings = Settings()
