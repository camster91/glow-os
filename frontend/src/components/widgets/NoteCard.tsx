import { useState } from "react"
import { Edit2, Save, FileText } from "lucide-react"

interface NoteCardProps {
  title: string
  content: string
}

export function NoteCard({ title, content: initialContent }: NoteCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [content, setContent] = useState(initialContent)

  return (
    <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/50 rounded-2xl p-5 shadow-sm my-4 w-full max-w-md">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-amber-900 dark:text-amber-500 flex items-center gap-2">
          <FileText className="w-4 h-4" /> {title}
        </h3>
        <button onClick={() => setIsEditing(!isEditing)} className="text-amber-700 dark:text-amber-600 hover:bg-amber-100 dark:hover:bg-amber-900/30 p-1.5 rounded-lg transition-colors">
          {isEditing ? <Save className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
        </button>
      </div>
      
      {isEditing ? (
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full bg-white/50 dark:bg-black/20 border border-amber-200 dark:border-amber-800/50 rounded-xl p-3 outline-none min-h-[100px] text-zinc-800 dark:text-zinc-200 text-sm"
        />
      ) : (
        <div className="text-[15px] text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
          {content}
        </div>
      )}
    </div>
  )
}
