from supabase import create_client, Client
from .config import settings
import logging

logger = logging.getLogger(__name__)

def get_supabase() -> Client | None:
    url = settings.SUPABASE_URL
    key = settings.SUPABASE_KEY
    if not url or not key:
        logger.warning("Supabase URL or Key is missing. Database operations will fail.")
        return None
    try:
        return create_client(url, key)
    except Exception as e:
        logger.error(f"Failed to initialize Supabase client: {e}")
        return None
