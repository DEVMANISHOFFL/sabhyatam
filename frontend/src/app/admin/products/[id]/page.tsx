"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams } from "next/navigation"
import {
  adminGetProduct,
  adminUpdateProduct,
  adminAddMedia,
  adminDeleteMedia,
  adminGetUploadUrl,
} from "@/lib/admin-api"
import type { AdminProductForm, ProductMedia } from "@/lib/types"
import { 
  ArrowLeft, 
  Save, 
  Trash2, 
  ExternalLink, 
  Loader2, 
  CloudUpload 
} from "lucide-react"
import Link from "next/link"

export default function AdminEditProductPage() {
  const params = useParams()
  const id = params?.id as string | undefined

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // STATE DEFINITION
  const [product, setProduct] = useState<
    Omit<AdminProductForm, "price" | "mrp" | "stock"> & {
      price: string | number
      mrp: string | number
      stock: string | number
      in_stock: boolean
    }
  >({
    title: "",
    slug: "",
    short_desc: "",
    category: "",
    subcategory: "",
    price: "",
    mrp: "",
    stock: "",
    in_stock: false,
    published: false,
    attributes: {},
    tags: [],
  } as any)
  
  const [tagsInput, setTagsInput] = useState("")
  const [media, setMedia] = useState<ProductMedia[]>([])

  useEffect(() => {
    if (!id) return
    load(id)
  }, [id])

  async function load(productId: string) {
    try {
      setLoading(true)
      const res = await adminGetProduct(productId)
      
      // Cast to 'any' to handle the backend case inconsistency safely
      const rawData = res.product as any

      setProduct({
        ...rawData,
        price: rawData.price ?? "",
        mrp: rawData.mrp ?? "",
        // FIX: Check for 'Stock' (backend) OR 'stock' (standard)
        stock: rawData.Stock ?? rawData.stock ?? "", 
        in_stock: rawData.in_stock ?? false,
        attributes: rawData.attributes || {},
        short_desc: rawData.short_desc || "", 
      })

      if (rawData.tags && Array.isArray(rawData.tags)) {
        setTagsInput(rawData.tags.join(", "))
      }

      setMedia(res.media || [])
    } catch (e) {
      console.error(e)
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
      const tagsArray = tagsInput.split(",").map(t => t.trim()).filter(Boolean)
      
      // Ensure numerical values
      const stockVal = product.stock === "" ? 0 : Number(product.stock)
      const priceVal = product.price === "" ? 0 : Number(product.price)
      const mrpVal = product.mrp === "" ? undefined : Number(product.mrp)

      await adminUpdateProduct(id, {
        ...product,
        price: priceVal,
        mrp: mrpVal,
        stock: stockVal,
        // Send the explicit toggle state
        in_stock: product.in_stock,
        tags: tagsArray
      })
      alert("Product saved successfully")
    } catch (e: any) {
      setError(e.message || "Save failed")
      alert("Error saving: " + e.message)
    } finally {
      setSaving(false)
    }
  }

  // --- Attributes Helper ---
  const updateAttribute = (key: string, value: string) => {
    setProduct(prev => ({
      ...prev,
      attributes: {
        ...prev.attributes,
        [key]: value
      }
    }))
  }

  // --- File Upload Logic ---
  async function handleFileUpload(file: File) {
    if (!id) return
    try {
      setUploading(true)
      const { upload_url, public_url } = await adminGetUploadUrl(file.name, file.type)

      const uploadRes = await fetch(upload_url, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      })

      if (!uploadRes.ok) throw new Error("S3 Upload failed")

      const m = await adminAddMedia(id, {
        url: public_url,
        media_type: "image",
        meta: { 
          role: media.length === 0 ? "hero" : "gallery", 
          order: media.length + 1 
        },
      })
      setMedia((xs) => [...xs, m])
    } catch (e: any) {
      alert("Upload Error: " + e.message)
    } finally {
      setUploading(false)
    }
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFileUpload(file)
  }, [id, media.length])

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFileUpload(file)
  }

  async function removeImage(mediaId: string) {
    if (!confirm("Remove this image?")) return
    await adminDeleteMedia(mediaId)
    setMedia(xs => xs.filter(m => m.id !== mediaId))
  }

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
            <h1 className="text-2xl font-bold text-gray-900">{product.title || "Untitled Product"}</h1>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="font-mono bg-gray-100 px-1 rounded">{id.slice(0,8)}</span>
              <span>•</span>
              <Link href={`/product/${product.slug}`} target="_blank" className="flex items-center gap-1 hover:text-blue-600">
                View Live <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
        <button 
          onClick={saveProduct}
          disabled={saving}
          className="flex items-center gap-2 bg-black text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition shadow-sm"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Changes
        </button>
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
                  value={product.title || ""}
                  onChange={e => setProduct({ ...product, title: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                  <input
                    className="w-full rounded-lg border border-gray-300 p-2.5 text-sm outline-none bg-gray-50 font-mono text-gray-600"
                    value={product.slug || ""}
                    onChange={e => setProduct({ ...product, slug: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <input
                    className="w-full rounded-lg border border-gray-300 p-2.5 text-sm outline-none"
                    value={product.category || ""}
                    onChange={e => setProduct({ ...product, category: e.target.value })}
                  />
                </div>
              </div>
              
              {/* Short Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Short Description</label>
                <textarea
                  className="w-full rounded-lg border border-gray-300 p-2.5 text-sm outline-none min-h-[80px]"
                  value={product.short_desc || ""}
                  onChange={e => setProduct({ ...product, short_desc: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* 2. Attributes (Specific Fields) */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
             <h2 className="text-lg font-semibold text-gray-900 mb-4">Attributes</h2>
             <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fabric</label>
                  <input
                    className="w-full rounded-lg border border-gray-300 p-2.5 text-sm"
                    value={product.attributes?.fabric || ""}
                    onChange={e => updateAttribute("fabric", e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Weave</label>
                  <input
                    className="w-full rounded-lg border border-gray-300 p-2.5 text-sm"
                    value={product.attributes?.weave || ""}
                    onChange={e => updateAttribute("weave", e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                  <input
                    className="w-full rounded-lg border border-gray-300 p-2.5 text-sm"
                    value={product.attributes?.color || ""}
                    onChange={e => updateAttribute("color", e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Origin</label>
                  <input
                    className="w-full rounded-lg border border-gray-300 p-2.5 text-sm"
                    value={product.attributes?.origin || ""}
                    onChange={e => updateAttribute("origin", e.target.value)}
                  />
                </div>
             </div>
             
             {/* Occasion */}
             <div className="mt-4">
               <label className="block text-sm font-medium text-gray-700 mb-1">Occasion (JSON Array)</label>
               <input 
                 className="w-full rounded-lg border border-gray-300 p-2.5 text-sm"
                 placeholder='e.g. ["Wedding", "Party"]'
                 value={JSON.stringify(product.attributes?.occasion || [])} 
                 disabled
               />
               <p className="text-xs text-gray-400 mt-1">Editing arrays directly requires advanced UI, currently read-only.</p>
             </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Media & Status */}
        <div className="space-y-6">
          
          {/* 3. Settings Card (Includes Price, MRP, Stock) */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Settings</h2>
            
            {/* Published Toggle */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Published</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={product.published || false} 
                  onChange={e => setProduct({...product, published: e.target.checked})} 
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-green-600 after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
              </label>
            </div>

            {/* In Stock Toggle */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">In Stock</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={product.in_stock || false} 
                  onChange={e => setProduct({...product, in_stock: e.target.checked})} 
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-blue-600 after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
              </label>
            </div>

            {/* Price & Stock Inputs */}
            <div className="pt-4 border-t border-gray-100 grid grid-cols-2 gap-4">
               <div>
                 <label className="block text-xs font-medium text-gray-500 mb-1">Price (₹)</label>
                 <input 
                   type="number" 
                   className={`w-full border rounded p-2 text-sm ${noSpinnerClass}`}
                   value={product.price}
                   onChange={e => setProduct({
                     ...product, 
                     price: e.target.value === "" ? "" : Number(e.target.value)
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
                     mrp: e.target.value === "" ? "" : Number(e.target.value)
                   })}
                 />
               </div>
               <div className="col-span-2">
                 <label className="block text-xs font-medium text-gray-500 mb-1">Total Stock (Qty)</label>
                 <input 
                   type="number" 
                   className={`w-full border rounded p-2 text-sm ${noSpinnerClass}`}
                   value={product.stock}
                   onChange={e => {
                     const val = e.target.value === "" ? "" : Number(e.target.value);
                     setProduct({
                       ...product, 
                       stock: val,
                       // Auto-enable "In Stock" if quantity > 0
                       in_stock: (typeof val === 'number' && val > 0) ? true : product.in_stock
                     })
                   }}
                 />
               </div>
            </div>

            {/* Tags */}
            <div className="pt-4 border-t border-gray-100">
               <label className="block text-xs font-medium text-gray-500 mb-1">Tags (comma separated)</label>
               <input 
                 className="w-full border rounded p-2 text-sm"
                 placeholder="Saree, Silk, Red"
                 value={tagsInput}
                 onChange={e => setTagsInput(e.target.value)}
               />
            </div>
          </div>

          {/* 4. Media Manager */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Media</h2>
            
            <div 
              onDragOver={(e) => e.preventDefault()}
              onDrop={onDrop}
              className={`mb-4 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 px-6 py-8 text-center transition hover:bg-gray-100 ${uploading ? "opacity-50 cursor-wait" : "cursor-pointer"}`}
            >
              <label htmlFor="file-upload" className="cursor-pointer">
                {uploading ? (
                  <Loader2 className="mx-auto h-8 w-8 animate-spin text-gray-400" />
                ) : (
                  <CloudUpload className="mx-auto h-8 w-8 text-gray-400" />
                )}
                <div className="mt-2 text-sm text-gray-600">
                  <span className="font-semibold text-black hover:underline">Click to upload</span> or drag and drop
                </div>
                <input 
                  id="file-upload" 
                  type="file" 
                  className="hidden" 
                  accept="image/*"
                  onChange={onFileSelect}
                  disabled={uploading}
                />
              </label>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {media.map((m, i) => (
                <div key={m.id} className="group relative aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                  <img src={m.url} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                    <button onClick={() => removeImage(m.id)} type="button" className="p-1.5 bg-white text-red-600 rounded-full hover:bg-red-50">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}