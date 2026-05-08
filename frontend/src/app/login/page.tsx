"use client"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useTranslations } from "next-intl"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const t = useTranslations()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (!error) {
      router.push("/")
    } else {
      toast.error(error.message)
    }
    setLoading(false)
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signUp({ email, password })
    if (!error) {
      toast.success(t("login.checkEmail"))
    } else {
      toast.error(error.message)
    }
    setLoading(false)
  }

  return (
    <div className="flex h-screen items-center justify-center bg-zinc-50 dark:bg-black px-4">
      <form className="w-full max-w-sm flex flex-col gap-4 bg-white dark:bg-zinc-900 p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <h1 className="text-2xl font-bold dark:text-white mb-2">{t("login.title")}</h1>
        <p className="text-zinc-500 text-sm mb-4">{t("login.subtitle")}</p>
        <input 
          type="email" placeholder={t("login.emailPlaceholder")} value={email} onChange={e => setEmail(e.target.value)}
          className="bg-zinc-100 dark:bg-zinc-800 rounded-xl px-4 py-3 outline-none dark:text-white"
        />
        <input 
          type="password" placeholder={t("login.passwordPlaceholder")} value={password} onChange={e => setPassword(e.target.value)}
          className="bg-zinc-100 dark:bg-zinc-800 rounded-xl px-4 py-3 outline-none dark:text-white"
        />
        <div className="flex gap-3 mt-4">
          <button onClick={handleLogin} disabled={loading} className="flex-1 bg-black dark:bg-white text-white dark:text-black py-3 rounded-xl font-medium disabled:opacity-50">
            {t("login.logIn")}
          </button>
          <button onClick={handleSignup} disabled={loading} className="flex-1 bg-zinc-200 dark:bg-zinc-800 text-black dark:text-white py-3 rounded-xl font-medium disabled:opacity-50">
            {t("login.signUp")}
          </button>
        </div>
      </form>
    </div>
  )
}
