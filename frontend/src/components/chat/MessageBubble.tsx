import { cn } from "@/lib/utils"
import { Bot, User } from "lucide-react"
import { useTranslations } from "next-intl"

interface MessageBubbleProps {
  role: "user" | "assistant" | "system"
  content: string
}

export function MessageBubble({ role, content }: MessageBubbleProps) {
  const isUser = role === "user"
  const t = useTranslations()

  return (
    <div className={cn("group flex w-full py-4", isUser ? "justify-end" : "justify-start")}>
      <div className={cn("flex max-w-3xl gap-4", isUser ? "flex-row-reverse" : "flex-row")}>
        <div
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
            isUser ? "bg-black text-white dark:bg-white dark:text-black" : "bg-blue-600 text-white"
          )}
        >
          {isUser ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
        </div>
        
        <div className="flex flex-col gap-1">
          <div className={cn("font-medium text-sm text-zinc-500", isUser ? "text-right" : "text-left")}>
            {isUser ? t("chat.you") : t("chat.assistant")}
          </div>
          <div
            className={cn(
              "prose prose-zinc max-w-none rounded-2xl px-5 py-3 text-[15px] leading-relaxed dark:prose-invert",
              isUser
                ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                : "bg-transparent text-zinc-900 dark:text-zinc-100"
            )}
          >
            {content}
          </div>
        </div>
      </div>
    </div>
  )
}
