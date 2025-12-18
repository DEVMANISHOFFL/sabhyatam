"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { fetchProducts } from "@/lib/api"
import { ProductCard, ProductMedia } from "@/lib/types"

import {
  ChevronRight,
  Star,
  Heart,
  MapPin,
  Zap,
  TrendingUp,
  Percent,
  Tag,
  Shield,
  Truck,
  Award,
  ArrowRight,
  ShoppingBag,
} from "lucide-react"

import { CATEGORIES } from "@/lib/categories"

export default function HomePage() {
  const [products, setProducts] = useState<ProductCard[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProducts()
  }, [])

  async function loadProducts() {
    try {
      const res = await fetchProducts({
        page: 1,
        limit: 24,
        sort: "latest",
      })
      setProducts(res.items ?? [])
    } catch (err) {
      console.error("failed to load products", err)
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  // Loading Skeleton
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
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
              <span>Deliver to: <span className="font-bold">492001</span></span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Sticky Category Nav */}
      <nav className="sticky top-[64px] z-30 bg-white border-b border-gray-100 shadow-sm overflow-x-auto no-scrollbar">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-8 py-4 min-w-max">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                href={`/search?category=${cat.slug}`}
                className="group flex flex-col items-center gap-2 cursor-pointer"
              >
                <div className="w-16 h-16 rounded-full p-[2px] border-2 border-transparent group-hover:border-pink-600 transition-all">
                  <div className="w-full h-full rounded-full overflow-hidden bg-gray-100 relative">
                     {/* Placeholder images for categories - replace with real ones if available in cat object */}
                    <img 
                      src={`https://source.unsplash.com/random/100x100/?saree,${cat.slug}`} 
                      // onError={(e) => (e.currentTarget.src = "/placeholder.svg")}
                      alt={cat.label} 
                      className="w-full h-full object-cover group-hover:scale-110 transition duration-500" 
                    />
                  </div>
                </div>
                <span className="text-sm font-medium text-gray-700 group-hover:text-pink-600 transition-colors">
                  {cat.label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* 3. Hero Section (Bento Grid) */}
      <section className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 h-auto md:h-[500px]">
          
          {/* Main Hero */}
          <Link href="/deals" className="md:col-span-2 md:row-span-2 relative group overflow-hidden rounded-2xl">
            <img
              src="https://ssptex.com/cdn/shop/files/Kanjivaram_e578e068-7e05-4183-930b-3ac7f885bcda.jpg?v=1758891090&width=5760"
              alt="Festive Collection"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 p-8 text-white">
              <span className="bg-white text-black text-xs font-bold px-3 py-1 uppercase tracking-wider mb-3 inline-block">
                New Arrival
              </span>
              <h2 className="text-3xl md:text-5xl font-serif mb-4">The Royal Kanjivaram</h2>
              <p className="mb-6 text-gray-200 max-w-sm">Handwoven masterpieces directly from the weavers of Tamil Nadu.</p>
              <button className="bg-pink-600 text-white px-8 py-3 rounded-sm font-medium hover:bg-pink-700 transition">
                Shop Collection
              </button>
            </div>
          </Link>

          {/* Secondary Hero 1 */}
          <Link href="/category/wedding" className="relative group overflow-hidden rounded-2xl md:col-span-1 md:row-span-2">
             <img
              src="https://mavuris.com/cdn/shop/files/1000016648_2.jpg?v=1756219205"
              alt="Wedding"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
             <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition" />
             <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center p-4">
                <h3 className="text-2xl font-serif mb-2">Bridal Trousseau</h3>
                <p className="text-sm opacity-90 mb-4">Starting @ ₹4,999</p>
                <span className="underline decoration-1 underline-offset-4 text-sm font-medium">Explore</span>
             </div>
          </Link>

          {/* Secondary Hero 2 (Split) */}
          <div className="md:col-span-1 md:row-span-2 flex flex-col gap-4">
             <Link href="/category/cotton" className="flex-1 relative group overflow-hidden rounded-2xl">
                <img
                  src="https://www.taneira.com/on/demandware.static/-/Sites-Taneira-Library/default/dwf690c7fa/PLP/linen.jpg"
                  alt="Cotton"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />
                <div className="absolute bottom-4 left-4 text-white">
                   <h4 className="font-bold text-lg">Summer Cottons</h4>
                   <span className="text-xs">Under ₹1,499</span>
                </div>
             </Link>
             <Link href="/deals" className="flex-1 relative group overflow-hidden rounded-2xl bg-indigo-900 flex items-center justify-center">
                <div className="text-center text-white p-4">
                   <p className="text-xs uppercase tracking-widest text-indigo-300 mb-2">Flash Sale</p>
                   <h3 className="text-3xl font-bold mb-1">FLAT 50% OFF</h3>
                   <p className="text-xs text-indigo-200">On Banarasi Silk</p>
                </div>
             </Link>
          </div>
        </div>
      </section>

      {/* 4. Trust Signals */}
      <section className="bg-white py-8 border-y border-gray-100">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { icon: Truck, title: "Free Shipping", desc: "On all orders > ₹1999" },
              { icon: Shield, title: "Secure Payment", desc: "100% secure transactions" },
              { icon: Award, title: "Authentic Products", desc: "Sourced directly from weavers" },
              { icon: Zap, title: "Fast Delivery", desc: "Dispatched within 24 hours" },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-gray-900">
                  <item.icon className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-gray-900">{item.title}</h4>
                  <p className="text-xs text-gray-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Trending / Deal of the Day */}
      <section className="container mx-auto px-4 py-12">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-1 h-6 bg-pink-600 rounded-sm"></span>
              <h3 className="text-pink-600 font-bold uppercase tracking-wider text-sm">Don't Miss Out</h3>
            </div>
            <h2 className="text-3xl font-serif text-gray-900">Deal of the Day</h2>
          </div>
          <Link href="/deals" className="group flex items-center gap-1 text-sm font-semibold text-gray-900 hover:text-pink-600 transition">
            View All <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {products.slice(0, 6).map((product) => (
            <Link key={product.id} href={`/product/${product.slug}`} className="group">
              <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-gray-100 mb-3">
                <img
                  src={product.image_url || "/placeholder.svg"}
                  alt={product.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-1 uppercase tracking-wide rounded-sm">
                   {Math.round(((product.price * 1.2 - product.price) / (product.price * 1.2)) * 100)}% OFF
                </div>
                <button className="absolute bottom-4 right-4 bg-white p-2 rounded-full shadow-lg translate-y-12 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition duration-300 hover:text-pink-600">
                  <Heart className="w-4 h-4" />
                </button>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900 truncate group-hover:text-pink-600 transition">{product.title}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-base font-bold text-gray-900">₹{product.price.toLocaleString("en-IN")}</span>
                  <span className="text-xs text-gray-500 line-through">₹{Math.round(product.price * 1.2).toLocaleString("en-IN")}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5 mt-3 overflow-hidden">
                   <div className="bg-orange-500 h-full w-[70%]"></div>
                </div>
                <p className="text-[10px] text-gray-500 mt-1">Selling Fast! 12 left</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 6. Shop By Occasion (Grid) */}
      <section className="bg-[#fff5f5] py-16">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl md:text-4xl font-serif text-gray-900 mb-4">Shop By Occasion</h2>
            <p className="text-gray-600">Find the perfect drape for every moment of your life.</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { name: "Wedding", img: "https://images.unsplash.com/photo-1610189012906-4783382c527d?auto=format&fit=crop&q=80&w=300" },
              { name: "Party", img: "https://images.unsplash.com/photo-1609357606619-a429a187a02d?auto=format&fit=crop&q=80&w=300" },
              { name: "Casual", img: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&q=80&w=300" },
              { name: "Office", img: "https://images.unsplash.com/photo-1583391733956-6c78276477e2?auto=format&fit=crop&q=80&w=300" },
              { name: "Festival", img: "https://images.unsplash.com/photo-1595981234058-206a9f52e1bd?auto=format&fit=crop&q=80&w=300" },
              { name: "Haldi", img: "https://images.unsplash.com/photo-1621570169561-0c2a2e193ee1?auto=format&fit=crop&q=80&w=300" },
            ].map((occasion) => (
              <Link key={occasion.name} href={`/search?occasion=${occasion.name.toLowerCase()}`} className="group relative rounded-xl overflow-hidden aspect-[3/4]">
                <img src={occasion.img} alt={occasion.name} className="absolute inset-0 w-full h-full object-cover transition duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-white font-serif text-xl font-medium tracking-wide border-b border-white pb-1">{occasion.name}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 7. New Arrivals / Top Picks */}
      <section className="container mx-auto px-4 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-3xl font-serif text-gray-900">Curated For You</h2>
            <p className="text-gray-500 mt-2">Handpicked selections based on latest trends.</p>
          </div>
          <Link href="/search" className="group flex items-center gap-1 text-sm font-semibold text-gray-900 hover:text-pink-600 transition">
            View All Products <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-10">
          {products.slice(6, 14).map((product) => (
            <Link key={product.id} href={`/product/${product.slug}`} className="group">
              <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-gray-100 mb-4">
                <img
                  src={product.image_url || "/placeholder.svg"}
                  alt={product.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                {/* Quick Action Overlay */}
                <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition duration-300">
                    <button className="w-full bg-white text-gray-900 py-3 text-sm font-bold shadow-lg rounded hover:bg-gray-50 flex items-center justify-center gap-2">
                      <ShoppingBag className="w-4 h-4" /> ADD TO CART
                    </button>
                </div>
                <button className="absolute top-3 right-3 bg-white/80 p-2 rounded-full hover:bg-white hover:text-pink-600 transition">
                   <Heart className="w-4 h-4" />
                </button>
              </div>
              
              <div className="space-y-1">
                 <h3 className="text-base font-medium text-gray-900 line-clamp-1 group-hover:text-pink-600 transition">{product.title}</h3>
                 <p className="text-sm text-gray-500">{product.attributes?.fabric || "Premium Fabric"} • {product.attributes?.weave || "Handloom"}</p>
                 <div className="flex items-center gap-3 pt-1">
                    <span className="text-lg font-bold text-gray-900">₹{product.price.toLocaleString("en-IN")}</span>
                    {product.price > 1000 && (
                      <span className="text-sm text-gray-400 line-through">₹{(product.price + 1500).toLocaleString("en-IN")}</span>
                    )}
                 </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 8. Budget Banner */}
      <section className="container mx-auto px-4 mb-16">
        <Link href="/budget" className="block relative rounded-2xl overflow-hidden shadow-2xl">
           <div className="absolute inset-0 bg-gradient-to-r from-teal-900 to-emerald-800" />
           <div className="relative grid md:grid-cols-2 items-center min-h-[300px]">
              <div className="p-8 md:p-12 text-center md:text-left">
                 <span className="text-teal-300 font-bold tracking-widest uppercase text-sm mb-2 block">Pocket Friendly</span>
                 <h2 className="text-4xl md:text-5xl font-serif text-white mb-6">Budget Buys <br/>Under ₹999</h2>
                 <p className="text-teal-100 mb-8 max-w-md">Experience the elegance without breaking the bank. Premium cottons and daily wear sarees at unbeatable prices.</p>
                 <button className="bg-white text-teal-900 px-8 py-3 rounded font-bold hover:bg-teal-50 transition">
                    Shop Budget Store
                 </button>
              </div>
              <div className="h-full min-h-[300px] relative hidden md:block">
                  <img 
                    src="https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&q=80&w=800"
                    alt="Budget Saree"
                    className="absolute inset-0 w-full h-full object-cover opacity-80 mix-blend-overlay"
                  />
              </div>
           </div>
        </Link>
      </section>

      {/* 9. Brand Story / Footer */}
      <footer className="bg-[#1a1a1a] text-gray-400 pt-16 pb-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            
            {/* About */}
            <div className="col-span-1 md:col-span-1">
               <h3 className="text-white text-2xl font-serif mb-6">Sabhyatam</h3>
               <p className="text-sm leading-relaxed mb-6">
                 We are on a mission to revive the golden era of Indian Handlooms. Every saree in our collection tells a story of heritage, craftsmanship, and timeless beauty.
               </p>
               <div className="flex gap-4">
                  {["facebook", "instagram", "twitter"].map(social => (
                     <div key={social} className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center hover:bg-pink-600 hover:text-white transition cursor-pointer">
                        <span className="sr-only">{social}</span>
                        <div className="w-4 h-4 bg-current rounded-full" />
                     </div>
                  ))}
               </div>
            </div>

            {/* Links */}
            <div>
               <h4 className="text-white font-bold uppercase tracking-wider text-sm mb-6">Shop</h4>
               <ul className="space-y-3 text-sm">
                  <li><Link href="/search?category=silk" className="hover:text-white transition">Silk Sarees</Link></li>
                  <li><Link href="/search?category=cotton" className="hover:text-white transition">Cotton Collection</Link></li>
                  <li><Link href="/search?category=wedding" className="hover:text-white transition">Wedding Special</Link></li>
                  <li><Link href="/deals" className="hover:text-white transition">New Arrivals</Link></li>
               </ul>
            </div>

            <div>
               <h4 className="text-white font-bold uppercase tracking-wider text-sm mb-6">Support</h4>
               <ul className="space-y-3 text-sm">
                  <li><Link href="/track" className="hover:text-white transition">Track Order</Link></li>
                  <li><Link href="/returns" className="hover:text-white transition">Returns & Exchange</Link></li>
                  <li><Link href="/shipping" className="hover:text-white transition">Shipping Policy</Link></li>
                  <li><Link href="/contact" className="hover:text-white transition">Contact Us</Link></li>
               </ul>
            </div>

            {/* Newsletter */}
            <div>
               <h4 className="text-white font-bold uppercase tracking-wider text-sm mb-6">Stay Updated</h4>
               <p className="text-sm mb-4">Subscribe to get special offers, free giveaways, and once-in-a-lifetime deals.</p>
               <div className="flex">
                  <input type="email" placeholder="Enter your email" className="bg-gray-800 border-none text-white px-4 py-3 w-full rounded-l focus:ring-1 focus:ring-pink-600" />
                  <button className="bg-pink-600 text-white px-4 rounded-r font-bold hover:bg-pink-700 transition">JOIN</button>
               </div>
            </div>

          </div>

          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
             <p>&copy; 2025 Sabhyatam Retail Pvt Ltd. All rights reserved.</p>
             <div className="flex gap-4">
                <span>Privacy Policy</span>
                <span>Terms of Service</span>
             </div>
          </div>
        </div>
      </footer>
    </div>
  )
}