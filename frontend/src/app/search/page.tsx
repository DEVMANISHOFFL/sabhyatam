// import { ProductCard } from "@/components/ProductCard" // You likely have this, or use a generic card
import FilterSidebar from "@/components/search/FilterSidebar"
import Link from "next/link"
import { formatPrice } from "@/lib/utils"
import { searchProducts } from "@/lib/api"

// Helper component if you don't have ProductCard yet
function SimpleProductCard({ item }: { item: any }) {
  return (
    <Link href={`/product/${item.slug}`} className="group block">
      <div className="relative aspect-[3/4] overflow-hidden bg-gray-100 rounded-sm mb-3">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.title}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-gray-400 text-xs uppercase">
            No Image
          </div>
        )}
      </div>
      <div>
        <h3 className="text-sm font-medium text-gray-900 truncate group-hover:text-gray-600 transition">
          {item.title}
        </h3>
        <p className="text-xs text-gray-500 mb-1">{item.category}</p>
        <span className="text-sm font-bold text-gray-900">
          {formatPrice(item.price)}
        </span>
      </div>
    </Link>
  )
}

type SearchPageProps = {
  searchParams: Promise<{
    q?: string
    category?: string
    fabric?: string
    weave?: string
    occasion?: string
    sort?: "latest" | "price_asc" | "price_desc"
    page?: string
  }>
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams
  const page = Number(params.page) || 1
  const query = params.q || ""

  // 1. Fetch Data
  const data = await searchProducts({
    // q: query,
    category: params.category,
    fabric: params.fabric,
    occasion: params.occasion,
    // weave: params.weave, // Add weave to api.ts if backend supports it in `ProductSearchParams` type
    sort: params.sort,
    page,
    limit: 12,
  })

  const { items, facets, total } = data

  return (
    <div className="min-h-screen bg-white">
      {/* Header Banner */}
      <div className="bg-gray-50 py-12 mb-8 border-b border-gray-100">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl font-serif font-bold text-gray-900 mb-2">
            {query ? `Results for "${query}"` : "All Products"}
          </h1>
          <p className="text-sm text-gray-500">
            {total} items found
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-20">
        <div className="flex items-start">
          
          {/* Sidebar */}
          <FilterSidebar facets={facets} />

          {/* Results */}
          <div className="flex-1">
            {items.length === 0 ? (
              <div className="text-center py-20 bg-gray-50 rounded-lg">
                <p className="text-gray-500 mb-4">No products found matching your criteria.</p>
                <Link href="/" className="text-black underline font-medium hover:text-gray-600">
                  Clear filters & try again
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8 lg:gap-x-8">
                {items.map((item) => (
                  <SimpleProductCard key={item.id} item={item} />
                ))}
              </div>
            )}

            {/* Pagination (Simple Next/Prev) */}
            <div className="mt-12 flex justify-center gap-4">
              {page > 1 && (
                <Link
                  href={{ query: { ...params, page: page - 1 } }}
                  className="px-6 py-2 border border-gray-300 rounded hover:bg-gray-50 text-sm font-medium"
                >
                  Previous
                </Link>
              )}
              {items.length === 12 && (
                <Link
                  href={{ query: { ...params, page: page + 1 } }}
                  className="px-6 py-2 bg-black text-white rounded hover:bg-gray-900 text-sm font-medium"
                >
                  Next Page
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}