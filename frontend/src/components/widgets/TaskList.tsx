import { useState } from "react"
import { Check, Edit2, Save } from "lucide-react"
import { useTranslations } from "next-intl"

interface TaskListProps {
  tasks: string[]
}

export function TaskList({ tasks: initialTasks }: TaskListProps) {
  const [tasks, setTasks] = useState(initialTasks.map(t => ({ text: t, done: false })))
  const t = useTranslations()

  const toggleTask = (index: number) => {
    const newTasks = [...tasks]
    newTasks[index].done = !newTasks[index].done
    setTasks(newTasks)
  }

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm my-4 w-full max-w-sm">
      <h3 className="font-bold mb-4 dark:text-white flex items-center gap-2">
        <Check className="w-5 h-5 text-blue-500" /> {t("widgets.taskList.title")}
      </h3>
      <ul className="flex flex-col gap-3">
        {tasks.map((t, i) => (
          <li key={i} className="flex items-start gap-3 cursor-pointer group" onClick={() => toggleTask(i)}>
            <div className={`mt-0.5 shrink-0 w-5 h-5 rounded border flex items-center justify-center transition-colors ${t.done ? 'bg-blue-500 border-blue-500 text-white' : 'border-zinc-300 dark:border-zinc-700 group-hover:border-blue-400'}`}>
              {t.done && <Check className="w-3 h-3" />}
            </div>
            <span className={`text-[15px] ${t.done ? 'line-through text-zinc-400' : 'text-zinc-700 dark:text-zinc-200'}`}>
              {t.text}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
