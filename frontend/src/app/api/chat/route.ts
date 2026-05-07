import { NextResponse } from "next/server";
import { getUserFromSession } from "@/lib/supabase/server";

export async function POST(req: Request) {
  // Server-side JWT verification
  const user = await getUserFromSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get the session access token to pass to backend for verification
  const supabase = await import("@/lib/supabase/server").then(m => m.createServerSupabaseClient());
  const { data: { session } } = await supabase.auth.getSession();
  const accessToken = session?.access_token || "";

  const { messages } = await req.json();
  const llmSettings = req.headers.get("x-llm-settings") || "{}";

  try {
    const backendUrl = process.env.BACKEND_URL || "http://127.0.0.1:8000";
    const response = await fetch(`${backendUrl}/api/chat`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
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
