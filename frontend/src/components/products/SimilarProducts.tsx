"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowRight, ShoppingBag } from "lucide-react"
import { fetchProducts } from "@/lib/api"
import type { ProductCard } from "@/lib/types"

// Helper for formatting
const formatINR = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount)

interface SimilarProductsProps {
  currentProductId: string
  currentCategory: string
  currentPrice: number
}

interface ReviewProductProp {
    productId: string
}

export default function SimilarProducts({ 
  currentProductId, 
  currentCategory,
  currentPrice 
}: SimilarProductsProps) {
  
  const [products, setProducts] = useState<ProductCard[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        
        // SMART LOGIC:
        // 1. Same Category
        // 2. Price range: +/- 50% (so recommendations are budget-relevant)
        const minPrice = Math.floor(currentPrice * 0.5)
        const maxPrice = Math.ceil(currentPrice * 1.5)

        const res = await fetchProducts({ 
          page: 1, 
          limit: 10, // Fetch extra in case we need to filter the current one out
          category: currentCategory,
          min_price: minPrice,
          max_price: maxPrice,
          sort: "latest" // or "price_asc"
        })

        // Remove the current product from the results
        const filtered = (res.items || [])
          .filter(p => String(p.id) !== String(currentProductId))
          .slice(0, 5) // Show top 5

        setProducts(filtered)
      } catch (err) {
        console.error("Failed to load similar products", err)
      } finally {
        setLoading(false)
      }
    }

    if (currentProductId) {
      loadData()
    }
  }, [currentProductId, currentCategory, currentPrice])

  if (!loading && products.length === 0) return null

  return (
    <div className="py-12 border-t border-gray-100 mt-10">
      <div className="flex items-center justify-between mb-8 px-4 lg:px-0">
        <h2 className="text-2xl font-serif font-medium text-gray-900">
          You May Also Like
        </h2>
        <Link 
          href={`/search?category=${currentCategory}`} 
          className="text-sm font-bold text-rose-600 flex items-center gap-1 hover:gap-2 transition-all"
        >
          View All <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {loading ? (
        // SKELETON LOADING STATE
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 px-4 lg:px-0">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="space-y-3">
              <div className="aspect-[3/4] bg-gray-100 rounded-lg animate-pulse" />
              <div className="h-4 bg-gray-100 rounded w-3/4 animate-pulse" />
              <div className="h-4 bg-gray-100 rounded w-1/4 animate-pulse" />
            </div>
          ))}
        </div>
      ) : (
        // PRODUCTS GRID
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 px-4 lg:px-0">
          {products.map((product) => (
            <Link 
              key={product.id} 
              href={`/product/${product.slug}`}
              className="group block"
            >
              <div className="relative aspect-[3/4] mb-3 overflow-hidden rounded-lg bg-gray-100">
                <img
                  src={product.image_url || "/placeholder.svg"}
                  alt={product.title}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  loading="lazy"
                />
                
                {/* Overlay Button */}
                <div className="absolute inset-x-0 bottom-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300 hidden lg:block">
                   <button className="w-full bg-white text-gray-900 text-[10px] font-bold uppercase py-3 rounded shadow-lg hover:bg-black hover:text-white transition flex items-center justify-center gap-2">
                      <ShoppingBag className="w-3 h-3" /> View
                   </button>
                </div>
              </div>

              <div className="space-y-1">
                <h3 className="text-sm font-medium text-gray-900 line-clamp-1 group-hover:text-rose-600 transition">
                  {product.title}
                </h3>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">
                  {product.attributes?.fabric || "Saree"}
                </p>
                <div className="font-bold text-gray-900 text-sm">
                  {formatINR(product.price)}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}