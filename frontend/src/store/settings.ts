import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SettingsState {
  provider: 'openai' | 'anthropic' | 'ollama' | 'custom'
  apiKey: string
  baseUrl: string
  defaultModel: string
  setSettings: (settings: Partial<SettingsState>) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      provider: 'openai',
      apiKey: '',
      baseUrl: 'https://api.openai.com/v1',
      defaultModel: 'gpt-4o-mini',
      setSettings: (newSettings) => set((state) => ({ ...state, ...newSettings })),
    }),
    {
      name: 'glowos-settings',
    }
  )
)
