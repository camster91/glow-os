from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import json
from ..services.agents.graph import graph
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from ..core.db import get_supabase

router = APIRouter()

class MessageDict(BaseModel):
    role: str
    content: str
    id: Optional[str] = None

class ChatPayload(BaseModel):
    messages: List[MessageDict]

@router.post("/chat")
async def chat_endpoint(request: Request, payload: ChatPayload):
    user_id = request.headers.get("x-user-id")
    settings_str = request.headers.get("x-llm-settings", "{}")
    
    try:
        settings = json.loads(settings_str)
    except:
        settings = {}
        
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
    if supabase and user_id and payload.messages:
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
        "user_id": user_id,
        "settings": settings
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
