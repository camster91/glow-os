import { useState } from "react"
import { cn } from "@/lib/utils"
import { SendHorizontal } from "lucide-react"

interface ChatInputProps {
  onSubmit: (value: string) => void
  isLoading?: boolean
}

export function ChatInput({ onSubmit, isLoading }: ChatInputProps) {
  const [value, setValue] = useState("")
    <div className="relative flex w-full max-w-3xl items-center pb-4 pt-2">
      <div className="relative flex w-full flex-row items-end overflow-hidden rounded-3xl border border-zinc-200 bg-white/50 px-4 py-3 shadow-sm backdrop-blur-md transition-all focus-within:border-zinc-300 focus-within:ring-4 focus-within:ring-zinc-100 dark:border-zinc-800 dark:bg-zinc-900/50 dark:focus-within:border-zinc-700 dark:focus-within:ring-zinc-800/50">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              if (value.trim()) {
                onSubmit(value.trim())
                setValue("")
              }
            }
          }}
          placeholder="Ask GlowOS..."
          className="max-h-60 min-h-[24px] w-full resize-none bg-transparent placeholder:text-zinc-500 focus:outline-none dark:text-zinc-100"
          rows={1}
          style={{ height: "24px" }}
        />
        <button
          onClick={() => {
            if (value.trim()) {
              onSubmit(value.trim())
              setValue("")
            }
          }}
          disabled={!value.trim() || isLoading}
          className={cn(
            "ml-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black text-white transition-all hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200",
            (!value.trim() || isLoading) && "bg-zinc-200 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-600"
          )}
        >
          <SendHorizontal className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
