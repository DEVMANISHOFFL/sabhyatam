"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { adminCreateProduct } from "@/lib/admin-api"

export default function NewProductPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    title: "",
    slug: "",
    category: "",
    description: "",
    price: "",
    mrp: "",
    in_stock: true,
    published: false,
  })

  function update<K extends keyof typeof form>(
    key: K,
    value: typeof form[K]
  ) {
    setForm(f => ({ ...f, [key]: value }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await adminCreateProduct({
        title: form.title,
        slug: form.slug,
        category: form.category,
        description: form.description || undefined,
        price: Number(form.price),
        mrp: form.mrp ? Number(form.mrp) : undefined,
        in_stock: form.in_stock,
        published: form.published,
      })

      router.push("/admin/products")
    } catch (err: any) {
      setError(err.message || "Failed to create product")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl bg-white p-6 rounded shadow">
      <h1 className="text-xl font-bold mb-4">Create Product</h1>

      {error && (
        <div className="mb-4 text-red-600 text-sm">{error}</div>
      )}

      <form onSubmit={submit} className="space-y-4">
        <input
          placeholder="Title"
          className="w-full border p-2"
          value={form.title}
          onChange={e => update("title", e.target.value)}
          required
        />

        <input
          placeholder="Slug (unique)"
          className="w-full border p-2"
          value={form.slug}
          onChange={e => update("slug", e.target.value)}
          required
        />

        <input
          placeholder="Category"
          className="w-full border p-2"
          value={form.category}
          onChange={e => update("category", e.target.value)}
          required
        />

        <textarea
          placeholder="Description"
          className="w-full border p-2"
          value={form.description}
          onChange={e => update("description", e.target.value)}
        />

        <div className="grid grid-cols-2 gap-4">
          <input
            placeholder="Price (₹)"
            type="number"
            className="border p-2"
            value={form.price}
            onChange={e => update("price", e.target.value)}
            required
          />

          <input
            placeholder="MRP (₹)"
            type="number"
            className="border p-2"
            value={form.mrp}
            onChange={e => update("mrp", e.target.value)}
          />
        </div>

        <div className="flex gap-6">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.in_stock}
              onChange={e => update("in_stock", e.target.checked)}
            />
            In Stock
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.published}
              onChange={e => update("published", e.target.checked)}
            />
            Published
          </label>
        </div>

        <button
          disabled={loading}
          className="bg-black text-white px-4 py-2 disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create Product"}
        </button>
      </form>
    </div>
  )
}
