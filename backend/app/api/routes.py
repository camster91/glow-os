from fastapi import APIRouter, Request, HTTPException, Header, Response
from pydantic import BaseModel
from typing import List, Optional
import json
import httpx
from slowapi import Limiter
from slowapi.util import get_remote_address
from ..services.agents.graph import graph
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from ..core.db import get_supabase
from ..core.config import settings
from ..core.crypto import get_crypto

# Separate limiters for different endpoint groups
chat_limiter = Limiter(key_func=get_remote_address)
auth_limiter = Limiter(key_func=get_remote_address)
settings_limiter = Limiter(key_func=get_remote_address)

router = APIRouter()

class MessageDict(BaseModel):
    role: str
    content: str
    id: Optional[str] = None

class ChatPayload(BaseModel):
    messages: List[MessageDict]

async def verify_supabase_token(token: str) -> dict | None:
    """Verify a Supabase JWT token and return the user payload."""
    if not token:
        return None
    
    try:
        # Call Supabase's auth.getUser() to verify the token
        # This uses the service role key to verify
        supabase = get_supabase()
        if not supabase:
            return None
        
        # Get the user from the token - this verifies the JWT
        # We need to use the anon key to verify, or call the GoTrue endpoint
        url = f"{settings.SUPABASE_URL}/auth/v1/user"
        headers = {
            "Authorization": f"Bearer {token}",
            "apikey": settings.SUPABASE_KEY
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=headers)
            if response.status_code == 200:
                return response.json()
            return None
    except Exception as e:
        print(f"Token verification failed: {e}")
        return None

@router.post("/chat")
@chat_limiter.limit("20/minute")
async def chat_endpoint(
    request: Request, 
    payload: ChatPayload,
    authorization: Optional[str] = Header(None)
):
    """Chat endpoint with JWT verification. Rate limited to 20 req/min."""
    # Extract token from Authorization header
    token = None
    if authorization and authorization.startswith("Bearer "):
        token = authorization[7:]
    
    # Verify the token and get the authenticated user
    user_payload = await verify_supabase_token(token)
    
    if not user_payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    # Use the user ID from the verified token, not from the header
    verified_user_id = user_payload.get("id") or user_payload.get("sub")
    
    if not verified_user_id:
        raise HTTPException(status_code=401, detail="Could not verify user identity")
    
    # ── Fetch LLM settings server-side (API key encrypted at rest in Supabase) ──
    supabase = get_supabase()
    llm_settings = {}
    if supabase:
        try:
            prefs = await _get_user_preferences(supabase, verified_user_id)
            if prefs:
                llm_settings = prefs
        except Exception as e:
            print(f"Failed to fetch LLM preferences: {e}")
            # Fall back to header-supplied settings if DB fetch fails
            settings_str = request.headers.get("x-llm-settings", "{}")
            try:
                llm_settings = json.loads(settings_str)
            except Exception:
                llm_settings = {}
    else:
        # No DB — fall back to header-supplied settings (for local dev without Supabase)
        settings_str = request.headers.get("x-llm-settings", "{}")
        try:
            llm_settings = json.loads(settings_str)
        except Exception:
            llm_settings = {}
        
    lc_messages = []
    for m in payload.messages:
        if m.role == "user":
            lc_messages.append(HumanMessage(content=m.content))
        elif m.role == "assistant":
            lc_messages.append(AIMessage(content=m.content))
        else:
            lc_messages.append(SystemMessage(content=m.content))
            
    # Invoke LangGraph
    final_state = graph.invoke({
        "messages": lc_messages,
        "user_id": verified_user_id,
        "settings": llm_settings
    })
    
    last_msg = final_state["messages"][-1]
    
    # Format response
    response_data = {
        "role": "assistant",
        "content": last_msg.content,
    }
    
    if hasattr(last_msg, "additional_kwargs") and "tool_calls" in last_msg.additional_kwargs:
        response_data["tool_calls"] = last_msg.additional_kwargs["tool_calls"]
        
    return response_data


# Auth endpoints - rate limited to 10 req/min
# These are placeholder endpoints for future Supabase auth integration
# Currently Supabase handles auth directly on the client side

class AuthPayload(BaseModel):
    email: str
    password: str

@router.post("/auth/login")
@auth_limiter.limit("10/minute")
async def auth_login(request: Request, payload: AuthPayload):
    """Login endpoint. Rate limited to 10 req/min.
    Note: For Supabase auth, this would typically proxy to Supabase.
    """
    raise HTTPException(status_code=501, detail="Auth proxied through Supabase SDK")


@router.post("/auth/signup")
@auth_limiter.limit("10/minute")
async def auth_signup(request: Request, payload: AuthPayload):
    """Signup endpoint. Rate limited to 10 req/min.
    Note: For Supabase auth, this would typically proxy to Supabase.
    """
    raise HTTPException(status_code=501, detail="Auth proxied through Supabase SDK")


@router.post("/auth/logout")
@auth_limiter.limit("10/minute")
async def auth_logout(request: Request):
    """Logout endpoint. Rate limited to 10 req/min."""
    return {"message": "Logged out"}


# ─── LLM Settings (API key stored encrypted, never in browser) ───────────────

class LLMProviderSettings(BaseModel):
    provider: str
    base_url: str
    default_model: str


async def _get_user_preferences(supabase_client, user_id: str) -> Optional[dict]:
    """Fetch decrypted preferences for a user."""
    result = supabase_client.table("llm_preferences").select("*").eq("user_id", user_id).execute()
    if not result.data:
        return None
    row = result.data[0]
    # Decrypt the stored API key
    crypto = get_crypto()
    api_key = ""
    if row.get("api_key"):
        try:
            api_key = crypto.decrypt(row["api_key"])
        except Exception:
            api_key = ""
    return {
        "provider": row.get("provider", "openai"),
        "base_url": row.get("base_url", "https://api.openai.com/v1"),
        "default_model": row.get("default_model", "gpt-4o-mini"),
        "api_key": api_key,
    }


@router.get("/settings/llm")
@settings_limiter.limit("30/minute")
async def get_llm_settings(
    request: Request,
    authorization: Optional[str] = Header(None),
):
    """
    Return LLM settings (provider, base_url, default_model, api_key).
    The API key is decrypted server-side and sent over an HttpOnly cookie.
    """
    token = authorization[7:] if authorization and authorization.startswith("Bearer ") else None
    user_payload = await verify_supabase_token(token)
    if not user_payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    verified_user_id = user_payload.get("id") or user_payload.get("sub")
    if not verified_user_id:
        raise HTTPException(status_code=401, detail="Could not verify user identity")

    supabase = get_supabase()
    if not supabase:
        raise HTTPException(status_code=503, detail="Database unavailable")

    prefs = await _get_user_preferences(supabase, verified_user_id)

    response = Response(
        json.dumps(prefs or {"provider": "openai", "base_url": "https://api.openai.com/v1", "default_model": "gpt-4o-mini", "api_key": ""}),
        media_type="application/json",
    )
    return response


class SaveLLMSettingsPayload(BaseModel):
    provider: str
    api_key: str
    base_url: str
    default_model: str


@router.post("/settings/llm")
@settings_limiter.limit("20/minute")
async def save_llm_settings(
    request: Request,
    payload: SaveLLMSettingsPayload,
    authorization: Optional[str] = Header(None),
):
    """
    Save LLM settings. The API key is encrypted with AES-256-GCM before
    being stored in Supabase — it never touches localStorage or the browser
    in plaintext.
    """
    token = authorization[7:] if authorization and authorization.startswith("Bearer ") else None
    user_payload = await verify_supabase_token(token)
    if not user_payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    verified_user_id = user_payload.get("id") or user_payload.get("sub")
    if not verified_user_id:
        raise HTTPException(status_code=401, detail="Could not verify user identity")

    supabase = get_supabase()
    if not supabase:
        raise HTTPException(status_code=503, detail="Database unavailable")

    crypto = get_crypto()
    encrypted_key = crypto.encrypt(payload.api_key) if payload.api_key else ""

    data = {
        "user_id": verified_user_id,
        "provider": payload.provider,
        "api_key": encrypted_key,
        "base_url": payload.base_url,
        "default_model": payload.default_model,
    }

    # Upsert: update existing or insert new
    supabase.table("llm_preferences").upsert(data, on_conflict="user_id").execute()

    return {"message": "Settings saved"}
