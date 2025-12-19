"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { 
  Heart, 
  ShoppingBag, 
  Truck, 
  ShieldCheck, 
  ChevronDown, 
  ChevronUp, 
  Share2,
  Star,
  ArrowRight
} from "lucide-react"
import { addToCart } from "@/lib/cart"
import { emitCartUpdated } from "@/lib/cart-events"
import { fetchProducts } from "@/lib/api"
import type { ProductCard } from "@/lib/types"

// Types matching your backend response
type MediaItem = {
  id: string
  url: string
  meta: { role: "hero" | "gallery"; order?: number }
}

type Variant = {
  id: string
  price: number
  mrp?: number
  stock: number
}

type Product = {
  id: string
  title: string
  short_desc?: string
  attributes?: Record<string, any>
}

type ProductDetailPageProps = {
  product: Product
  variants: Variant[]
  media: MediaItem[]
}

export default function ProductDetailPage({ product, variants, media }: ProductDetailPageProps) {
  // 🛡️ CRITICAL FIX: Prevent crash if product is missing
  if (!product) return null

  const [adding, setAdding] = useState(false)
  const [openSection, setOpenSection] = useState<string | null>("details")
  const [similarProducts, setSimilarProducts] = useState<ProductCard[]>([])

  // Data Safety
  const safeMedia = Array.isArray(media) ? media : []
  const safeVariants = Array.isArray(variants) ? variants : []
  const variant = safeVariants[0] ?? null
  const isInStock = variant && variant.stock > 0

  // Price Logic
  const price = variant?.price || 0
  const mrp = variant?.mrp || 0
  const discount = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0

  // Images - Sort Hero first
  const sortedImages = [...safeMedia].sort((a, b) => {
    if (a.meta?.role === "hero") return -1
    if (b.meta?.role === "hero") return 1
    return 0
  })

  const formatINR = (amount: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount)

  // Fetch Similar Products
  useEffect(() => {
    if (!product?.id) return

    const loadSimilar = async () => {
      try {
        // Use category from attributes, fallback to 'saree'
        const category = product.attributes?.category || "saree"
        
        const res = await fetchProducts({
          page: 1,
          limit: 5, 
          category: category,
          sort: "latest"
        })
        
        // Filter out current product and take top 4
        const filtered = (res.items || [])
          .filter(p => p.id !== product.id)
          .slice(0, 4)
          
        setSimilarProducts(filtered)
      } catch (err) {
        console.error("Failed to load similar products", err)
      }
    }

    loadSimilar()
  }, [product])

  async function handleAddToCart(redirect = false) {
    if (!variant) return
    try {
      setAdding(true)
      await addToCart({
        product_id: product.id,
        variant_id: variant.id,
        quantity: 1,
      })
      emitCartUpdated()
      if (redirect) window.location.href = "/cart"
    } catch (e: any) {
      alert(e.message || "Failed to add")
    } finally {
      setAdding(false)
    }
  }

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section)
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-[1400px] px-0 md:px-6 lg:px-8 py-0 md:py-8">
        
        <div className="flex flex-col lg:flex-row gap-0 lg:gap-16">
          
          {/* ================= LEFT: EDITORIAL SCROLL GALLERY ================= */}
          <div className="w-full lg:w-[60%] flex flex-col gap-1 md:gap-4 overflow-y-auto no-scrollbar">
            {/* Mobile Carousel / Desktop Stack */}
            <div className="flex overflow-x-auto md:flex-col snap-x md:snap-none gap-0.5 md:gap-4 scrollbar-hide">
              {sortedImages.length > 0 ? (
                sortedImages.map((img) => (
                  <div key={img.id} className="min-w-[100vw] md:min-w-0 snap-center md:rounded-lg overflow-hidden bg-gray-50 aspect-[3/4] md:aspect-auto relative group">
                    <img
                      src={img.url}
                      alt={product.title}
                      className="w-full h-full object-cover md:object-contain md:max-h-[800px]"
                    />
                  </div>
                ))
              ) : (
                <div className="w-full h-[500px] bg-gray-100 flex items-center justify-center text-gray-400">
                  No Image Available
                </div>
              )}
            </div>
          </div>

          {/* ================= RIGHT: STICKY INFO PANEL ================= */}
          <div className="w-full lg:w-[40%] px-4 md:px-0 pt-6 md:pt-0 lg:sticky lg:top-24 lg:h-fit">
            
            {/* Header */}
            <div className="mb-6 border-b border-gray-100 pb-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xs font-bold tracking-widest text-gray-500 uppercase mb-2">
                    {product.attributes?.category || "Sabhyatam Exclusive"}
                  </h2>
                  <h1 className="text-2xl md:text-3xl font-serif text-gray-900 leading-tight mb-2">
                    {product.title}
                  </h1>
                </div>
                <button className="p-2 rounded-full hover:bg-gray-50 text-gray-400 hover:text-red-500 transition">
                  <Heart className="w-6 h-6" />
                </button>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-2 mb-4">
                 <div className="flex text-yellow-500 text-sm">
                   {[1,2,3,4].map(i => <Star key={i} className="w-4 h-4 fill-current" />)}
                   <Star className="w-4 h-4 text-gray-300 fill-current" />
                 </div>
                 <span className="text-xs text-gray-500 underline">24 Reviews</span>
              </div>

              {/* Price */}
              <div className="flex items-end gap-3">
                <span className="text-3xl font-light text-gray-900">
                  {formatINR(price)}
                </span>
                {discount > 0 && (
                  <>
                    <span className="text-lg text-gray-400 line-through mb-1">
                      {formatINR(mrp)}
                    </span>
                    <span className="text-sm font-semibold text-red-600 mb-1 bg-red-50 px-2 py-0.5 rounded">
                      -{discount}%
                    </span>
                  </>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Tax included. Shipping calculated at checkout.
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3 mb-8">
              <button
                onClick={() => handleAddToCart(false)}
                disabled={!isInStock || adding}
                className="w-full bg-black text-white h-12 md:h-14 font-medium tracking-wide hover:bg-gray-900 disabled:opacity-50 transition-all flex items-center justify-center gap-2 rounded-sm"
              >
                {adding ? (
                   <span className="animate-pulse">ADDING...</span>
                ) : !isInStock ? (
                   "OUT OF STOCK"
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4" /> ADD TO CART
                  </>
                )}
              </button>
              
              <button
                onClick={() => handleAddToCart(true)}
                disabled={!isInStock || adding}
                className="w-full border border-black text-black bg-transparent h-12 md:h-14 font-medium tracking-wide hover:bg-gray-50 disabled:opacity-50 transition-all rounded-sm"
              >
                BUY IT NOW
              </button>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-2 mb-8 text-center">
              <div className="flex flex-col items-center gap-2 p-3 bg-gray-50 rounded">
                <Truck className="w-5 h-5 text-gray-700" />
                <span className="text-[10px] font-medium uppercase tracking-wide">Fast Shipping</span>
              </div>
              <div className="flex flex-col items-center gap-2 p-3 bg-gray-50 rounded">
                <ShieldCheck className="w-5 h-5 text-gray-700" />
                <span className="text-[10px] font-medium uppercase tracking-wide">Authentic</span>
              </div>
              <div className="flex flex-col items-center gap-2 p-3 bg-gray-50 rounded">
                <Share2 className="w-5 h-5 text-gray-700" />
                <span className="text-[10px] font-medium uppercase tracking-wide">Share</span>
              </div>
            </div>

            {/* Accordion Details */}
            <div className="border-t border-gray-200">
              
              {/* 1. Description */}
              <div className="border-b border-gray-200">
                <button 
                  onClick={() => toggleSection('details')}
                  className="w-full flex items-center justify-between py-4 text-left group"
                >
                  <span className="font-semibold text-sm uppercase tracking-wide text-gray-900">
                    Product Details
                  </span>
                  {openSection === 'details' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {openSection === 'details' && (
                  <div className="pb-4 text-sm text-gray-600 leading-relaxed animate-in slide-in-from-top-2">
                    <p className="mb-4">{product.short_desc}</p>
                    <div className="grid grid-cols-2 gap-2">
                      {product.attributes && Object.entries(product.attributes).map(([k, v]) => (
                        <div key={k} className="flex flex-col">
                           <span className="text-[10px] uppercase text-gray-400">{k}</span>
                           <span className="font-medium text-gray-900 capitalize">
                             {Array.isArray(v) ? v.join(", ") : v}
                           </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Care Guide */}
              <div className="border-b border-gray-200">
                <button 
                  onClick={() => toggleSection('care')}
                  className="w-full flex items-center justify-between py-4 text-left group"
                >
                  <span className="font-semibold text-sm uppercase tracking-wide text-gray-900">
                    Material & Care
                  </span>
                  {openSection === 'care' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {openSection === 'care' && (
                  <div className="pb-4 text-sm text-gray-600 leading-relaxed">
                    <ul className="list-disc pl-4 space-y-1">
                      <li>Dry clean only recommended.</li>
                      <li>Store in a cool, dry place wrapped in muslin cloth.</li>
                      <li>Avoid direct exposure to sunlight for long durations.</li>
                    </ul>
                  </div>
                )}
              </div>

              {/* 3. Shipping */}
              <div className="border-b border-gray-200">
                <button 
                  onClick={() => toggleSection('shipping')}
                  className="w-full flex items-center justify-between py-4 text-left group"
                >
                  <span className="font-semibold text-sm uppercase tracking-wide text-gray-900">
                    Shipping & Returns
                  </span>
                  {openSection === 'shipping' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {openSection === 'shipping' && (
                  <div className="pb-4 text-sm text-gray-600 leading-relaxed">
                    <p>Free standard shipping on all orders above ₹999.</p>
                    <p className="mt-2">Estimated delivery: 3-5 business days.</p>
                    <p className="mt-2 text-xs text-gray-400">
                      Returns accepted within 7 days of delivery. Tags must be intact.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ================= SIMILAR PRODUCTS SECTION ================= */}
        {similarProducts.length > 0 && (
          <div className="mt-16 border-t border-gray-100 pt-16">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-serif text-gray-900">Similar Products</h2>
              <Link 
                href={`/search?category=${product.attributes?.category}`} 
                className="text-sm font-medium text-gray-600 hover:text-black flex items-center gap-1"
              >
                View All <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
              {similarProducts.map((p) => (
                <Link 
                  key={p.id} 
                  href={`/product/${p.slug}`}
                  className="group block"
                >
                  <div className="relative aspect-[3/4] overflow-hidden rounded-sm bg-gray-50 mb-3">
                    <img
                      src={p.image_url || "/placeholder.svg"}
                      alt={p.title}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition duration-300">
                       <button className="w-full bg-white text-black text-xs font-bold py-3 uppercase tracking-wider shadow-lg hover:bg-gray-50">
                         View Details
                       </button>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 truncate group-hover:text-gray-600 transition">
                      {p.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm font-bold text-gray-900">
                        {formatINR(p.price)}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}