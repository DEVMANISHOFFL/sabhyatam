"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { adminCreateProduct } from "@/lib/admin-api"
import type { AdminProduct } from "@/lib/types"

export default function AdminNewProductPage() {
  const router = useRouter()

  const [title, setTitle] = useState("")
  const [slug, setSlug] = useState("")
  const [category, setCategory] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function create(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!title || !slug || !category) {
      setError("All fields are required")
      return
    }

    try {
      setLoading(true)

      const res = await adminCreateProduct({
        title,
        slug,
        category,
        published: false,
        in_stock: false,
      })

      // 🔥 redirect straight to edit page
      router.push(`/admin/products/${res.id}`)
    } catch (e: any) {
      setError(e.message || "Create failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl bg-white p-6 rounded shadow">
      <h1 className="text-xl font-bold mb-4">New Product</h1>

      {error && <div className="text-red-600 mb-3">{error}</div>}

      <form onSubmit={create} className="space-y-4">
        <input
          className="w-full border p-2"
          placeholder="Title"
          value={title}
          onChange={e => setTitle(e.target.value)}
        />

        <input
          className="w-full border p-2"
          placeholder="Slug (unique)"
          value={slug}
          onChange={e => setSlug(e.target.value)}
        />

        <input
          className="w-full border p-2"
          placeholder="Category"
          value={category}
          onChange={e => setCategory(e.target.value)}
        />

        <button
          disabled={loading}
          className="bg-black text-white px-4 py-2"
        >
          {loading ? "Creating..." : "Create Product"}
        </button>
      </form>
    </div>
  )
}
