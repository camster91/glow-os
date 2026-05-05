"use client"

import { useSettingsStore } from "@/store/settings"
import { Save } from "lucide-react"

export default function LLMSettings() {
  const { provider, apiKey, baseUrl, defaultModel, setSettings } = useSettingsStore()

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    // In a full implementation, we would sync this to Supabase LLM_Preferences
    alert("Settings saved locally!")
  }

  return (
    <div className="flex flex-col items-center min-h-screen bg-zinc-50 dark:bg-black py-12 px-4">
      <div className="w-full max-w-2xl flex flex-col gap-8">
        <div>
          <h1 className="text-3xl font-bold dark:text-white">LLM Configuration</h1>
          <p className="text-zinc-500 mt-2">Configure your AI provider (BYOM). Supports OpenAI, Anthropic, or Ollama Cloud.</p>
        </div>

        <form onSubmit={handleSave} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="font-medium text-sm dark:text-zinc-300">Provider</label>
            <select 
              value={provider}
              onChange={(e) => setSettings({ provider: e.target.value as any })}
              className="bg-zinc-100 dark:bg-zinc-800 rounded-xl px-4 py-3 outline-none dark:text-white"
            >
              <option value="openai">OpenAI (or Compatible API)</option>
              <option value="anthropic">Anthropic</option>
              <option value="ollama">Ollama (Local/Cloud)</option>
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-medium text-sm dark:text-zinc-300">Base URL (For Ollama Cloud or Custom Endpoints)</label>
            <input 
              type="url" 
              value={baseUrl}
              onChange={(e) => setSettings({ baseUrl: e.target.value })}
              className="bg-zinc-100 dark:bg-zinc-800 rounded-xl px-4 py-3 outline-none dark:text-white font-mono text-sm"
              placeholder="https://api.openai.com/v1"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-medium text-sm dark:text-zinc-300">API Key</label>
            <input 
              type="password" 
              value={apiKey}
              onChange={(e) => setSettings({ apiKey: e.target.value })}
              className="bg-zinc-100 dark:bg-zinc-800 rounded-xl px-4 py-3 outline-none dark:text-white font-mono text-sm"
              placeholder="sk-..."
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-medium text-sm dark:text-zinc-300">Default Model</label>
            <input 
              type="text" 
              value={defaultModel}
              onChange={(e) => setSettings({ defaultModel: e.target.value })}
              className="bg-zinc-100 dark:bg-zinc-800 rounded-xl px-4 py-3 outline-none dark:text-white font-mono text-sm"
              placeholder="gpt-4o-mini"
            />
          </div>

          <div className="mt-4 flex justify-end">
            <button type="submit" className="bg-black dark:bg-white text-white dark:text-black px-6 py-3 rounded-xl font-medium flex items-center gap-2">
              <Save className="w-4 h-4" /> Save Preferences
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
