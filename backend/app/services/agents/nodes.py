from pydantic import BaseModel, Field
import os
from langchain_core.messages import AIMessage, SystemMessage
from langchain_openai import OpenAIEmbeddings
from .state import AgentState
from ...llm import get_llm
from ...core.db import get_supabase

class IntentClassification(BaseModel):
    intent: str = Field(description="The user intent. Must be one of: 'memory', 'productivity', 'external', 'chat'")

def router_node(state: AgentState):
    llm = get_llm(state.get("settings"))
    last_message = state["messages"][-1].content
    
    prompt = f"""Classify the following user message into one of four intents:
1. 'memory': User is stating a personal fact or asking to remember/recall something about themselves.
2. 'productivity': User is asking to create a task, note, or list.
3. 'external': User is asking about calendar events, emails, or anything that requires an external service integration.
4. 'chat': General conversation or anything else.

Reply with a JSON object containing a single key "intent" with the value.
Message: {last_message}
"""
    try:
        structured_llm = llm.with_structured_output(IntentClassification)
        result = structured_llm.invoke(prompt)
        intent = result.intent
    except Exception:
        intent = "chat"
        
    return {"intent": intent}

def memory_node(state: AgentState):
    last_message = state["messages"][-1].content
    user_id = state.get("user_id")
    supabase = get_supabase()
    
    try:
        embeddings = OpenAIEmbeddings(
            api_key=state.get("settings", {}).get("apiKey") or os.getenv("OPENAI_API_KEY", "dummy"),
            base_url=state.get("settings", {}).get("baseUrl") or os.getenv("OPENAI_BASE_URL")
        )
        vector = embeddings.embed_query(last_message)
        
        if supabase and user_id:
            supabase.table("memories").insert({
                "user_id": user_id,
                "content": last_message,
                "embedding": vector
            }).execute()
    except Exception as e:
        pass

    response = AIMessage(content="I've noted that fact in my memory system.")
    return {"messages": [response]}

def productivity_node(state: AgentState):
    response = AIMessage(content="", additional_kwargs={
        "tool_calls": [{
            "id": "call_task_123",
            "type": "function",
            "function": {
                "name": "render_task_list",
                "arguments": '{"tasks": ["Deploy GlowOS to Coolify", "Test BYOM", "Relax"]}'
            }
        }]
    })
    return {"messages": [response]}

def chat_node(state: AgentState):
    llm = get_llm(state.get("settings"))
    response = llm.invoke(state["messages"])
    return {"messages": [response]}

def mcp_node(state: AgentState):
    llm = get_llm(state.get("settings"))
    import httpx
    try:
        response = httpx.get("http://127.0.0.1:8000/api/mcp/calendar/tools")
        if response.status_code == 200:
            tools = response.json().get("tools", [])
        else:
            tools = []
    except Exception:
        tools = []
    
    if tools:
        llm_with_tools = llm.bind_tools(tools)
        response = llm_with_tools.invoke(state["messages"])
    else:
        response = llm.invoke(state["messages"])
        
    return {"messages": [response]}
