"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import {
  adminGetProduct,
  adminUpdateProduct,
  adminAddMedia,
  adminDeleteMedia,
  adminCreateVariant,
  adminUpdateVariant,
  adminDeleteVariant,
} from "@/lib/admin-api"
import type { AdminProductForm, ProductMedia } from "@/lib/types"
import { ArrowLeft, Plus, Save, Trash2, ExternalLink, Image as ImageIcon, Loader2 } from "lucide-react"
import Link from "next/link"

export default function AdminEditProductPage() {
  const params = useParams()
  const id = params?.id as string | undefined

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Initialize with null or safe defaults
  const [product, setProduct] = useState<AdminProductForm | null>(null)
  const [media, setMedia] = useState<ProductMedia[]>([])
  const [variants, setVariants] = useState<any[]>([])

  // Media Form State
  const [mediaUrl, setMediaUrl] = useState("")
  const [isAddingMedia, setIsAddingMedia] = useState(false)

  // Variant Form State
  const [newVariantPrice, setNewVariantPrice] = useState("")
  const [newVariantStock, setNewVariantStock] = useState("")

  useEffect(() => {
    if (!id) return
    load(id)
  }, [id])

  async function load(productId: string) {
    try {
      setLoading(true)
      const res = await adminGetProduct(productId)
      setProduct({
        ...res.product,
        // Ensure we handle potentially null/undefined values safely for inputs
        price: res.product.price ?? "", 
        mrp: res.product.mrp ?? "",
      })
      setMedia(res.media || [])
      setVariants(res.variants || [])
    } catch {
      setError("Failed to load product")
    } finally {
      setLoading(false)
    }
  }

  async function saveProduct(e: React.FormEvent) {
    e.preventDefault()
    if (!id || !product) return

    setSaving(true)
    try {
      await adminUpdateProduct(id, {
        ...product,
        // Convert back to number or undefined for API
        price: product.price === "" ? 0 : Number(product.price),
        mrp: product.mrp === "" ? undefined : Number(product.mrp),
      })
      alert("Product saved successfully")
    } catch (e: any) {
      setError(e.message || "Save failed")
    } finally {
      setSaving(false)
    }
  }

  async function addImage() {
    if (!id || !mediaUrl) return
    setIsAddingMedia(true)
    try {
      const m = await adminAddMedia(id, {
        url: mediaUrl,
        media_type: "image",
        meta: { role: media.length === 0 ? "hero" : "gallery", order: media.length + 1 },
      })
      setMedia(xs => [...xs, m])
      setMediaUrl("")
    } catch (e: any) {
      alert(e.message || "Failed to add image")
    } finally {
      setIsAddingMedia(false)
    }
  }

  async function removeImage(mediaId: string) {
    if (!confirm("Remove this image?")) return
    await adminDeleteMedia(mediaId)
    setMedia(xs => xs.filter(m => m.id !== mediaId))
  }

  async function addVariant() {
    if (!id || !newVariantPrice || !newVariantStock) return
    try {
      const res = await adminCreateVariant(id, { 
        price: Number(newVariantPrice), 
        stock: Number(newVariantStock) 
      })
      setVariants(xs => [...xs, { id: res.id, price: Number(newVariantPrice), stock: Number(newVariantStock) }])
      setNewVariantPrice("")
      setNewVariantStock("")
    } catch(e) {
      alert("Failed to add variant")
    }
  }

  // Common CSS for "No Spinner" inputs
  const noSpinnerClass = "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"

  if (!id) return <div>Invalid product</div>
  if (loading) return (
    <div className="flex h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
    </div>
  )
  if (!product) return <div>Product not found</div>

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 p-1">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/admin/products" className="p-2 hover:bg-gray-100 rounded-full transition">
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{product.title}</h1>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="font-mono bg-gray-100 px-1 rounded">{id.slice(0,8)}</span>
              <span>•</span>
              <a href={`/product/${product.slug}`} target="_blank" className="flex items-center gap-1 hover:text-blue-600">
                View Live <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={saveProduct}
            disabled={saving}
            className="flex items-center gap-2 bg-black text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition shadow-sm"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Changes
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: Main Info */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* 1. Basic Details */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Product Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  className="w-full rounded-lg border border-gray-300 p-2.5 text-sm outline-none focus:ring-2 focus:ring-black/5"
                  value={product.title}
                  onChange={e => setProduct({ ...product, title: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                  <input
                    className="w-full rounded-lg border border-gray-300 p-2.5 text-sm outline-none bg-gray-50 font-mono text-gray-600"
                    value={product.slug}
                    onChange={e => setProduct({ ...product, slug: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <input
                    className="w-full rounded-lg border border-gray-300 p-2.5 text-sm outline-none"
                    value={product.category}
                    onChange={e => setProduct({ ...product, category: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  className="w-full rounded-lg border border-gray-300 p-2.5 text-sm outline-none min-h-[120px]"
                  value={product.description ?? ""}
                  onChange={e => setProduct({ ...product, description: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* 2. Variants & Inventory */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Variants & Stock</h2>
            </div>
            
            <div className="overflow-x-auto rounded-lg border border-gray-200 mb-4">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-700 font-medium">
                  <tr>
                    <th className="px-4 py-3">Variant ID</th>
                    <th className="px-4 py-3">Price (₹)</th>
                    <th className="px-4 py-3">Stock</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {variants.map(v => (
                    <tr key={v.id} className="group hover:bg-gray-50">
                      <td className="px-4 py-2 font-mono text-xs text-gray-500">{v.id.slice(0,8)}...</td>
                      <td className="px-4 py-2">
                        <input 
                          type="number" 
                          className={`w-24 border rounded px-2 py-1 text-right ${noSpinnerClass}`}
                          value={v.price}
                          onChange={e => setVariants(xs => xs.map(x => x.id === v.id ? { ...x, price: Number(e.target.value) } : x))}
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input 
                          type="number" 
                          className={`w-20 border rounded px-2 py-1 text-right ${noSpinnerClass}`}
                          value={v.stock}
                          onChange={e => setVariants(xs => xs.map(x => x.id === v.id ? { ...x, stock: Number(e.target.value) } : x))}
                        />
                      </td>
                      <td className="px-4 py-2 text-right space-x-2">
                        <button 
                          onClick={() => adminUpdateVariant(v.id, { price: v.price, stock: v.stock })}
                          className="text-blue-600 hover:underline text-xs"
                        >
                          Save
                        </button>
                        <button 
                          onClick={async () => {
                            if(!confirm("Delete variant?")) return;
                            await adminDeleteVariant(v.id)
                            setVariants(xs => xs.filter(x => x.id !== v.id))
                          }}
                          className="text-red-600 hover:underline text-xs"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                  {/* Add Row */}
                  <tr className="bg-gray-50">
                    <td className="px-4 py-2 text-gray-400 italic text-xs">New</td>
                    <td className="px-4 py-2">
                      <input 
                        placeholder="Price" 
                        type="number" 
                        className={`w-24 border rounded px-2 py-1 text-right bg-white ${noSpinnerClass}`}
                        value={newVariantPrice}
                        onChange={e => setNewVariantPrice(e.target.value)}
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input 
                        placeholder="Qty" 
                        type="number" 
                        className={`w-20 border rounded px-2 py-1 text-right bg-white ${noSpinnerClass}`}
                        value={newVariantStock}
                        onChange={e => setNewVariantStock(e.target.value)}
                      />
                    </td>
                    <td className="px-4 py-2 text-right">
                      <button onClick={addVariant} className="text-xs bg-black text-white px-3 py-1 rounded hover:bg-gray-800">Add</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Media & Status */}
        <div className="space-y-6">
          
          {/* 3. Status Card */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Publishing</h2>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Published</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={product.published} onChange={e => setProduct({...product, published: e.target.checked})} />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">In Stock</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={product.in_stock} onChange={e => setProduct({...product, in_stock: e.target.checked})} />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Display Base Price & MRP */}
            <div className="pt-4 border-t border-gray-100 grid grid-cols-2 gap-4">
               <div>
                 <label className="block text-xs font-medium text-gray-500 mb-1">Base Price (₹)</label>
                 <input 
                   type="number" 
                   className={`w-full border rounded p-2 text-sm ${noSpinnerClass}`}
                   value={product.price}
                   // Logic: If string is empty, keep it empty. Otherwise parse number.
                   onChange={e => setProduct({
                     ...product, 
                     price: e.target.value === "" ? ("" as any) : Number(e.target.value)
                   })}
                 />
               </div>
               <div>
                 <label className="block text-xs font-medium text-gray-500 mb-1">MRP (₹)</label>
                 <input 
                   type="number" 
                   className={`w-full border rounded p-2 text-sm ${noSpinnerClass}`}
                   value={product.mrp}
                   onChange={e => setProduct({
                     ...product, 
                     mrp: e.target.value === "" ? ("" as any) : Number(e.target.value)
                   })}
                 />
               </div>
            </div>
          </div>

          {/* 4. Media Manager */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Media Gallery</h2>
            
            <div className="flex gap-2 mb-4">
              <input
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-xs outline-none"
                placeholder="https://..."
                value={mediaUrl}
                onChange={e => setMediaUrl(e.target.value)}
              />
              <button 
                onClick={addImage} 
                disabled={isAddingMedia}
                className="bg-gray-100 hover:bg-gray-200 p-2 rounded-lg text-gray-600 transition"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {media.map((m, i) => (
                <div key={m.id} className="group relative aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                  <img src={m.url} alt="" className="w-full h-full object-cover" />
                  
                  {/* Overlay Actions */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                    <button onClick={() => removeImage(m.id)} className="p-1.5 bg-white text-red-600 rounded-full hover:bg-red-50">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>

                  {/* Badges */}
                  {i === 0 && (
                    <div className="absolute top-1 left-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded backdrop-blur-sm">
                      Hero
                    </div>
                  )}
                </div>
              ))}
              
              {media.length === 0 && (
                <div className="col-span-3 py-8 text-center border-2 border-dashed border-gray-200 rounded-lg text-gray-400 text-xs">
                  <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  No images added
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}