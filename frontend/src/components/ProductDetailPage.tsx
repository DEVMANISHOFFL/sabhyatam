"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation" // Added for redirection
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
  MapPin,
  Tag,
  AlertCircle,
  Zap
} from "lucide-react"

// --- Auth & Cart Integration ---
import { useAuth } from "@/app/context/auth-context" // Added
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
  media?: MediaItem[] 
}

type ProductDetailPageProps = {
  product: Product
  media?: MediaItem[]
}

export default function ProductDetailPage({ product, media }: ProductDetailPageProps) {
  if (!product) return null

  // --- Auth & Navigation ---
  const { user } = useAuth() //
  const router = useRouter()

  // --- State ---
  const [adding, setAdding] = useState(false)
  const [buyNowLoading, setBuyNowLoading] = useState(false)
  const [openSection, setOpenSection] = useState<string | null>("details")
  const [similarProducts, setSimilarProducts] = useState<ProductCard[]>([])
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [isHovering, setIsHovering] = useState(false)
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 })
  const [pincode, setPincode] = useState("")
  const [deliveryDate, setDeliveryDate] = useState<string | null>(null)
  
  const imageContainerRef = useRef<HTMLDivElement>(null)

  // --- Data Normalization ---
  const price = product.price || 0
  const mrp = product.mrp || 0
  const stock = product.stock || 0
  const isInStock = stock > 0 
  const discount = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0
  
  let allMedia = Array.isArray(media) && media.length > 0 ? media : (product.media || [])
  const sortedImages = [...allMedia].sort((a, b) => {
    if (a.meta?.role === "hero") return -1
    if (b.meta?.role === "hero") return 1
    return 0
  })

  if (sortedImages.length === 0) {
    sortedImages.push({ 
      id: 'placeholder', 
      url: 'https://placehold.co/600x800/f3f4f6/9ca3af?text=No+Image', 
      meta: { role: 'hero' } 
    })
  }

  const activeImage = sortedImages[activeImageIndex] || sortedImages[0]

  const formatINR = (amount: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount)

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

  // --- Authenticated Cart Handler ---
  async function handleAddToCart(isBuyNow = false) {
    if (!isInStock) return

    // BUG FIX: Prevent non-logged in users from adding to cart
    if (!user) {
      alert("Please log in to add items to your cart.")
      router.push("/login") //
      return
    }

    try {
      if (isBuyNow) setBuyNowLoading(true)
      else setAdding(true)

      await addToCart({ product_id: product.id, quantity: 1 })
      emitCartUpdated()
      
      if (isBuyNow) {
        router.push("/cart")
      }
    } catch (e: any) {
      alert(e.message || "Failed to add")
    } finally {
      setAdding(false)
      setBuyNowLoading(false)
    }
  }

  const checkDelivery = () => {
    if (pincode.length === 6) {
      const date = new Date()
      date.setDate(date.getDate() + 4)
      setDeliveryDate(date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }))
    } else {
      setDeliveryDate(null)
    }
  }

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
    <div className="min-h-screen bg-white text-gray-900 pb-20 lg:pb-0">
      <div className="border-b border-gray-100">
        <div className="mx-auto max-w-[1400px] px-4 md:px-6 py-3 text-xs text-gray-500 flex items-center gap-2">
           <Link href="/" className="hover:text-black">Home</Link>
           <span>/</span>
           <Link href={`/search?category=${product.category}`} className="hover:text-black capitalize">
             {product.category || "Products"}
           </Link>
           <span>/</span>
           <span className="text-gray-900 font-medium truncate max-w-[200px]">{product.title}</span>
        </div>
      </div>

      <div className="mx-auto max-w-[1400px] px-0 lg:px-6 py-0 lg:py-8">
        <div className="flex flex-col lg:flex-row gap-0 lg:gap-12 xl:gap-16">
          <div className="w-full lg:w-[55%] xl:w-[60%] flex flex-col-reverse lg:flex-row gap-4 select-none bg-white">
            <div className="hidden lg:flex flex-col gap-3 w-20 shrink-0 h-[600px] overflow-y-auto no-scrollbar py-1">
              {sortedImages.map((img, idx) => (
                <button
                  key={img.id}
                  onMouseEnter={() => setActiveImageIndex(idx)}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`relative w-full aspect-[3/4] rounded border-2 transition-all duration-200 overflow-hidden ${
                    activeImageIndex === idx 
                      ? "border-black ring-1 ring-black/10" 
                      : "border-transparent hover:border-gray-200"
                  }`}
                >
                  <img src={img.url} className="w-full h-full object-cover" alt="" />
                </button>
              ))}
            </div>

            <div className="flex-1 relative bg-gray-50 lg:rounded-lg overflow-hidden aspect-[3/4] lg:h-[700px] group cursor-crosshair z-10">
               <div className="lg:hidden absolute bottom-4 right-4 bg-black/60 text-white text-[10px] px-2 py-1 rounded-full z-20">
                  {activeImageIndex + 1} / {sortedImages.length}
               </div>

               <div 
                 ref={imageContainerRef}
                 className="w-full h-full relative"
                 onMouseMove={handleMouseMove}
                 onMouseLeave={() => setIsHovering(false)}
                 onTouchStart={() => setIsHovering(false)}
               >
                 <img
                   src={activeImage.url}
                   alt={product.title}
                   className={`w-full h-full object-cover transition-opacity duration-200 ${isHovering ? 'opacity-0' : 'opacity-100'}`}
                 />
                 
                 {isHovering && (
                   <div 
                     className="hidden lg:block absolute inset-0 pointer-events-none bg-white"
                     style={{
                       backgroundImage: `url(${activeImage.url})`,
                       backgroundPosition: `${cursorPos.x}% ${cursorPos.y}%`,
                       backgroundSize: '250%',
                       backgroundRepeat: 'no-repeat'
                     }}
                   />
                 )}
               </div>

               {discount > 0 && (
                 <div className="absolute top-4 left-4 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded shadow-sm z-20">
                   {discount}% OFF
                 </div>
               )}
               <button className="absolute top-4 right-4 p-2 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white text-gray-700 hover:text-red-500 transition shadow-sm z-20">
                  <Heart className="w-5 h-5" />
               </button>
            </div>

            <div className="lg:hidden flex gap-2 overflow-x-auto px-4 pb-4 snap-x">
               {sortedImages.map((img, idx) => (
                  <button
                    key={img.id}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`shrink-0 w-16 h-20 rounded border-2 snap-start ${
                       activeImageIndex === idx ? "border-black" : "border-transparent"
                    }`}
                  >
                     <img src={img.url} className="w-full h-full object-cover rounded-[2px]" alt="" />
                  </button>
               ))}
            </div>
          </div>

          <div className="w-full lg:w-[45%] xl:w-[40%] px-4 lg:px-0 flex flex-col gap-6 lg:sticky lg:top-24 h-fit">
            <div>
              <p className="text-gray-500 text-xs font-bold tracking-widest uppercase mb-2">
                 {product.attributes?.brand || "Sabhyatam Exclusive"}
              </p>
              <h1 className="text-2xl lg:text-3xl font-serif text-gray-900 leading-tight mb-2">
                {product.title}
              </h1>

              <div className="flex items-center gap-2 mb-4">
                 <div className="flex bg-green-700 text-white text-[10px] font-bold px-1.5 py-0.5 rounded items-center gap-1">
                    4.2 <Star className="w-3 h-3 fill-current" />
                 </div>
                 <span className="text-xs text-gray-500 font-medium">1,240 Ratings & 85 Reviews</span>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-3xl font-medium text-gray-900">
                  {formatINR(price)}
                </span>
                {discount > 0 && (
                  <>
                     <span className="text-lg text-gray-400 line-through decoration-gray-400">
                        {formatINR(mrp)}
                     </span>
                     <span className="text-sm font-bold text-green-600">
                        {discount}% off
                     </span>
                  </>
                )}
              </div>
              <p className="text-[10px] text-gray-500 mt-1">Inclusive of all taxes</p>
            </div>

            <div className="space-y-3">
               <div className="bg-green-50 border border-green-100 p-3 rounded-lg flex gap-3 items-start">
                  <Tag className="w-4 h-4 text-green-700 shrink-0 mt-0.5" />
                  <div>
                     <p className="text-xs font-bold text-gray-800">Bank Offer</p>
                     <p className="text-xs text-gray-600">5% Cashback on Axis Bank Credit Card</p>
                  </div>
               </div>
               {stock < 10 && stock > 0 && (
                  <div className="flex items-center gap-2 text-red-600 text-xs font-bold animate-pulse">
                     <AlertCircle className="w-4 h-4" />
                     Hurry, only {stock} left!
                  </div>
               )}
            </div>

            <div className="py-4 border-y border-gray-100">
               <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Delivery</span>
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                     <MapPin className="w-3 h-3" />
                     <input 
                        type="text" 
                        placeholder="Enter Pincode" 
                        maxLength={6}
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value.replace(/\D/g,''))}
                        className="w-24 border-b border-gray-300 focus:border-black outline-none pb-0.5 text-gray-900 font-medium placeholder:font-normal"
                     />
                     <button onClick={checkDelivery} className="text-pink-600 font-bold ml-2">Check</button>
                  </div>
               </div>
               
               {deliveryDate ? (
                  <p className="text-sm font-medium text-gray-900 flex items-center gap-2">
                     <Truck className="w-4 h-4 text-green-600" />
                     Delivery by <span className="font-bold">{deliveryDate}</span>
                     <span className="text-xs text-gray-400 font-normal ml-1">| Free</span>
                  </p>
               ) : (
                  <p className="text-xs text-gray-400">Enter pincode to check delivery date</p>
               )}
            </div>

            {/* Actions: Re-routed to handleAddToCart with user check */}
            <div className="hidden lg:grid grid-cols-2 gap-4">
              <button
                onClick={() => handleAddToCart(false)}
                disabled={!isInStock || adding}
                className="h-14 bg-white border border-gray-300 text-gray-900 font-bold rounded hover:bg-gray-50 transition flex items-center justify-center gap-2 uppercase tracking-wide text-sm"
              >
                {adding ? (
                   <span className="animate-pulse">Adding...</span>
                ) : !isInStock ? (
                   "Out of Stock"
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4" /> Add to Cart
                  </>
                )}
              </button>
              
              <button
                onClick={() => handleAddToCart(true)}
                disabled={!isInStock || buyNowLoading}
                className="h-14 bg-[#fb641b] text-white font-bold rounded shadow-lg hover:bg-[#f06018] transition uppercase tracking-wide text-sm flex items-center justify-center gap-2"
              >
                {buyNowLoading ? (
                   <span className="animate-pulse">Processing...</span>
                ) : (
                   <>
                     <Zap className="w-4 h-4 fill-current" /> Buy Now
                   </>
                )}
              </button>
            </div>

            <div className="space-y-4">
               <div className="border border-gray-200 rounded-lg p-4">
                  <p className="text-sm text-gray-700 leading-relaxed mb-4">
                     {product.short_desc}
                  </p>
                  <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm">
                     {product.attributes && Object.entries(product.attributes).map(([k, v]) => (
                        <div key={k} className="flex flex-col">
                           <span className="text-[10px] text-gray-400 uppercase font-bold">{k}</span>
                           <span className="font-medium text-gray-900 capitalize">{Array.isArray(v) ? v.join(", ") : v}</span>
                        </div>
                     ))}
                  </div>
               </div>

               <div className="border-t border-gray-100 pt-2">
                  <button onClick={() => setOpenSection(openSection === 'return' ? null : 'return')} className="w-full flex justify-between py-3 text-sm font-medium text-gray-800">
                     <span>Returns & Exchange</span>
                     {openSection === 'return' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  {openSection === 'return' && (
                     <div className="pb-4 text-xs text-gray-500 leading-relaxed">
                        Easy 7 days return and exchange. Return Policies may vary based on products and promotions.
                     </div>
                  )}
               </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-gray-500 bg-gray-50 p-4 rounded-lg">
               <div className="flex flex-col items-center gap-1">
                  <ShieldCheck className="w-5 h-5 text-gray-400" />
                  <span className="text-[10px] uppercase font-bold">Authentic</span>
               </div>
               <div className="flex flex-col items-center gap-1">
                  <Truck className="w-5 h-5 text-gray-400" />
                  <span className="text-[10px] uppercase font-bold">Free Shipping</span>
               </div>
               <div className="flex flex-col items-center gap-1">
                  <Share2 className="w-5 h-5 text-gray-400" />
                  <span className="text-[10px] uppercase font-bold">Secure</span>
               </div>
            </div>
          </div>
        </div>

        {similarProducts.length > 0 && (
          <div className="mt-16 px-4 lg:px-0">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Similar Products</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
              {similarProducts.map((p) => (
                <Link key={p.id} href={`/product/${p.slug}`} className="group block border border-transparent hover:border-gray-200 hover:shadow-lg rounded-lg p-2 transition">
                  <div className="aspect-[3/4] overflow-hidden rounded bg-gray-100 mb-3 relative">
                    <img
                      src={p.image_url || "/placeholder.svg"}
                      alt={p.title}
                      className="h-full w-full object-cover group-hover:scale-105 transition duration-500"
                    />
                  </div>
                  <h3 className="text-sm font-medium text-gray-900 line-clamp-1">{p.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                     <span className="text-sm font-bold text-gray-900">{formatINR(p.price)}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-2 z-50 flex gap-2 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
         <button
            onClick={() => handleAddToCart(false)}
            disabled={!isInStock || adding}
            className="flex-1 bg-white border border-gray-300 text-gray-900 font-bold py-3 rounded text-sm uppercase"
         >
            {adding ? "Adding..." : "Add to Cart"}
         </button>
         <button
            onClick={() => handleAddToCart(true)}
            disabled={!isInStock || buyNowLoading}
            className="flex-1 bg-[#fb641b] text-white font-bold py-3 rounded text-sm uppercase shadow-sm"
         >
            {buyNowLoading ? "Processing..." : "Buy Now"}
         </button>
      </div>
    </div>
  )
}