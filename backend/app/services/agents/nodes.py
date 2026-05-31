from pydantic import BaseModel, Field
import os
import uuid
import logging
from langchain_core.messages import AIMessage
from langchain_openai import OpenAIEmbeddings
from .state import AgentState
from ...llm import get_llm
from ...core.db import get_supabase

logger = logging.getLogger(__name__)

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
    except Exception as e:
        logger.warning(f"Failed to classify intent, defaulting to 'chat': {e}")
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
        logger.error(f"Failed to store memory for user {user_id}: {e}")
        response = AIMessage(content="I had trouble saving that to my memory. Please try again.")
        return {"messages": [response]}

    response = AIMessage(content="I've noted that fact in my memory system.")
    return {"messages": [response]}


class TaskIntentClassification(BaseModel):
    action: str = Field(
        description="Must be one of: 'create', 'list', 'update', 'delete', 'unknown'"
    )
    parsed_tasks: list[str] = Field(
        description="Extracted task strings from the user's message. Only populated for 'create' action."
    )


def productivity_node(state: AgentState):
    """
    Handles productivity intents: creating, listing, updating, or deleting tasks.
    Uses LLM to classify the task sub-action and extract task data, then performs
    real DB operations against the tasks table.
    """
    last_message = state["messages"][-1].content
    user_id = state.get("user_id")
    settings = state.get("settings", {})
    supabase = get_supabase()

    # Classify the task sub-intent via LLM
    llm = get_llm(settings)
    prompt = f"""You are a task intent classifier. Given a user message about tasks or todos,
classify it into one of the following actions:
- 'create': User wants to add a new task or todo item
- 'list': User wants to see their tasks/todos
- 'update': User wants to mark a task complete/incomplete, or edit it
- 'delete': User wants to remove a task
- 'unknown': Cannot determine intent

Also extract all task strings mentioned in the message (for 'create').

Return a JSON object with keys:
- "action": one of the above strings
- "parsed_tasks": array of task strings (only needed for 'create', can be empty otherwise)

User message: {last_message}
"""
    try:
        structured_llm = llm.with_structured_output(TaskIntentClassification)
        result = structured_llm.invoke(prompt)
        action = result.action
        parsed_tasks = result.parsed_tasks
    except Exception:
        action = "unknown"
        parsed_tasks = []

    content = ""
    tool_calls = []

    if action == "create" and parsed_tasks:
        # Insert tasks into DB
        if supabase and user_id:
            try:
                for task_text in parsed_tasks:
                    supabase.table("tasks").insert({
                        "id": str(uuid.uuid4()),
                        "user_id": user_id,
                        "title": task_text,
                        "completed": False,
                    }).execute()
                content = f"Created {len(parsed_tasks)} task(s): {', '.join(parsed_tasks)}"
            except Exception:
                content = "I had trouble saving those tasks to the database."
        else:
            # No DB available — return tool call for frontend to render
            tool_calls = [{
                "id": f"call_task_{uuid.uuid4().hex[:8]}",
                "type": "function",
                "function": {
                    "name": "render_task_list",
                    "arguments": '{"tasks": ' + str(parsed_tasks) + "}"
                }
            }]
            content = f"I'd like to create these tasks: {', '.join(parsed_tasks)}. (Database not connected.)"

    elif action == "list":
        # Fetch tasks from DB
        if supabase and user_id:
            try:
                response = supabase.table("tasks").select(
                    "id, title, completed"
                ).eq("user_id", user_id).order("created_at", ascending=True).execute()
                rows = response.data or []
                if rows:
                    tasks = [r["title"] for r in rows]
                    tool_calls = [{
                        "id": f"call_task_{uuid.uuid4().hex[:8]}",
                        "type": "function",
                        "function": {
                            "name": "render_task_list",
                            "arguments": '{"tasks": ' + str(tasks) + "}"
                        }
                    }]
                    content = f"You have {len(tasks)} task(s)."
                else:
                    content = "You have no tasks yet."
            except Exception:
                content = "I had trouble fetching your tasks."
        else:
            content = "I can't reach the database to list your tasks."

    elif action == "update":
        # Mark a specific task as complete/incomplete based on keywords in message
        if supabase and user_id:
            try:
                # Simple heuristic: "done" / "complete" / "finished" = complete
                lower = last_message.lower()
                completed = any(k in lower for k in ["done", "complete", "finished", "mark complete"])
                incomplete = any(k in lower for k in ["undone", "incomplete", "reopen", "mark incomplete"])

                if completed or incomplete:
                    # Try to find the task title from the message to scope the update
                    task_title = None
                    
                    # First, try to find quoted task title
                    for quote in ["'", '"']:
                        if quote in last_message:
                            parts = last_message.split(quote)
                            if len(parts) >= 3:
                                task_title = parts[1].strip()
                                break
                    
                    # If no quoted text, try to extract after "mark" keyword
                    if not task_title:
                        for kw in ["mark complete", "mark done", "mark incomplete", "mark undone"]:
                            if kw in lower:
                                after = lower.split(kw, 1)
                                if len(after) > 1:
                                    candidate = after[1].strip().strip('"\'.,!? ')
                                    if candidate:
                                        task_title = candidate
                                        break

                    if task_title:
                        # Update only the specific task matching the title
                        supabase.table("tasks").update({
                            "completed": completed
                        }).eq("user_id", user_id).eq("title", task_title).execute()
                        status = "completed" if completed else "reopened"
                        content = f"Task \"{task_title}\" marked as {status}."
                    else:
                        content = "I couldn\'t determine which task to update. Try saying \'mark [task] as done\' or \'mark [task] as incomplete\'."
                else:
                    content = "I couldn\'t determine which task to update. Try saying \'mark [task] as done\' or \'mark [task] as incomplete\'."
            except Exception:
                content = "I had trouble updating your task."
        else:
            content = "I can\'t reach the database to update your task."

    elif action == "delete":
        # Delete a task by title if mentioned
        if supabase and user_id:
            try:
                lower = last_message.lower()
                # Extract potential task title (simple approach: text after "delete" or "remove")
                deleted = False
                for kw in ["delete", "remove", "clear"]:
                    if f"{kw} " in lower:
                        # grab everything after the keyword as the task name
                        parts = lower.split(kw, 1)
                        if len(parts) > 1:
                            title_part = parts[1].strip().strip(" .,")
                            if title_part:
                                supabase.table("tasks").delete().eq(
                                    "user_id", user_id
                                ).eq("title", title_part).execute()
                                content = f"Deleted task: {title_part}"
                                deleted = True
                                break
                if not deleted:
                    content = "I couldn't find which task to delete. Try saying 'delete [task name]'."
            except Exception:
                content = "I had trouble deleting your task."
        else:
            content = "I can't reach the database to delete your task."

    else:
        content = "I'm not sure what you'd like me to do with your tasks. You can ask me to create a task, list your tasks, mark a task as done, or delete a task."

    response = AIMessage(content=content, additional_kwargs={"tool_calls": tool_calls} if tool_calls else {})
    return {"messages": [response]}

def chat_node(state: AgentState):
    llm = get_llm(state.get("settings"))
    response = llm.invoke(state["messages"])
    return {"messages": [response]}

def mcp_node(state: AgentState):
    llm = get_llm(state.get("settings"))
    import httpx
    try:
        response = httpx.get("http://127.0.0.1:8000/api/mcp/calendar/tools", timeout=10.0)
        if response.status_code == 200:
            tools = response.json().get("tools", [])
        else:
            logger.warning(f"MCP calendar returned status {response.status_code}")
            tools = []
    except httpx.TimeoutException:
        logger.warning("MCP calendar server timed out")
        tools = []
    except httpx.RequestError as e:
        logger.warning(f"Failed to connect to MCP calendar server: {e}")
        tools = []
    except Exception as e:
        logger.error(f"Unexpected error fetching MCP calendar tools: {e}")
        tools = []

    if tools:
        llm_with_tools = llm.bind_tools(tools)
        response = llm_with_tools.invoke(state["messages"])
    else:
        response = llm.invoke(state["messages"])

    return {"messages": [response]}
