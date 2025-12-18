"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { adminCreateProduct } from "@/lib/admin-api"
import { ArrowLeft, Loader2, Save } from "lucide-react"
import Link from "next/link"

export default function AdminNewProductPage() {
  const router = useRouter()

  const [title, setTitle] = useState("")
  const [slug, setSlug] = useState("")
  const [category, setCategory] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Auto-generate slug from title
  const handleTitleChange = (val: string) => {
    setTitle(val)
    if (!slug) { // Only auto-fill if slug is empty
      setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""))
    }
  }

  async function create(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!title || !slug || !category) {
      setError("All fields marked with * are required")
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
      router.push(`/admin/products/${res.id}`)
    } catch (e: any) {
      setError(e.message || "Failed to create product. Slug might be duplicate.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 p-1">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/products" className="p-2 hover:bg-gray-100 rounded-full transition">
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Add New Product</h1>
          <p className="text-sm text-gray-500">Create a base product profile. You can add variants and images later.</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Form Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <form onSubmit={create} className="p-6 space-y-6">
          
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Product Title <span className="text-red-500">*</span></label>
            <input
              className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-black focus:ring-1 focus:ring-black outline-none transition"
              placeholder="e.g. Kanjivaram Silk Saree - Maroon"
              value={title}
              onChange={e => handleTitleChange(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Slug <span className="text-red-500">*</span></label>
              <input
                className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-black focus:ring-1 focus:ring-black outline-none transition font-mono bg-gray-50"
                placeholder="kanjivaram-silk-maroon"
                value={slug}
                onChange={e => setSlug(e.target.value)}
              />
              <p className="text-xs text-gray-500">Unique URL identifier.</p>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Category <span className="text-red-500">*</span></label>
              <select
                className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-black focus:ring-1 focus:ring-black outline-none transition bg-white"
                value={category}
                onChange={e => setCategory(e.target.value)}
              >
                <option value="">Select Category...</option>
                <option value="Silk Sarees">Silk Sarees</option>
                <option value="Cotton Sarees">Cotton Sarees</option>
                <option value="Handloom Sarees">Handloom Sarees</option>
                <option value="Designer Sarees">Designer Sarees</option>
                <option value="Printed Sarees">Printed Sarees</option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
            <Link href="/admin/products" className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
              Cancel
            </Link>
            <button
              disabled={loading}
              type="submit"
              className="flex items-center gap-2 bg-black text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Create Product
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}