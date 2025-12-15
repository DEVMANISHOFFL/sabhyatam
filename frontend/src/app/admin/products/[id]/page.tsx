"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  adminGetProduct,
  adminUpdateProduct,
  adminAddMedia,
  adminDeleteMedia,
} from "@/lib/admin-api"
import type { AdminProduct, ProductMedia } from "@/lib/types"

export default function AdminEditProductPage() {
  const params = useParams()
  const router = useRouter()

  const id = params?.id as string | undefined

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [product, setProduct] = useState<AdminProduct | null>(null)
  const [media, setMedia] = useState<ProductMedia[]>([])

  const [mediaForm, setMediaForm] = useState({
    url: "",
    role: "gallery" as "hero" | "gallery",
    order: 1,
  })

  // -----------------------------
  // Load product + media
  // -----------------------------
  useEffect(() => {
    if (!id) return
    load(id)
  }, [id])

  async function load(productId: string) {
    try {
      setLoading(true)
      const res = await adminGetProduct(productId)
      setProduct(res.product)
      setMedia(res.media ?? [])
    } catch {
      setError("Failed to load product")
    } finally {
      setLoading(false)
    }
  }

  // -----------------------------
  // Save product
  // -----------------------------
  async function saveProduct(e: React.FormEvent) {
    e.preventDefault()
    if (!id || !product) return

    setSaving(true)
    setError(null)

    try {
      await adminUpdateProduct(id, {
        title: product.title,
        slug: product.slug,
        category: product.category,
        description: product.description,
        price: Number(product.price),
        mrp: product.mrp ? Number(product.mrp) : undefined,
        in_stock: product.in_stock,
        published: product.published,
      })
    } catch (e: any) {
      setError(e.message || "Save failed")
    } finally {
      setSaving(false)
    }
  }

  // -----------------------------
  // Add image
  // -----------------------------
  async function addImage() {
    if (!id || !mediaForm.url) return

    const m = await adminAddMedia(id, {
      url: mediaForm.url,
      media_type: "image",
      meta: {
        role: mediaForm.role,
        order: mediaForm.order,
      },
    })

    setMedia(xs => [...xs, m])
    setMediaForm({ url: "", role: "gallery", order: 1 })
  }

  // -----------------------------
  // Delete image
  // -----------------------------
  async function removeImage(mediaId: string) {
    await adminDeleteMedia(mediaId)
    setMedia(xs => xs.filter(m => m.id !== mediaId))
  }

  // -----------------------------
  // Render guards
  // -----------------------------
  if (!id) return <div>Invalid product</div>
  if (loading) return <div>Loading...</div>
  if (!product) return <div>Product not found</div>

  return (
    <div className="max-w-4xl space-y-10">
      {/* ---------------- PRODUCT FORM ---------------- */}
      <form onSubmit={saveProduct} className="bg-white p-6 rounded shadow">
        <h1 className="text-xl font-bold mb-4">Edit Product</h1>

        {error && <div className="text-red-600 mb-3">{error}</div>}

        <div className="space-y-3">
          <input
            className="w-full border p-2"
            value={product.title}
            onChange={e =>
              setProduct({ ...product, title: e.target.value })
            }
            placeholder="Title"
          />

          <input
            className="w-full border p-2"
            value={product.slug}
            onChange={e =>
              setProduct({ ...product, slug: e.target.value })
            }
            placeholder="Slug"
          />

          <input
            className="w-full border p-2"
            value={product.category}
            onChange={e =>
              setProduct({ ...product, category: e.target.value })
            }
            placeholder="Category"
          />

          <textarea
            className="w-full border p-2"
            value={product.description ?? ""}
            onChange={e =>
              setProduct({ ...product, description: e.target.value })
            }
            placeholder="Description"
          />

          <div className="grid grid-cols-2 gap-4">
            <input
              type="number"
              className="border p-2"
              value={product.price}
              onChange={e =>
                setProduct({ ...product, price: Number(e.target.value) })
              }
              placeholder="Price"
            />

            <input
              type="number"
              className="border p-2"
              value={product.mrp ?? ""}
              onChange={e =>
                setProduct({
                  ...product,
                  mrp: e.target.value
                    ? Number(e.target.value)
                    : undefined,
                })
              }
              placeholder="MRP"
            />
          </div>

          <div className="flex gap-6">
            <label>
              <input
                type="checkbox"
                checked={product.in_stock}
                onChange={e =>
                  setProduct({
                    ...product,
                    in_stock: e.target.checked,
                  })
                }
              />{" "}
              In stock
            </label>

            <label>
              <input
                type="checkbox"
                checked={product.published}
                onChange={e =>
                  setProduct({
                    ...product,
                    published: e.target.checked,
                  })
                }
              />{" "}
              Published
            </label>
          </div>

          <button
            disabled={saving}
            className="bg-black text-white px-4 py-2"
          >
            {saving ? "Saving..." : "Save Product"}
          </button>
        </div>
      </form>

      {/* ---------------- IMAGE MANAGEMENT ---------------- */}
      <section className="bg-white p-6 rounded shadow">
        <h2 className="text-lg font-bold mb-4">Product Images</h2>

        <div className="flex gap-2 mb-4">
          <input
            className="flex-1 border p-2"
            placeholder="Image URL"
            value={mediaForm.url}
            onChange={e =>
              setMediaForm(f => ({ ...f, url: e.target.value }))
            }
          />

          <select
            className="border p-2"
            value={mediaForm.role}
            onChange={e =>
              setMediaForm(f => ({
                ...f,
                role: e.target.value as "hero" | "gallery",
              }))
            }
          >
            <option value="hero">Hero</option>
            <option value="gallery">Gallery</option>
          </select>

          <input
            type="number"
            className="w-20 border p-2"
            value={mediaForm.order}
            onChange={e =>
              setMediaForm(f => ({
                ...f,
                order: Number(e.target.value),
              }))
            }
          />

          <button
            onClick={addImage}
            className="bg-black text-white px-3"
          >
            Add
          </button>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {media.map(m => (
            <div key={m.id} className="border p-2 relative">
              <img
                src={m.url}
                className="w-full h-32 object-cover"
              />

              <div className="text-xs mt-1">
                <div>{m.meta.role}</div>
                <div>Order: {m.meta.order}</div>
              </div>

              <button
                onClick={() => removeImage(m.id)}
                className="absolute top-1 right-1 text-red-600 text-xs"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
