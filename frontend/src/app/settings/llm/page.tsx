"use client"

import { useEffect, useState } from "react"
import { useSettingsStore } from "@/store/settings"
import { createClient } from "@/lib/supabase/client"
import { Save } from "lucide-react"
import { useTranslations } from "next-intl"

export default function LLMSettings() {
  const { provider, apiKey, baseUrl, defaultModel, setSettings, setApiKey } = useSettingsStore()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [savedKey, setSavedKey] = useState("")
  const supabase = createClient()
  const t = useTranslations()

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
          setSavedKey(data.api_key ? '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022' : '')
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
      setMessage({ type: 'error', text: t("settings.llm.notAuthenticated") })
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
        setMessage({ type: 'success', text: t("settings.llm.savedSuccess") })
        setSavedKey(apiKey ? '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022' : '')
      } else {
        setMessage({ type: 'error', text: `${t("settings.llm.saveFailed")} (${res.status})` })
      }
    } catch (err) {
      setMessage({ type: 'error', text: t("settings.llm.backendUnreachable") })
    }

    setLoading(false)
  }

  return (
    <div className="flex flex-col items-center min-h-screen bg-zinc-50 dark:bg-black py-12 px-4">
      <div className="w-full max-w-2xl flex flex-col gap-8">
        <div>
          <h1 className="text-3xl font-bold dark:text-white">{t("settings.llm.title")}</h1>
          <p className="text-zinc-500 mt-2">
            {t("settings.llm.description")}
          </p>
        </div>

        <form onSubmit={handleSave} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="font-medium text-sm dark:text-zinc-300">{t("settings.llm.provider")}</label>
            <select
              value={provider}
              onChange={(e) => setSettings({ provider: e.target.value as "openai" | "anthropic" | "ollama" })}
              className="bg-zinc-100 dark:bg-zinc-800 rounded-xl px-4 py-3 outline-none dark:text-white"
            >
              <option value="openai">{t("settings.llm.providerOpenAI")}</option>
              <option value="anthropic">{t("settings.llm.providerAnthropic")}</option>
              <option value="ollama">{t("settings.llm.providerOllama")}</option>
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-medium text-sm dark:text-zinc-300">
              {t("settings.llm.baseUrl")}
            </label>
            <input
              type="url"
              value={baseUrl}
              onChange={(e) => setSettings({ baseUrl: e.target.value })}
              className="bg-zinc-100 dark:bg-zinc-800 rounded-xl px-4 py-3 outline-none dark:text-white font-mono text-sm"
              placeholder={t("settings.llm.baseUrlPlaceholder")}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-medium text-sm dark:text-zinc-300">{t("settings.llm.apiKey")}</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setSettings({ apiKey: e.target.value })}
              className="bg-zinc-100 dark:bg-zinc-800 rounded-xl px-4 py-3 outline-none dark:text-white font-mono text-sm"
              placeholder={savedKey || t("settings.llm.apiKeyPlaceholder")}
            />
            {savedKey && <p className="text-xs text-zinc-400">{t("settings.llm.leaveBlank")}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-medium text-sm dark:text-zinc-300">{t("settings.llm.defaultModel")}</label>
            <input
              type="text"
              value={defaultModel}
              onChange={(e) => setSettings({ defaultModel: e.target.value })}
              className="bg-zinc-100 dark:bg-zinc-800 rounded-xl px-4 py-3 outline-none dark:text-white font-mono text-sm"
              placeholder={t("settings.llm.defaultModelPlaceholder")}
            />
          </div>

          {message && (
            <div className={`text-sm px-4 py-2 rounded-xl ${message.type === 'success' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'}`}>
              {message.text}
            </div>
          )}

          <div className="mt-4 flex justify-end">
            <button type="submit" disabled={loading} className="bg-black dark:bg-white text-white dark:text-black px-6 py-3 rounded-xl font-medium flex items-center gap-2 disabled:opacity-50">
              <Save className="w-4 h-4" /> {loading ? t("common.saving") : t("common.save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
