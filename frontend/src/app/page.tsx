"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { fetchProducts } from "@/lib/api"
import { ProductCard, ProductMedia, type AdminProduct } from "@/lib/types"

import {
  Search,
  ShoppingCart,
  User,
  ChevronRight,
  Star,
  Heart,
  Menu,
  MapPin,
  Zap,
  TrendingUp,
  Percent,
  Tag,
  Package,
  Shield,
  Truck,
  Award,
  X,
} from "lucide-react"

import { CATEGORIES } from "@/lib/categories"

export default function HomePage() {
  const [showMobileMenu, setShowMobileMenu] = useState(false)
const [products, setProducts] = useState<ProductCard[]>([])

  const [pimage,setPimage] = useState<ProductMedia[]>([])
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
  

  // ✅ ALWAYS return JSX from component
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Loading products…
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* everything below is unchanged UI */}




      {/* Top Header Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-2 text-xs md:text-sm">
            <div className="flex items-center gap-4">
              <Link href="/download" className="text-gray-600 hover:text-[#2874f0]">
                Download App
              </Link>
              <div className="hidden md:flex items-center gap-1 text-gray-600">
                <MapPin className="w-4 h-4" />
                <span>Select Delivery Location</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
     

      {/* Category Navigation */}
      <nav className="bg-white border-b border-gray-200  top-[108px] md:top-[88px] z-40 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-6 overflow-x-auto py-3 text-sm scrollbar-hide">
          {CATEGORIES.map((cat) => (
  <Link
    key={cat.slug}
    href={`/search?category=${cat.slug}`}
    className="whitespace-nowrap text-gray-700 hover:text-[#2874f0] font-medium transition"
  >


    {cat.label}
  </Link>
))}
          </div>
        </div>
      </nav>

      {/* Hero Banners - Carousel Style */}
     <section className="bg-white">
  <div className="container mx-auto px-4 py-5">
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">

      {/* LEFT — BIG HERO BANNER */}
      <Link
        href="/deals"
        className="md:col-span-8 relative overflow-hidden rounded-xl shadow-md hover:shadow-xl transition group aspect-[16/7]"
      >
        <img
          src="https://ssptex.com/cdn/shop/files/Kanjivaram_e578e068-7e05-4183-930b-3ac7f885bcda.jpg?v=1758891090&width=5760"
          alt="Festive Sale"
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/30 to-transparent" />

        <div className="absolute inset-0 flex items-center">
          <div className="p-6 md:p-10 text-white max-w-lg">
            <span className="inline-block bg-red-600 px-3 py-1 rounded-full text-xs font-bold mb-4 animate-pulse">
              MEGA FESTIVE SALE
            </span>

            <h2 className="text-2xl md:text-4xl font-extrabold leading-tight mb-3">
              Festive Saree Collection
            </h2>

            <p className="text-sm md:text-base mb-5 text-white/90">
              Premium handloom & designer sarees
            </p>

            <span className="inline-block bg-white text-red-600 px-6 py-2 rounded font-bold text-sm">
              Shop Now →
            </span>
          </div>
        </div>
      </Link>

      {/* RIGHT — WEDDING + COTTON (SAME SIZE) */}
      <div className="md:col-span-4 grid grid-rows-2 gap-4">

        {/* Wedding Collection */}
        <Link
          href="/category/wedding"
          className="relative overflow-hidden rounded-xl group shadow-md hover:shadow-xl transition"
        >
          <img
            src="https://mavuris.com/cdn/shop/files/1000016648_2.jpg?v=1756219205"
            alt="Wedding Collection"
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/75 to-transparent" />

          <div className="absolute bottom-0 p-4 text-white">
            <span className="text-xs uppercase tracking-wide opacity-80">
              Trending
            </span>
            <h3 className="text-lg font-bold mt-1">
              Wedding Collection
            </h3>
            <p className="text-xs mt-1">Starting ₹2,999</p>
            <span className="inline-block mt-2 text-xs font-semibold underline">
              Explore →
            </span>
          </div>
        </Link>

        {/* Cotton Sarees */}
        <Link
          href="/category/cotton-sarees"
          className="relative overflow-hidden rounded-xl group shadow-md hover:shadow-xl transition"
        >
          <img
            src="https://www.taneira.com/on/demandware.static/-/Sites-Taneira-Library/default/dwf690c7fa/PLP/linen.jpg"
            alt="Cotton Sarees"
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/75 to-transparent" />

          <div className="absolute bottom-0 p-4 text-white">
            <span className="text-xs uppercase tracking-wide opacity-80">
              Daily Wear
            </span>
            <h3 className="text-lg font-bold mt-1">
              Cotton Sarees
            </h3>
            <p className="text-xs mt-1">Under ₹999</p>
            <span className="inline-block mt-2 text-xs font-semibold underline">
              Shop Now →
            </span>
          </div>
        </Link>

      </div>
    </div>
  </div>
</section>
 <section className="bg-gradient-to-r from-blue-50 to-purple-50 border-y border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-center">
            {[
              { icon: <Truck className="w-6 h-6" />, text: "Free Delivery", color: "text-green-600" },
              { icon: <Shield className="w-6 h-6" />, text: "Secure Payments", color: "text-blue-600" },
              { icon: <Package className="w-6 h-6" />, text: "Easy Returns", color: "text-orange-600" },
              { icon: <Award className="w-6 h-6" />, text: "Authentic Products", color: "text-purple-600" },
              { icon: <Star className="w-6 h-6" />, text: "4.5★ Rated", color: "text-yellow-600" },
              { icon: "🇮🇳", text: "Made in India", color: "text-red-600" },
            ].map((badge, idx) => (
              <div key={idx} className="flex flex-col items-center gap-2">
                <div className={`${badge.color} text-2xl`}>
                  {typeof badge.icon === "string" ? badge.icon : badge.icon}
                </div>
                <span className="text-xs md:text-sm font-semibold text-gray-700">{badge.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
{/* Shop by Occasion */}
<section className="py-6 bg-white">
  <div className="container mx-auto px-4">
    <h2 className="text-xl font-bold mb-4">Shop by Occasion</h2>
    <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
      {["Wedding","Office","Festival","Party","Daily Wear","Casual"].map(o => (
        <Link
          key={o}
          href={`/search?occasion=${o.toLowerCase()}`}
          className="border rounded-lg p-4 text-center hover:border-[#2874f0] hover:text-[#2874f0] transition"
        >
          {o}
        </Link>
      ))}
    </div>
  </div>
</section>




      {/* Deal of the Day */}
      <section className="py-6 bg-white border-t border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Zap className="w-6 h-6 text-yellow-500 fill-yellow-500" />
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">Deal of the Day</h2>
                <p className="text-xs text-gray-600">Ends in 12h 45m</p>
              </div>
            </div>
            <Link
              href="/deals"
              className="text-[#2874f0] font-semibold flex items-center gap-1 text-sm md:text-base hover:gap-2 transition-all"
            >
              View All <ChevronRight className="w-5 h-5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
        {products.slice(0, 6).map((product) => (
              <Link
                key={product.id}
                href={`/product/${product.slug}`}
                className="group bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all"
              >
                <div className="relative aspect-[3/4] overflow-hidden bg-gray-50">
                  <img
                    src={product.image_url || "/placeholder.svg"}
                    alt={product.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute top-2 left-2 bg-red-600 text-white px-2 py-1 rounded text-xs font-bold shadow">
                    {Math.round(((product.price + 100 - product.price) / product.price) * 500)}% OFF
                  </div>
                  <button className="absolute top-2 right-2 bg-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition shadow">
                    <Heart className="w-4 h-4 text-gray-600 hover:fill-red-500 hover:text-red-500" />
                  </button>
                </div>
                <div className="p-3">
                  <h3 className="text-xs md:text-sm font-medium line-clamp-2 mb-2 text-gray-800 min-h-[36px]">
                    {product.title}
                  </h3>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-base md:text-lg font-bold text-gray-900">
                      ₹{product.price.toLocaleString("en-IN")}
                    </span>
                    <span className="text-xs line-through text-gray-500">₹{product.price}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-green-600 font-semibold">
                    <Tag className="w-3 h-3" />
                    <span>Lowest Price</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
      

      {/* Top Picks */}
      <section className="py-6 md:py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-[#2874f0]" />
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">Top Picks For You</h2>
                <p className="text-xs text-gray-600">Based on your browsing</p>
              </div>
            </div>
            <Link
              href="/search"
              className="text-[#2874f0] font-semibold flex items-center gap-1 text-sm md:text-base hover:gap-2 transition-all"
            >
              See All <ChevronRight className="w-5 h-5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 md:gap-4">
{products.slice(6, 18).map((product) => (
              <Link
                key={product.id}
                href={`/product/${product.slug}`}
                className="group bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all"
              >
                <div className="relative aspect-[3/4] overflow-hidden bg-gray-50">
                  <img
                    src={product.image_url || "/placeholder.svg"}
                    alt={product.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  {product.price > product.price && (
                    <div className="absolute top-2 left-2 bg-green-600 text-white px-2 py-1 rounded text-xs font-bold shadow">
                      {Math.round(((product.price + 1000 - product.price) / product.price) * 500)}% OFF
                    </div>
                  )}
                  {/* {!product.in_stock && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <span className="bg-white text-red-600 px-3 py-1.5 rounded font-semibold text-xs shadow">
                        Out of Stock
                      </span>
                    </div>
                  )} */}
                  <button className="absolute top-2 right-2 bg-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition shadow">
                    <Heart className="w-4 h-4 text-gray-600 hover:fill-red-500 hover:text-red-500" />
                  </button>
                </div>
                <div className="p-3">
                  <h3 className="text-xs md:text-sm font-medium line-clamp-2 mb-2 text-gray-800 group-hover:text-[#2874f0] transition min-h-[36px]">
                    {product.title}
                  </h3>
                  <div className="flex items-center gap-1 mb-2">
                    <div className="flex items-center gap-0.5 bg-green-600 text-white px-1.5 py-0.5 rounded text-[10px] font-semibold">
                      <span>4.3</span>
                      <Star className="w-2.5 h-2.5 fill-white" />
                    </div>
                    <span className="text-[10px] text-gray-500">(2.8k)</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-base md:text-lg font-bold text-gray-900">
                      ₹{product.price.toLocaleString("en-IN")}
                    </span>
                    {product.price > product.price && (
                      <span className="text-xs line-through text-gray-500">₹{product.price.toLocaleString("en-IN")}</span>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-600 mt-1">Free Delivery</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Category Circles - Meesho Style */}
      <section className="py-6 bg-white border-t border-b border-gray-200">
        <div className="container mx-auto px-4">
          <h2 className="text-xl md:text-2xl font-bold mb-6 text-gray-900">Shop by Category</h2>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-4">
            {[
              { name: "Silk", img: "silk+saree+texture", color: "bg-red-100" },
              { name: "Cotton", img: "cotton+saree+fabric", color: "bg-green-100" },
              { name: "Banarasi", img: "banarasi+silk+saree", color: "bg-yellow-100" },
              { name: "Kanjivaram", img: "kanjivaram+silk+saree", color: "bg-purple-100" },
              { name: "Wedding", img: "wedding+bridal+saree", color: "bg-pink-100" },
              { name: "Party", img: "party+wear+designer+saree", color: "bg-blue-100" },
              { name: "Daily Wear", img: "daily+casual+simple+saree", color: "bg-teal-100" },
              { name: "Designer", img: "designer+premium+saree", color: "bg-orange-100" },
            ].map((cat) => (
              <Link
                key={cat.name}
                href={`/category/${cat.name.toLowerCase().replace(" ", "-")}`}
                className="flex flex-col items-center gap-2 group"
              >
                <div
                  className={`w-16 h-16 md:w-20 md:h-20 ${cat.color} rounded-full overflow-hidden shadow-md group-hover:shadow-xl transition-all group-hover:scale-110`}
                >
                  <img
                    src={"https://www.vhv.rs/dpng/d/548-5485432_cotton-saree-png-transparent-png.png"}
                    alt={cat.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-xs md:text-sm font-medium text-gray-700 text-center group-hover:text-[#2874f0] transition">
                  {cat.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>



      {/* Budget Store - Under ₹999 */}
      <section className="py-6 md:py-8 bg-gradient-to-br from-green-50 to-teal-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-green-600 text-white p-2 rounded-full">
                <Percent className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">Budget Store</h2>
                <p className="text-xs text-gray-600">Sarees Under ₹999</p>
              </div>
            </div>
            <Link
              href="/budget"
              className="text-[#2874f0] font-semibold flex items-center gap-1 text-sm md:text-base hover:gap-2 transition-all"
            >
              View All <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
          <section className="py-10 bg-gray-50">
  <div className="container mx-auto px-4 max-w-4xl text-center">
    <h2 className="text-2xl font-bold mb-4">
      Crafted by India’s Master Weavers
    </h2>
    <p className="text-gray-600 leading-relaxed">
      Sabhyatam brings you authentic sarees directly from weaving clusters
      like Kanchipuram, Banaras, Chanderi, and Odisha. No middlemen. 
      Just timeless craftsmanship.
    </p>
  </div>
</section>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 md:gap-4">
      {products
  .filter((p) => p.price < 1500)
  .slice(0, 6)
  .map((product) => (

                <Link
                  key={product.id}
                  href={`/product/${product.slug}`}
                  className="group bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all"
                >
                  <div className="relative aspect-[3/4] overflow-hidden bg-gray-50">
                    <img
                      src={product.image_url || "/placeholder.svg"}
                      alt={product.title} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute top-2 left-2 bg-green-600 text-white px-2 py-1 rounded text-xs font-bold shadow">
                      Under ₹999
                    </div>
                  </div>
                  <div className="p-3">
                    <h3 className="text-xs md:text-sm font-medium line-clamp-2 mb-2 text-gray-800 min-h-[36px]">
                      {product.title}
                    </h3>
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-bold text-green-600">₹{product.price.toLocaleString("en-IN")}</span>
                      <span className="text-xs line-through text-gray-500">₹{product.price.toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                </Link>
              ))}
          </div>
        </div>
      </section>





      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-8 md:py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-white font-bold text-lg mb-4">About Sabhyatam</h3>
              <p className="text-sm leading-relaxed mb-4">
                India's trusted saree destination. Authentic handloom and designer sarees from master weavers across
                India.
              </p>
              <div className="flex gap-3">
                {["facebook", "instagram", "twitter", "youtube"].map((social) => (
                  <Link
                    key={social}
                    href={`https://${social}.com`}
                    className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center hover:bg-[#2874f0] transition"
                  >
                    <span className="sr-only">{social}</span>
                    <div className="w-4 h-4 bg-gray-400 rounded-full" />
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-white font-bold mb-4">Customer Service</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/help" className="hover:text-white transition">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link href="/track-order" className="hover:text-white transition">
                    Track Order
                  </Link>
                </li>
                <li>
                  <Link href="/returns" className="hover:text-white transition">
                    Returns & Exchange
                  </Link>
                </li>
                <li>
                  <Link href="/shipping" className="hover:text-white transition">
                    Shipping Info
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-bold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/about" className="hover:text-white transition">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-white transition">
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link href="/blog" className="hover:text-white transition">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="/careers" className="hover:text-white transition">
                    Careers
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-bold mb-4">Policies</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/privacy" className="hover:text-white transition">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-white transition">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="/refund" className="hover:text-white transition">
                    Refund Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
            <p>© 2025 Sabhyatam. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <span className="text-xs">We Accept:</span>
              <div className="flex gap-2">
                {["Visa", "Mastercard", "UPI", "Paytm"].map((payment) => (
                  <div key={payment} className="bg-gray-800 px-3 py-1 rounded text-xs">
                    {payment}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
