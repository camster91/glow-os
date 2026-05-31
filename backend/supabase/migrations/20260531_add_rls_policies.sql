-- Migration: Add Row Level Security to core tables that are missing RLS
-- Fixes #40: Missing Row Level Security on core Supabase tables

-- llm_preferences: users can only access their own preferences
ALTER TABLE public.llm_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_manage_own_llm_preferences" ON public.llm_preferences
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- chat_sessions: users can only access their own sessions
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_manage_own_chat_sessions" ON public.chat_sessions
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- messages: users can only access messages from their own sessions
-- Uses a subquery to check that the session belongs to the authenticated user
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_access_own_messages" ON public.messages
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.chat_sessions
            WHERE chat_sessions.id = messages.session_id
            AND chat_sessions.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.chat_sessions
            WHERE chat_sessions.id = messages.session_id
            AND chat_sessions.user_id = auth.uid()
        )
    );

-- mcp_registry: users can only access their own MCP servers
ALTER TABLE public.mcp_registry ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_manage_own_mcp_registry" ON public.mcp_registry
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- memories: users can only access their own memories
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_manage_own_memories" ON public.memories
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Note: The tasks table already has RLS from migration 20260507
