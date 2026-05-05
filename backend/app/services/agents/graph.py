from langgraph.graph import StateGraph, END
from .state import AgentState
from .nodes import router_node, memory_node, productivity_node, chat_node, mcp_node

def route_intent(state: AgentState) -> str:
    intent = state.get("intent", "chat")
    if intent == "memory":
        return "memory"
    elif intent == "productivity":
        return "productivity"
    elif intent == "external":
        return "external_tool"
    return "chat"

def build_graph():
    workflow = StateGraph(AgentState)
    
    workflow.add_node("router", router_node)
    workflow.add_node("memory", memory_node)
    workflow.add_node("productivity", productivity_node)
    workflow.add_node("chat", chat_node)
    workflow.add_node("external_tool", mcp_node)
    
    workflow.set_entry_point("router")
    
    workflow.add_conditional_edges(
        "router",
        route_intent,
        {
            "memory": "memory",
            "productivity": "productivity",
            "external_tool": "external_tool",
            "chat": "chat"
        }
    )
    
    workflow.add_edge("memory", END)
    workflow.add_edge("productivity", END)
    workflow.add_edge("external_tool", END)
    workflow.add_edge("chat", END)
    
    return workflow.compile()

graph = build_graph()
