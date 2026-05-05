"use client"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (!error) {
      router.push("/")
    } else {
      alert(error.message)
    }
    setLoading(false)
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signUp({ email, password })
    if (!error) {
      alert("Check your email for the confirmation link!")
    } else {
      alert(error.message)
    }
    setLoading(false)
  }

  return (
    <div className="flex h-screen items-center justify-center bg-zinc-50 dark:bg-black px-4">
      <form className="w-full max-w-sm flex flex-col gap-4 bg-white dark:bg-zinc-900 p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <h1 className="text-2xl font-bold dark:text-white mb-2">Access GlowOS</h1>
        <p className="text-zinc-500 text-sm mb-4">Log in to your second brain.</p>
        <input 
          type="email" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)}
          className="bg-zinc-100 dark:bg-zinc-800 rounded-xl px-4 py-3 outline-none dark:text-white"
        />
        <input 
          type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)}
          className="bg-zinc-100 dark:bg-zinc-800 rounded-xl px-4 py-3 outline-none dark:text-white"
        />
        <div className="flex gap-3 mt-4">
          <button onClick={handleLogin} disabled={loading} className="flex-1 bg-black dark:bg-white text-white dark:text-black py-3 rounded-xl font-medium disabled:opacity-50">
            Log In
          </button>
          <button onClick={handleSignup} disabled={loading} className="flex-1 bg-zinc-200 dark:bg-zinc-800 text-black dark:text-white py-3 rounded-xl font-medium disabled:opacity-50">
            Sign Up
          </button>
        </div>
      </form>
    </div>
  )
}
