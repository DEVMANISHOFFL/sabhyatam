"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  adminListProducts,
  adminDeleteProduct,
  adminUpdateProduct,
} from "@/lib/admin-api"
import type { AdminProduct } from "@/lib/types"
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye, 
  Download, 
  Package,
  AlertCircle,
  CheckCircle2
} from "lucide-react"

export default function AdminProductsPage() {
  const [products, setProducts] = useState<AdminProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Future: Local state for search/filter to implement later
  const [searchQuery, setSearchQuery] = useState("")

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
    if (!confirm("Are you sure you want to delete this product? This action cannot be undone.")) return
    try {
      await adminDeleteProduct(id)
      setProducts(xs => xs.filter(p => p.id !== id))
    } catch (e) {
      alert("Failed to delete product")
    }
  }

  async function toggleStatus(product: AdminProduct) {
    const next = !product.published
    // Optimistic update
    setProducts(xs =>
      xs.map(x => (x.id === product.id ? { ...x, published: next } : x))
    )

    try {
      await adminUpdateProduct(product.id, { published: next })
    } catch (e) {
      // Revert if failed
      alert("Failed to update status")
      setProducts(xs =>
        xs.map(x => (x.id === product.id ? { ...x, published: !next } : x))
      )
    }
  }

  // Derived Stats for the Dashboard Header
  const totalProducts = products.length
  const activeProducts = products.filter(p => p.published).length
  // Assuming variants exist, otherwise 0. logic for future expansion
  const lowStockProducts = products.filter(p => 
    (p.variants?.reduce((acc, v) => acc + v.stock, 0) || 0) < 5
  ).length

  // Filtered products based on search (Client-side for now)
  const filteredProducts = products.filter(p => 
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.category?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) return (
    <div className="flex h-96 items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-black" />
    </div>
  )
  
  if (error) return (
    <div className="rounded-lg bg-red-50 p-4 text-center text-red-600">
      <AlertCircle className="mx-auto mb-2 h-6 w-6" />
      {error}
      <button onClick={load} className="mt-2 text-sm underline">Try Again</button>
    </div>
  )

  return (
    <div className="space-y-6 p-1">
      {/* 1. Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Products</h1>
          <p className="text-sm text-gray-500">Manage your catalog, inventory, and pricing.</p>
        </div>
        <div className="flex gap-2">
          {/* Future: Export Feature */}
          <button className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
          
          <Link
            href="/admin/products/new"
            className="flex items-center gap-2 rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            <Plus className="h-4 w-4" />
            Add Product
          </Link>
        </div>
      </div>

      {/* 2. Stats Cards (Future-ready) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-blue-50 p-3 text-blue-600">
              <Package className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Products</p>
              <h3 className="text-2xl font-bold text-gray-900">{totalProducts}</h3>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-green-50 p-3 text-green-600">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Active Now</p>
              <h3 className="text-2xl font-bold text-gray-900">{activeProducts}</h3>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-orange-50 p-3 text-orange-600">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Low Stock</p>
              <h3 className="text-2xl font-bold text-gray-900">{lowStockProducts}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Toolbar (Search & Filter) */}
      <div className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-md border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
          />
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 rounded-md border border-gray-300 px-3 py-2 text-sm font-medium hover:bg-gray-50">
            <Filter className="h-4 w-4" />
            <span>Filters</span>
          </button>
          {/* Future: Category dropdown */}
        </div>
      </div>

      {/* 4. Products Table */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-500">
            <thead className="bg-gray-50 text-xs uppercase text-gray-700">
              <tr>
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center">
                    <p className="text-gray-500">No products found matching your search.</p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const hasImage = p.media && p.media.length > 0;
                  const thumb = hasImage ? p.media[0].url : "/placeholder.svg";
                  const price = p.variants?.[0]?.price 
                    ? `₹${p.variants[0].price.toLocaleString()}` 
                    : "—";

                  return (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md border border-gray-200 bg-gray-100">
                            <img src={thumb} alt="" className="h-full w-full object-cover" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{p.title}</div>
                            <div className="text-xs text-gray-500 truncate max-w-[200px]">
                              {p.short_desc || "No description"}
                            </div>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                          {p.category || "Uncategorized"}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleStatus(p)}
                          className={`inline-flex w-24 items-center justify-center rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                            p.published
                              ? "bg-green-100 text-green-700 hover:bg-green-200"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          {p.published ? "Active" : "Draft"}
                        </button>
                      </td>

                      <td className="px-6 py-4 font-medium text-gray-900">
                        {price}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-3">
                          {/* View (Future: Frontend Link) */}
                          <Link href={`/product/${p.slug}`} target="_blank" className="text-gray-400 hover:text-blue-600">
                            <Eye className="h-4 w-4" />
                          </Link>
                          
                          {/* Edit */}
                          <Link href={`/admin/products/${p.id}`} className="text-gray-400 hover:text-black">
                            <Edit className="h-4 w-4" />
                          </Link>
                          
                          {/* Delete */}
                          <button onClick={() => remove(p.id)} className="text-gray-400 hover:text-red-600">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
        
        {/* 5. Pagination (Placeholder for future) */}
        <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4">
          <div className="text-sm text-gray-500">
            Showing <span className="font-medium">1</span> to <span className="font-medium">{filteredProducts.length}</span> of <span className="font-medium">{filteredProducts.length}</span> results
          </div>
          <div className="flex gap-2">
            <button disabled className="rounded-md border border-gray-300 px-3 py-1 text-sm font-medium text-gray-400 opacity-50">Previous</button>
            <button disabled className="rounded-md border border-gray-300 px-3 py-1 text-sm font-medium text-gray-400 opacity-50">Next</button>
          </div>
        </div>
      </div>
    </div>
  )
}