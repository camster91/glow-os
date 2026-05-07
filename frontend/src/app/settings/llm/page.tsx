"use client"

import { useEffect, useState } from "react"
import { useSettingsStore } from "@/store/settings"
import { createClient } from "@/lib/supabase/client"
import { Save } from "lucide-react"
import { toast } from "sonner"

export default function LLMSettings() {
  const { provider, apiKey, baseUrl, defaultModel, setSettings, setApiKey } = useSettingsStore()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [savedKey, setSavedKey] = useState("")
  const supabase = createClient()

  // Load settings from the backend on mount
  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000"
        const res = await fetch(`${backendUrl}/api/settings/llm`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        })
        if (res.ok) {
          const data = await res.json()
          setSettings({
            provider: data.provider || 'openai',
            baseUrl: data.base_url || 'https://api.openai.com/v1',
            defaultModel: data.default_model || 'gpt-4o-mini',
          })
          // apiKey is in-memory only via setApiKey; placeholder shown in form
          setApiKey(data.api_key || '')
          setSavedKey(data.api_key ? '••••••••' : '')
        }
      } catch {
        // Backend not available in dev — silently skip
      }
    }
    load()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      setMessage({ type: 'error', text: 'Not authenticated' })
      setLoading(false)
      return
    }

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000"
      const res = await fetch(`${backendUrl}/api/settings/llm`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ provider, api_key: apiKey, base_url: baseUrl, default_model: defaultModel }),
      })

      if (res.ok) {
        setMessage({ type: 'success', text: 'Settings saved securely!' })
        setSavedKey(apiKey ? '••••••••' : '')
      } else {
        setMessage({ type: 'error', text: `Failed to save (${res.status})` })
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Could not reach the backend' })
    }

    setLoading(false)
  }

  return (
    <div className="flex flex-col items-center min-h-screen bg-zinc-50 dark:bg-black py-12 px-4">
      <div className="w-full max-w-2xl flex flex-col gap-8">
        <div>
          <h1 className="text-3xl font-bold dark:text-white">LLM Configuration</h1>
          <p className="text-zinc-500 mt-2">
            Configure your AI provider (BYOM). Supports OpenAI, Anthropic, or Ollama Cloud.
          </p>
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
            <label className="font-medium text-sm dark:text-zinc-300">
              Base URL (For Ollama Cloud or Custom Endpoints)
            </label>
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
              placeholder={savedKey || "sk-..."}
            />
            {savedKey && <p className="text-xs text-zinc-400">Leave blank to keep existing key</p>}
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

          {message && (
            <div className={`text-sm px-4 py-2 rounded-xl ${message.type === 'success' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'}`}>
              {message.text}
            </div>
          )}

          <div className="mt-4 flex justify-end">
            <button type="submit" disabled={loading} className="bg-black dark:bg-white text-white dark:text-black px-6 py-3 rounded-xl font-medium flex items-center gap-2 disabled:opacity-50">
              <Save className="w-4 h-4" /> {loading ? 'Saving…' : 'Save Preferences'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
