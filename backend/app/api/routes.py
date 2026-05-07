from fastapi import APIRouter, Request, HTTPException, Header
from pydantic import BaseModel
from typing import List, Optional
import json
import httpx
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from ..services.agents.graph import graph
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from ..core.db import get_supabase
from ..core.config import settings

# Separate limiters for different endpoint groups
chat_limiter = Limiter(key_func=get_remote_address)
auth_limiter = Limiter(key_func=get_remote_address)

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
    
    # Also accept x-user-id from trusted frontend (after its JWT check)
    # But verify it came from a valid session
    untrusted_user_id = request.headers.get("x-user-id")
    
    # Verify the token and get the authenticated user
    user_payload = await verify_supabase_token(token)
    
    if not user_payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    # Use the user ID from the verified token, not from the header
    verified_user_id = user_payload.get("id") or user_payload.get("sub")
    
    if not verified_user_id:
        raise HTTPException(status_code=401, detail="Could not verify user identity")
    
    settings_str = request.headers.get("x-llm-settings", "{}")
    
    try:
        llm_settings = json.loads(settings_str)
    except:
        llm_settings = {}
        
    lc_messages = []
    for m in payload.messages:
        if m.role == "user":
            lc_messages.append(HumanMessage(content=m.content))
        elif m.role == "assistant":
            lc_messages.append(AIMessage(content=m.content))
        else:
            lc_messages.append(SystemMessage(content=m.content))
            
    # Save User message
    supabase = get_supabase()
    if supabase and verified_user_id and payload.messages:
        last_m = payload.messages[-1]
        if last_m.role == "user":
            try:
                # In full prod, we map to actual session_id
                pass
            except Exception:
                pass
            
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
