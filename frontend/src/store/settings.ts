import { create } from 'zustand'

interface SettingsState {
  provider: 'openai' | 'anthropic' | 'ollama' | 'custom'
  apiKey: string  // retained for form UX only — never persisted to localStorage
  baseUrl: string
  defaultModel: string
  setSettings: (settings: Partial<SettingsState>) => void
  setApiKey: (key: string) => void  // only in-memory, never persisted
}

/**
 * Settings store — all LLM prefs except apiKey are kept in memory only.
 * apiKey is fetched/saved via the backend API (encrypted at rest in Supabase).
 * This eliminates XSS exposure of API keys via localStorage.
 */
export const useSettingsStore = create<SettingsState>()((set) => ({
  provider: 'openai',
  apiKey: '',
  baseUrl: 'https://api.openai.com/v1',
  defaultModel: 'gpt-4o-mini',
  setSettings: (newSettings) => set((state) => ({ ...state, ...newSettings })),
  setApiKey: (key) => set({ apiKey: key }),
}))
