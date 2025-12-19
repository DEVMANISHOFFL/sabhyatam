"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { 
  Heart, 
  ShoppingBag, 
  Truck, 
  ShieldCheck, 
  ChevronDown, 
  ChevronUp, 
  Share2,
  Star
} from "lucide-react"
import { addToCart } from "@/lib/cart"
import { emitCartUpdated } from "@/lib/cart-events"
import { fetchProducts } from "@/lib/api"
import type { ProductCard } from "@/lib/types"

// --- Types ---
type MediaItem = {
  id: string
  url: string
  meta: { role: "hero" | "gallery"; order?: number }
}

type Product = {
  id: string
  title: string
  short_desc?: string
  price: number
  mrp?: number
  stock: number
  in_stock: boolean
  category?: string
  slug: string
  attributes?: Record<string, any>
  // Allow media inside product object too
  media?: MediaItem[] 
}

type ProductDetailPageProps = {
  product: Product
  media?: MediaItem[] // Made optional
}

export default function ProductDetailPage({ product, media }: ProductDetailPageProps) {
  if (!product) return null

  const [adding, setAdding] = useState(false)
  const [openSection, setOpenSection] = useState<string | null>("details")
  const [similarProducts, setSimilarProducts] = useState<ProductCard[]>([])
  
  // --- Image Gallery State ---
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [isHovering, setIsHovering] = useState(false)
  const imageContainerRef = useRef<HTMLDivElement>(null)
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 })
  
  // Track image load errors to fallback individual images
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({})

  // --- Data Logic ---
  const price = product.price || 0
  const mrp = product.mrp || 0
  const stock = product.stock || 0
  const isInStock = stock > 0 
  const discount = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0

  // 🛠️ SMART IMAGE MERGE: Check both 'media' prop and 'product.media'
  let allMedia = Array.isArray(media) && media.length > 0 ? media : (product.media || [])
  
  // Sort: Hero first
  const sortedImages = [...allMedia].sort((a, b) => {
    if (a.meta?.role === "hero") return -1
    if (b.meta?.role === "hero") return 1
    return 0
  })

  // 🛠️ FALLBACK: If still no images, add a placeholder
  if (sortedImages.length === 0) {
    sortedImages.push({ 
      id: 'placeholder', 
      url: 'https://placehold.co/600x800/f3f4f6/9ca3af?text=No+Image', 
      meta: { role: 'hero' } 
    })
  }

  const activeImage = sortedImages[activeImageIndex] || sortedImages[0]

  // Helper to handle broken image URLs
  const handleImgError = (id: string) => {
    setImgErrors(prev => ({ ...prev, [id]: true }))
  }

  // Get valid URL (or fallback if error occurred)
  const getImgUrl = (img: MediaItem) => {
    if (imgErrors[img.id]) return 'https://placehold.co/600x800/f3f4f6/9ca3af?text=Image+Error'
    return img.url
  }

  const formatINR = (amount: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount)

  // --- Effects ---
  useEffect(() => {
    if (!product?.id) return
    const loadSimilar = async () => {
      try {
        const category = product.category || product.attributes?.category || "saree"
        const res = await fetchProducts({ page: 1, limit: 5, category, sort: "latest" })
        setSimilarProducts((res.items || []).filter(p => p.id !== product.id).slice(0, 4))
      } catch (err) {
        console.error("Failed to load similar products", err)
      }
    }
    loadSimilar()
  }, [product])

  // --- Handlers ---
  async function handleAddToCart(redirect = false) {
    if (!isInStock) return
    try {
      setAdding(true)
      await addToCart({ product_id: product.id, quantity: 1 })
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

  // --- Zoom Logic ---
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageContainerRef.current) return
    const { left, top, width, height } = imageContainerRef.current.getBoundingClientRect()
    let x = ((e.clientX - left) / width) * 100
    let y = ((e.clientY - top) / height) * 100
    if (x < 0) x = 0; if (x > 100) x = 100;
    if (y < 0) y = 0; if (y > 100) y = 100;
    setCursorPos({ x, y })
    setIsHovering(true)
  }

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="mx-auto max-w-[1400px] px-4 md:px-6 lg:px-8 py-8">
        
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-16">
          
          {/* ================= LEFT: IMAGE GALLERY ================= */}
          <div className="w-full lg:w-[60%] flex flex-col-reverse lg:flex-row gap-4 select-none">
            
            {/* Thumbnails */}
            <div className="flex lg:flex-col gap-3 overflow-x-auto lg:overflow-y-auto lg:max-h-[700px] scrollbar-hide py-2 lg:py-0 px-1 lg:px-0 lg:w-20 shrink-0">
              {sortedImages.map((img, idx) => (
                <button
                  key={img.id}
                  onMouseEnter={() => setActiveImageIndex(idx)}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`relative w-16 h-20 lg:w-full lg:h-24 shrink-0 rounded-md overflow-hidden border-2 transition-all duration-200 ${
                    activeImageIndex === idx 
                      ? "border-black opacity-100 ring-1 ring-black/10" 
                      : "border-transparent opacity-70 hover:opacity-100 hover:border-gray-200"
                  }`}
                >
                  <img 
                    src={getImgUrl(img)} 
                    onError={() => handleImgError(img.id)}
                    alt={`Thumb ${idx}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>

            {/* Main Image */}
            <div className="flex-1 relative bg-gray-50 rounded-lg overflow-hidden border border-gray-100 aspect-[3/4] lg:aspect-auto lg:h-[700px] group cursor-crosshair z-10">
               <div 
                 ref={imageContainerRef}
                 className="w-full h-full relative"
                 onMouseMove={handleMouseMove}
                 onMouseLeave={() => setIsHovering(false)}
               >
                 <img
                   src={getImgUrl(activeImage)}
                   onError={() => handleImgError(activeImage.id)}
                   alt={product.title}
                   className={`w-full h-full object-cover transition-opacity duration-200 ${isHovering ? 'opacity-0' : 'opacity-100'}`}
                 />
                 
                 {/* Zoom Lens */}
                 {isHovering && !imgErrors[activeImage.id] && (
                   <div 
                     className="absolute inset-0 pointer-events-none bg-white"
                     style={{
                       backgroundImage: `url(${getImgUrl(activeImage)})`,
                       backgroundPosition: `${cursorPos.x}% ${cursorPos.y}%`,
                       backgroundSize: '250%',
                       backgroundRepeat: 'no-repeat'
                     }}
                   />
                 )}
               </div>
               
               {discount > 0 && (
                 <div className="absolute top-4 left-4 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm z-20">
                   -{discount}% OFF
                 </div>
               )}
            </div>
          </div>

          {/* ================= RIGHT: INFO ================= */}
          <div className="w-full lg:w-[40%] flex flex-col gap-6 lg:sticky lg:top-24 h-fit">
            
            <div>
              <div className="flex justify-between items-start">
                <h2 className="text-xs font-bold tracking-widest text-gray-500 uppercase mb-2">
                  {product.category || "Sabhyatam Exclusive"}
                </h2>
                <button className="p-2 -mr-2 rounded-full hover:bg-gray-50 text-gray-400 hover:text-red-500 transition">
                  <Heart className="w-6 h-6" />
                </button>
              </div>
              
              <h1 className="text-3xl font-serif text-gray-900 leading-tight mb-4">
                {product.title}
              </h1>
              
              <div className="flex items-center gap-2 mb-6">
                 <div className="flex text-yellow-500 text-sm">
                   {[1,2,3,4].map(i => <Star key={i} className="w-4 h-4 fill-current" />)}
                   <Star className="w-4 h-4 text-gray-300 fill-current" />
                 </div>
                 <span className="text-xs text-gray-500 underline">24 Reviews</span>
              </div>
              
              <div className="flex items-end gap-3 pb-6 border-b border-gray-100">
                <span className="text-4xl font-light text-gray-900">
                  {formatINR(price)}
                </span>
                {discount > 0 && (
                  <div className="flex flex-col mb-1">
                    <span className="text-sm text-gray-400 line-through">
                      {formatINR(mrp)}
                    </span>
                    <span className="text-xs text-green-600 font-bold">Inclusive of all taxes</span>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleAddToCart(false)}
                disabled={!isInStock || adding}
                className="col-span-2 bg-black text-white h-14 font-bold tracking-widest hover:bg-gray-900 disabled:opacity-70 transition-all flex items-center justify-center gap-3 rounded-sm shadow-xl shadow-black/5"
              >
                {adding ? (
                   <span className="animate-pulse">ADDING...</span>
                ) : !isInStock ? (
                   "OUT OF STOCK"
                ) : (
                  <>
                    <ShoppingBag className="w-5 h-5" /> ADD TO BAG
                  </>
                )}
              </button>
              
              <button
                onClick={() => handleAddToCart(true)}
                disabled={!isInStock || adding}
                className="col-span-2 border border-black text-black bg-white h-14 font-bold tracking-widest hover:bg-gray-50 disabled:opacity-50 transition-all rounded-sm"
              >
                BUY IT NOW
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4 py-6 border-b border-gray-100 text-center text-gray-600">
              {[
                { icon: Truck, text: "Fast Shipping" },
                { icon: ShieldCheck, text: "Authentic" },
                { icon: Share2, text: "Share" }
              ].map((Badge, i) => (
                <div key={i} className="flex flex-col items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition cursor-default">
                  <Badge.icon className="w-5 h-5" />
                  <span className="text-[10px] font-bold uppercase tracking-wide">{Badge.text}</span>
                </div>
              ))}
            </div>

            <div className="space-y-4">
               <p className="text-gray-600 leading-relaxed text-sm">
                 {product.short_desc}
               </p>

               <div className="border-t border-gray-200">
                 <div className="py-4">
                    <button 
                      onClick={() => toggleSection('details')}
                      className="w-full flex items-center justify-between text-left group"
                    >
                      <span className="font-bold text-xs uppercase tracking-wide text-gray-900">Product Details</span>
                      {openSection === 'details' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    
                    {openSection === 'details' && (
                      <div className="mt-4 grid grid-cols-2 gap-y-3 gap-x-6 text-sm animate-in slide-in-from-top-1">
                        {product.attributes && Object.entries(product.attributes).map(([k, v]) => (
                          <div key={k} className="flex flex-col border-l-2 border-gray-100 pl-3">
                             <span className="text-[10px] uppercase text-gray-400 font-bold mb-0.5">{k}</span>
                             <span className="font-medium text-gray-900 capitalize truncate">
                               {Array.isArray(v) ? v.join(", ") : v}
                             </span>
                          </div>
                        ))}
                      </div>
                    )}
                 </div>
               </div>
            </div>

          </div>
        </div>

        {similarProducts.length > 0 && (
          <div className="mt-24 pt-12 border-t border-gray-100">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-serif text-gray-900">You May Also Like</h2>
              <Link href={`/search?category=${product.category}`} className="text-sm font-bold border-b border-black pb-0.5 hover:opacity-70 transition">
                View Collection
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-10">
              {similarProducts.map((p) => (
                <Link key={p.id} href={`/product/${p.slug}`} className="group block">
                  <div className="relative aspect-[3/4] overflow-hidden rounded-sm bg-gray-100 mb-4">
                    <img
                      src={p.image_url || "/placeholder.svg"}
                      alt={p.title}
                      className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                    <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                      <button className="w-full bg-white text-black text-xs font-bold py-3 uppercase tracking-wider shadow-lg">
                        View Details
                      </button>
                    </div>
                  </div>
                  <h3 className="text-sm font-medium text-gray-900 line-clamp-1 group-hover:text-gray-600 transition">{p.title}</h3>
                  <p className="text-sm font-bold text-gray-900 mt-1">{formatINR(p.price)}</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}