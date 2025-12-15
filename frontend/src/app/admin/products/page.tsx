"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  adminListProducts,
  adminDeleteProduct,
} from "@/lib/admin-api"
import type { AdminProduct } from "@/lib/types"

export default function AdminProductsPage() {
  const [products, setProducts] = useState<AdminProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    try {
      setLoading(true)
      const res = await adminListProducts()
      setProducts(res.items)
    } catch {
      setError("Failed to load products")
    } finally {
      setLoading(false)
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this product?")) return
    await adminDeleteProduct(id)
    setProducts(xs => xs.filter(p => p.id !== id))
  }

  if (loading) return <div>Loading…</div>
  if (error) return <div className="text-red-600">{error}</div>

  return (
    <div>
      <div className="flex justify-between mb-4">
        <h1 className="text-xl font-bold">Products</h1>

        <Link
          href="/admin/products/new"
          className="bg-black text-white px-4 py-2"
        >
          + New Product
        </Link>
      </div>

      <table className="w-full bg-white border">
        <thead>
          <tr className="border-b">
            <th className="p-2 text-left">Title</th>
            <th className="p-2">Category</th>
            <th className="p-2">Published</th>
            <th className="p-2">Actions</th>
          </tr>
        </thead>

        <tbody>
          {products.map(p => (
            <tr key={p.id} className="border-b">
              <td className="p-2">{p.title}</td>
              <td className="p-2">{p.category}</td>
              <td className="p-2">
                {p.published ? "Yes" : "No"}
              </td>
              <td className="p-2 space-x-3">
                <Link
                  href={`/admin/products/${p.id}`}
                  className="underline"
                >
                  Edit
                </Link>

                <button
                  onClick={() => remove(p.id)}
                  className="text-red-600"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
