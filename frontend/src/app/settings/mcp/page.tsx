"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, Server, Trash2, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface MCPServer {
  id: string
  name: string
  url: string
  status: "active" | "inactive"
}

export default function MCPRegistry() {
  const [servers, setServers] = useState<MCPServer[]>([])
  const [newName, setNewName] = useState("")
  const [newUrl, setNewUrl] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  const loadServers = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from("mcp_registry")
      .select("id, server_name, server_url, status")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })

    if (!error && data) {
      setServers(
        data.map((row: { id: string; server_name: string; server_url: string; status: string }) => ({
          id: row.id,
          name: row.server_name,
          url: row.server_url,
          status: row.status as "active" | "inactive",
        }))
      )
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    loadServers()
  }, [loadServers])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!newName || !newUrl) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    setSaving(true)
    const { data, error } = await supabase
      .from("mcp_registry")
      .insert({
        user_id: user.id,
        server_name: newName,
        server_url: newUrl,
        status: "active",
      })
      .select()
      .single()

    if (!error && data) {
      setServers([
        ...servers,
        {
          id: data.id,
          name: data.server_name,
          url: data.server_url,
          status: data.status,
        },
      ])
      setNewName("")
      setNewUrl("")
    }
    setSaving(false)
  }

  async function handleRemove(id: string) {
    const { error } = await supabase.from("mcp_registry").delete().eq("id", id)
    if (!error) {
      setServers(servers.filter((s) => s.id !== id))
    }
  }

  return (
    <div className="flex flex-col items-center min-h-screen bg-zinc-50 dark:bg-black py-12 px-4">
      <div className="w-full max-w-3xl flex flex-col gap-8">
        <div>
          <h1 className="text-3xl font-bold dark:text-white">MCP Registry</h1>
          <p className="text-zinc-500 mt-2">Connect external tools and mini-apps to your GlowOS instance.</p>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4 dark:text-white">Add New Server</h2>
          <form onSubmit={handleAdd} className="flex gap-4">
            <input
              type="text"
              placeholder="Server Name (e.g. Gmail)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="flex-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl px-4 py-2 outline-none dark:text-white"
            />
            <input
              type="url"
              placeholder="Server URL"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              className="flex-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl px-4 py-2 outline-none dark:text-white"
            />
            <button
              type="submit"
              disabled={saving}
              className="bg-black dark:bg-white text-white dark:text-black px-6 py-2 rounded-xl font-medium flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Add
            </button>
          </form>
        </div>

        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold dark:text-white">Connected Servers</h2>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
            </div>
          ) : servers.length === 0 ? (
            <p className="text-zinc-500 text-sm">No servers configured yet.</p>
          ) : (
            servers.map((server) => (
              <div
                key={server.id}
                className="flex items-center justify-between bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full text-blue-600 dark:text-blue-400">
                    <Server className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold dark:text-white">{server.name}</h3>
                    <p className="text-sm text-zinc-500">{server.url}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-3 py-1 rounded-full">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span> Active
                  </span>
                  <button
                    onClick={() => handleRemove(server.id)}
                    className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-xl transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
