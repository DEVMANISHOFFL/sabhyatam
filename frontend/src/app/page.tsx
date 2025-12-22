
"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { fetchProducts } from "@/lib/api"
import { ProductCard } from "@/lib/types"

import {
  MapPin,
  Zap,
  Shield,
  Truck,
  Award,
  ArrowRight,
  ShoppingBag,
  Heart,
  ChevronDown,
  Video, // Added for Bento Grid
  Sparkles, // Added for Bento Grid
  PlayCircle // Added for Bento Grid
} from "lucide-react"

import { CATEGORIES } from "@/lib/categories"
import DebugToken from "@/components/Test"

// --- UTILS ---

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}




const getProductMeta = (product: ProductCard) => {
  const seed = typeof product.id === 'number' 
    ? product.id 
    : product.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)

  const realStock = (product as any).stock ?? (product as any).inventory_count
  const simulatedStock = (seed % 45) // Range: 0 to 44
  const stock = realStock ?? simulatedStock
  
  const isOutOfStock = stock <= 0
  const isLowStock = stock > 0 && stock < 15
  const stockProgress = isOutOfStock ? 0 : Math.min(100, Math.max(10, (stock / 50) * 100))

  const realMRP = (product as any).original_price ?? (product as any).mrp
  const simulatedMRP = Math.round(product.price * (1 + ((seed % 30) + 10) / 100))
  const mrp = realMRP ?? simulatedMRP

  const discountPercent = Math.round(((mrp - product.price) / mrp) * 100)

  return { stock, isOutOfStock, isLowStock, stockProgress, mrp, discountPercent }
}




export default function HomePage() {
  const [products, setProducts] = useState<ProductCard[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProducts()
  }, [])

  async function loadProducts() {
    try {
      const res = await fetchProducts({ page: 1, limit: 24, sort: "latest" })
      setProducts(res.items ?? [])
    } catch (err) {
      console.error("failed to load products", err)
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <div className="w-12 h-12 border-4 border-gray-200 border-t-pink-600 rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500 font-medium animate-pulse">Curating your collection...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] font-sans text-gray-900">
      
      {/* 1. Top Utility Bar */}
      <div className="bg-gray-900 text-white text-[11px] md:text-xs py-2 tracking-wide">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <p className="font-medium">Free Shipping on Orders Above ₹1,999</p>
          <div className="flex items-center gap-4">
            <Link href="/download" className="hover:text-gray-300 transition">Download App</Link>
            <span className="hidden md:inline text-gray-600">|</span>
            <div className="hidden md:flex items-center gap-1 cursor-pointer hover:text-gray-300 transition">
              <MapPin className="w-3 h-3" />
              <span>Deliver to: <span className="font-bold">India</span></span>
            </div>
          </div>
        </div>
      </div>
<DebugToken />
      {/* 2. CATEGORY NAV */}
      <nav className="sticky top-[64px] z-30 bg-white border-b border-gray-100 shadow-sm transition-all">
        <div className="container mx-auto px-4">
          <ul className="hidden lg:flex items-center justify-center gap-8">
            {CATEGORIES.map((cat) => (
               <li key={cat.slug} className="group relative">
                  <Link 
                    href={`/search?category=${cat.slug}`}
                    className="flex items-center gap-1 py-4 text-xs font-bold text-gray-700 hover:text-pink-600 uppercase tracking-widest transition-colors"
                  >
                    {cat.label}
                    {cat.subcategories && cat.subcategories.length > 0 && (
                      <ChevronDown className="w-3 h-3 transition-transform duration-200 group-hover:-rotate-180" />
                    )}
                  </Link>
                  {cat.subcategories && cat.subcategories.length > 0 && (
                     <div className="absolute top-full left-1/2 -translate-x-1/2 w-56 bg-white border border-gray-100 shadow-xl rounded-b-lg opacity-0 invisible translate-y-2 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-200 z-50 overflow-hidden">
                        <div className="h-0.5 w-full bg-pink-600"></div>
                        <ul className="py-2">
                           {cat.subcategories.map((sub) => (
                              <li key={sub.slug}>
                                 <Link 
                                   href={`/search?category=${cat.slug}&subcategory=${sub.slug}`}
                                   className="block px-5 py-3 text-sm text-gray-600 hover:bg-pink-50 hover:text-pink-700 transition-colors"
                                 >
                                    {sub.label}
                                 </Link>
                              </li>
                           ))}
                        </ul>
                     </div>
                  )}
               </li>
            ))}
             <li>
                <Link href="/search" className="py-4 text-xs font-bold text-gray-400 hover:text-black uppercase tracking-widest transition-colors">
                  View All
                </Link>
             </li>
          </ul>
        </div>
      </nav>

      {/* 3. Hero Section */}
      <section className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 h-auto md:h-[550px]">
          <Link href="/search?category=silk-sarees" className="md:col-span-2 md:row-span-2 relative group overflow-hidden rounded-2xl shadow-sm">
            <img src="https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=1200" alt="Hero" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 p-8 text-white">
              <span className="bg-white text-black text-xs font-bold px-3 py-1 uppercase tracking-wider mb-4 inline-block shadow-sm">New Arrival</span>
              <h2 className="text-3xl md:text-5xl font-serif mb-4 leading-tight">The Royal <br/>Kanjivaram</h2>
              <button className="bg-pink-600 text-white px-8 py-3 rounded-sm font-bold tracking-wide hover:bg-pink-700 transition shadow-lg">SHOP COLLECTION</button>
            </div>
          </Link>
          <Link href="/search?occasion=wedding" className="relative group overflow-hidden rounded-2xl md:col-span-1 md:row-span-2 shadow-sm">
             <img src="https://images.unsplash.com/photo-1705351509028-7dac9460039f?q=80&w=1171&auto=format&fit=crop" alt="Wedding" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
             <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition" />
             <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center p-6">
                <h3 className="text-3xl font-serif mb-2">Bridal Trousseau</h3>
                <span className="border-b-2 border-white pb-1 font-bold uppercase text-xs tracking-widest">Explore Now</span>
             </div>
          </Link>
          <div className="md:col-span-1 md:row-span-2 flex flex-col gap-4">
             <Link href="/search?category=cotton-sarees" className="flex-1 relative group overflow-hidden rounded-2xl shadow-sm">
                <img src="https://images.unsplash.com/photo-1580250569064-b2ac463aa820?q=80&w=2072&auto=format&fit=crop" alt="Cotton" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />
                <div className="absolute bottom-6 left-6 text-white"><h4 className="font-bold text-xl">Summer Cottons</h4></div>
             </Link>
             <Link href="/search?sort=price_asc" className="flex-1 relative group overflow-hidden rounded-2xl bg-[#2a2a72] flex items-center justify-center shadow-sm text-center text-white p-6">
                <p className="text-[10px] uppercase tracking-[0.2em] text-yellow-300 mb-2 font-bold">Flash Sale</p>
                <h3 className="text-4xl font-black italic">FLAT 50%</h3>
             </Link>
          </div>
        </div>
      </section>

      {/* 5. Deal of the Day (Fixed 0 Stock Logic) */}
      <section className="container mx-auto px-4 py-8">
        <div className="flex items-end justify-between mb-8">
          <h2 className="text-3xl font-serif text-gray-900">Deal of the Day</h2>
          <Link href="/search" className="text-sm font-semibold text-gray-900 hover:text-pink-600 transition">View All <ArrowRight className="inline w-4 h-4 ml-1" /></Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {products.slice(0, 6).map((product) => {
            const meta = getProductMeta(product)
            return (
              <Link key={product.id} href={`/product/${product.slug}`} className="group block h-full">
                <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-gray-100 mb-3 shadow-sm group-hover:shadow-md transition">
                  <img src={product.image_url || "/placeholder.svg"} alt={product.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  
                  {/* Stock Label Overlay */}
                  {meta.isOutOfStock && (
                    <div className="absolute inset-0 bg-white/40 flex items-center justify-center">
                        <span className="bg-black text-white text-[10px] font-bold px-3 py-1 uppercase tracking-widest rounded-full">Sold Out</span>
                    </div>
                  )}

                  {meta.discountPercent > 0 && (
                    <div className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-1 uppercase rounded-sm">
                      {meta.discountPercent}% OFF
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900 truncate group-hover:text-pink-600 transition">{product.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-base font-bold text-gray-900">{formatCurrency(product.price)}</span>
                    <span className="text-xs text-gray-500 line-through">{formatCurrency(meta.mrp)}</span>
                  </div>
                  
                  {!meta.isOutOfStock && (
                    <div className="w-full bg-gray-100 rounded-full h-1.5 mt-3 overflow-hidden">
                       <div className={`h-full rounded-full ${meta.isLowStock ? 'bg-red-500' : 'bg-orange-500'}`} style={{ width: `${meta.stockProgress}%` }}></div>
                    </div>
                  )}

                  <p className={`text-[10px] mt-1 font-medium ${meta.isOutOfStock ? 'text-gray-400' : meta.isLowStock ? 'text-red-600 animate-pulse' : 'text-gray-500'}`}>
                    {meta.isOutOfStock 
                        ? 'Back in stock soon' 
                        : meta.isLowStock 
                            ? `Hurry! Only ${meta.stock} left` 
                            : `Selling Fast! ${meta.stock} items left`}
                  </p>
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      {/* 6. Shop By Occasion */}
      <section className="bg-[#fff5f5] py-16 my-12">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl md:text-4xl font-serif text-gray-900 mb-4">Shop By Occasion</h2>
            <p className="text-gray-600">Find the perfect drape for every moment of your life.</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { name: "Wedding", img: "https://manyavar.scene7.com/is/image/manyavar/SB18145-407-MAROON2_22-07-2025-09-58:650x900?&dpr=on,2" },
              { name: "Party", img: "https://manyavar.scene7.com/is/image/manyavar/SB18223-426-T.BLUE-101_27-10-2025-11-01:650x900?&dpr=on,2" },
              { name: "Casual", img: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&q=80&w=300" },
              { name: "Office", img: "https://lazreesarees.com/cdn/shop/files/E7D6BFB2-319E-472A-B5E9-07A86BF6291F.jpg?v=1716906975&width=600" },
              { name: "Festival", img: "https://manyavar.scene7.com/is/image/manyavar/SB18689-404-FAWN1_22-07-2025-10-53:650x900?&dpr=on,2" },
              { name: "Haldi", img: "https://lazreesarees.com/cdn/shop/files/5DA5BAC1-A05C-4EFC-BB75-667DFF83B2B8.jpg?v=1702717852&width=600" },
            ].map((occasion) => (
              <Link key={occasion.name} href={`/search?occasion=${occasion.name.toLowerCase()}`} className="group relative rounded-xl overflow-hidden aspect-[3/4] shadow-md hover:shadow-xl transition-all duration-300">
                <img src={occasion.img} alt={occasion.name} className="absolute inset-0 w-full h-full object-cover transition duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80 group-hover:opacity-90 transition" />
                <div className="absolute inset-0 flex items-end justify-center pb-6">
                  <span className="text-white font-serif text-lg font-medium tracking-wide">{occasion.name}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

   

      {/* 7. Curated For You */}
      <section className="container mx-auto px-4 py-8 mb-16">
        <h2 className="text-3xl font-serif text-gray-900 mb-8">Curated For You</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-12">
          {products.slice(6, 14).map((product) => {
             const meta = getProductMeta(product)
             const prod = product as any
             
             return (
              <Link key={product.id} href={`/product/${product.slug}`} className="group block">
                <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-gray-100 mb-4 shadow-sm group-hover:shadow-md transition">
                  <img src={product.image_url || "/placeholder.svg"} alt={product.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  
                  {/* Action Button - Shows "Sold Out" if stock is 0 */}
                  <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition duration-300">
                      {meta.isOutOfStock ? (
                        <div className="w-full bg-gray-200 text-gray-400 py-3 text-xs font-bold shadow-lg rounded flex items-center justify-center gap-2 uppercase tracking-wide cursor-not-allowed">
                          Sold Out
                        </div>
                      ) : (
                        <button className="w-full bg-white text-gray-900 py-3 text-xs font-bold shadow-lg rounded hover:bg-gray-50 flex items-center justify-center gap-2 uppercase tracking-wide">
                          <ShoppingBag className="w-4 h-4" /> Add to Cart
                        </button>
                      )}
                  </div>
                </div>
                
                <div className="space-y-1 px-1">
                   <h3 className="text-base font-medium text-gray-900 line-clamp-1 group-hover:text-pink-600 transition">{product.title}</h3>
                   <p className="text-xs text-gray-500">{prod.attributes?.fabric || "Premium Fabric"} • {prod.attributes?.weave || "Handloom"}</p>
                   <div className="flex items-center gap-3 pt-1">
                      <span className="text-lg font-bold text-gray-900">{formatCurrency(product.price)}</span>
                      <span className="text-sm text-gray-400 line-through">{formatCurrency(meta.mrp)}</span>
                   </div>
                </div>
              </Link>
            )
          })}
        </div>
      </section>
   {/* --- NEW: THE SABHYATAM BENTO GRID --- */}
      <section className="container mx-auto px-4 py-12 mb-16">
        <div className="mb-10 text-center">
            <span className="text-pink-600 font-bold tracking-widest text-xs uppercase flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4" /> Experience Luxury
            </span>
            <h2 className="text-3xl md:text-4xl font-serif text-gray-900 mt-2">The World of Sabhyatam</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-4 h-auto md:h-[600px]">
            {/* 1. Large Feature - Banarasi Edit */}
            <Link href="/search?category=banarasi" className="md:col-span-2 md:row-span-2 relative group rounded-2xl overflow-hidden cursor-pointer shadow-sm">
                <img 
                    src="https://images.unsplash.com/photo-1545206085-d0e519bdcecd?q=80&w=1171&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" 
                    alt="Banarasi Weaves" 
                    className="object-cover w-full h-full transition duration-700 group-hover:scale-105" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80" />
                <div className="absolute bottom-0 left-0 p-8 text-white">
                    <span className="bg-white/20 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1 uppercase tracking-wider mb-3 inline-block rounded-full">
                        Signature Collection
                    </span>
                    <h3 className="text-3xl font-serif mb-2">The Banarasi Edit</h3>
                    <p className="text-gray-300 text-sm max-w-sm leading-relaxed">
                        Timeless weaves from the holy city of Varanasi. Pure silk meets intricate zari work in our most premium collection.
                    </p>
                    <div className="mt-4 flex items-center gap-2 text-sm font-bold uppercase tracking-widest group-hover:gap-4 transition-all">
                        Shop Now <ArrowRight className="w-4 h-4" />
                    </div>
                </div>
            </Link>

            {/* 2. Video Shopping Service */}
            <div className="md:col-span-1 md:row-span-1 bg-[#2a2a2a] relative group rounded-2xl overflow-hidden p-6 flex flex-col justify-between text-white hover:bg-pink-900 transition duration-500 shadow-sm cursor-pointer">
               <div className="flex justify-between items-start">
                   <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                       <Video className="w-5 h-5 text-pink-400" />
                   </div>
                   <span className="text-[10px] font-bold bg-green-500 text-white px-2 py-0.5 rounded-full animate-pulse">LIVE</span>
               </div>
               <div>
                   <h3 className="font-bold text-lg leading-tight mb-1">Video Shopping</h3>
                   <p className="text-xs text-gray-400 mb-4">Book a slot with our stylists to view sarees in real-time.</p>
                   <button className="text-xs font-bold uppercase border-b border-gray-600 pb-1 group-hover:border-white transition">Book Appointment</button>
               </div>
            </div>

            {/* 3. Pure Zari / Texture Highlight */}
             <div className="md:col-span-1 md:row-span-2 relative group rounded-2xl overflow-hidden shadow-sm cursor-default">
                <img 
                    src="https://images.unsplash.com/photo-1710440189404-e95fabead2a3?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" 
                    alt="Zari Texture"
                    className="object-cover w-full h-full transition duration-700 group-hover:scale-110" 
                />
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition" />
                 <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                    <div className="w-16 h-16 border border-white/50 rounded-full flex items-center justify-center mb-4 backdrop-blur-sm">
                        <PlayCircle className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-white font-serif text-xl">The Art of Zari</h3>
                    <p className="text-white/80 text-xs mt-2">Watch how we weave magic</p>
                 </div>
             </div>

            {/* 4. Trust/Certification */}
            <div className="md:col-span-1 md:row-span-1 bg-pink-50 rounded-2xl p-6 flex flex-col justify-center items-center text-center group hover:bg-pink-100 transition shadow-sm cursor-pointer">
                <Award className="w-12 h-12 text-pink-600 mb-3 group-hover:scale-110 transition" />
                <h3 className="font-bold text-gray-900 text-lg">Silk Mark Certified</h3>
                <p className="text-xs text-gray-600 mt-1 px-4">100% Authentic Handloom products sourced directly from weavers.</p>
            </div>
        </div>
      </section>
      <footer className="bg-[#1a1a1a] text-gray-400 pt-20 pb-10 text-center">
         <p className="text-white text-2xl font-serif mb-4">Sabhyatam</p>
         <p className="text-xs">&copy; 2025 Sabhyatam Retail Pvt Ltd. All rights reserved.</p>
      </footer>
    </div>
  )
}
