from fastapi import APIRouter

router = APIRouter()

@router.get("/calendar/tools")
def get_calendar_tools():
    """Mock MCP Server returning its available tools."""
    return {
        "tools": [
            {
                "type": "function",
                "function": {
                    "name": "get_upcoming_events",
                    "description": "Get upcoming events from the user's calendar."
                }
            }
        ]
    }

@router.post("/calendar/execute")
def execute_calendar_tool(payload: dict):
    """Mock MCP Server executing a tool."""
    if payload.get("tool_name") == "get_upcoming_events":
        return {"events": ["Team Sync at 10 AM", "Doctor Appointment at 3 PM"]}
    return {"error": "Unknown tool"}
