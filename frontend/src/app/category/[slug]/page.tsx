"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { fetchProducts } from "@/lib/api"
import type { ProductCard } from "@/lib/types"

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>()
  const [products, setProducts] = useState<ProductCard[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    load()
  }, [slug])

  async function load() {
    setLoading(true)
    try {
      // special case: under-999
      const res = await fetchProducts({
        page: 1,
        limit: 24,
        category: slug === "under-999" ? undefined : slug,
        max_price: slug === "under-999" ? 999 : undefined,
      })

      setProducts(res.items ?? [])
    } catch (e) {
      console.error(e)
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Loading…
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-6 capitalize">
          {slug.replace("-", " ")} Sarees
        </h1>

        {products.length === 0 ? (
          <div className="text-gray-600">No products found.</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {products.map((product) => (
              <Link
                key={product.id}
                href={`/product/${product.slug}`}
                className="group bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition"
              >
                <div className="aspect-[3/4] bg-gray-50 overflow-hidden">
                  <img
                    src={product.image_url || "/placeholder.svg"}
                    alt={product.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                  />
                </div>

                <div className="p-3">
                  <h3 className="text-sm font-medium line-clamp-2 mb-2">
                    {product.title}
                  </h3>

                  <div className="flex items-baseline gap-2">
                    <span className="font-bold text-gray-900">
                      ₹{product.price.toLocaleString("en-IN")}
                    </span>
                    {product.price > product.price && (
                      <span className="text-xs line-through text-gray-500">
                        ₹{product.price}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
