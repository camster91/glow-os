"use client"

import { useChat } from "@ai-sdk/react"
import { ChatInput } from "@/components/chat/ChatInput"
import { MessageBubble } from "@/components/chat/MessageBubble"
import { TaskList } from "@/components/widgets/TaskList"
import { NoteCard } from "@/components/widgets/NoteCard"
import { useSettingsStore } from "@/store/settings"
import { createClient } from "@/lib/supabase/client"
import { useEffect } from "react"
import { useTranslations } from "next-intl"

export default function Home() {
  const { provider, baseUrl, defaultModel } = useSettingsStore()
  const supabase = createClient()
  const t = useTranslations()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        // User authenticated silently
      }
    })
  }, [])

  const { messages, append, status } = useChat({
    api: '/api/chat',
    headers: {
      'x-llm-settings': JSON.stringify({ provider, baseUrl, defaultModel }),
    }
  })

  return (
    <main className="flex h-screen flex-col items-center bg-zinc-50 dark:bg-black">
      <div className="flex w-full flex-1 flex-col items-center overflow-y-auto px-4 pb-32 pt-8">
        <div className="flex w-full max-w-3xl flex-col">
          {messages.length === 0 && (
            <MessageBubble role="assistant" content={t("home.greeting")} />
          )}
          {messages.map((m) => {
            if (m.toolInvocations && m.toolInvocations.length > 0) {
              return m.toolInvocations.map(tool => {
                if (tool.toolName === 'render_task_list') {
                  const args = tool.args as { tasks: string[] }
                  return (
                    <div key={tool.toolCallId} className="w-full max-w-3xl flex justify-start ml-12">
                      <TaskList tasks={args.tasks || []} />
                    </div>
                  )
                }
                if (tool.toolName === 'render_note') {
                  const args = tool.args as { title: string, content: string }
                  return (
                    <div key={tool.toolCallId} className="w-full max-w-3xl flex justify-start ml-12">
                      <NoteCard title={args.title || ""} content={args.content || ""} />
                    </div>
                  )
                }
                return null;
              })
            }
            if (m.content) {
              return <MessageBubble key={m.id} role={m.role} content={m.content} />
            }
            return null;
          })}
        </div>
      </div>

      <div className="fixed bottom-0 flex w-full justify-center bg-gradient-to-t from-zinc-50 via-zinc-50 to-transparent px-4 pb-8 pt-6 dark:from-black dark:via-black">
        <div className="w-full flex justify-center">
          <ChatInput 
            onSubmit={(val) => append({ role: 'user', content: val })} 
            isLoading={status === 'submitted'} 
          />
        </div>
      </div>
    </main>
  )
}
