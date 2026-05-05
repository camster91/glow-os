import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { messages } = await req.json();
  const userId = req.headers.get("x-user-id") || "";
  const llmSettings = req.headers.get("x-llm-settings") || "{}";

  try {
    const backendUrl = process.env.BACKEND_URL || "http://127.0.0.1:8000";
    const response = await fetch(`${backendUrl}/api/chat`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "x-user-id": userId,
        "x-llm-settings": llmSettings
      },
      body: JSON.stringify({ messages }),
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error communicating with backend:", error);
    return NextResponse.json({ error: "Backend communication failed" }, { status: 500 });
  }
}
