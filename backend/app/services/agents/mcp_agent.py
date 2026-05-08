import httpx
import logging
from typing import List, Dict

from ..core.db import get_supabase

logger = logging.getLogger(__name__)


async def fetch_mcp_tools() -> List[Dict]:
    """Fetch tools from all active MCP servers."""
    tools = []

    # Fetch active servers from Supabase MCP Registry
    supabase = get_supabase()
    active_servers = []
    if supabase:
        try:
            response = supabase.table("mcp_registry").select("server_name, server_url").eq("status", "active").execute()
            active_servers = [{"name": r["server_name"], "url": r["server_url"]} for r in response.data]
        except Exception as e:
            logger.error(f"Failed to fetch MCP registry from Supabase: {e}")

    # Fallback for local testing if DB is empty/unreachable
    if not active_servers:
        active_servers = [
            {"name": "Mock Calendar", "url": "http://127.0.0.1:8000/api/mcp/calendar"}
        ]
    async with httpx.AsyncClient() as client:
        for server in active_servers:
            try:
                response = await client.get(f"{server['url']}/tools", timeout=10.0)
                if response.status_code == 200:
                    data = response.json()
                    tools.extend(data.get("tools", []))
            except httpx.TimeoutException:
                logger.warning(f"MCP server timed out: {server['url']}")
            except httpx.RequestError as e:
                logger.warning(f"Failed to fetch tools from MCP server {server['url']}: {e}")
            except Exception as e:
                logger.error(f"Unexpected error fetching MCP tools from {server['url']}: {e}")
    return tools
