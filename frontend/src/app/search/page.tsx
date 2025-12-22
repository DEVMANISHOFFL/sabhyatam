import Link from "next/link";
import FilterSidebar from "@/components/search/FilterSidebar";
import RichProductCard from "@/components/Search/RickProductCard";
import { searchProducts } from "@/lib/api";
import { 
  X, 
  RefreshCcw, 
  ShoppingBag, 
  Filter, 
  ArrowRight, 
  ChevronDown
} from "lucide-react";

type SearchPageProps = {
  searchParams: Promise<{
    q?: string
    category?: string
    fabric?: string
    weave?: string
    occasion?: string
    color?: string
    sort?: "latest" | "price_asc" | "price_desc"
    page?: string
  }>
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const query = params.q || "";

  // 1. Fetch Products (Server Side)
  const data = await searchProducts({
    q: query,
    category: params.category,
    fabric: params.fabric,
    occasion: params.occasion,
    // @ts-ignore 
    weave: params.weave, 
    color: params.color, 
    sort: params.sort,
    page,
    limit: 12,
  });

  const { items, facets, total } = data;
  const hasFilters = query || params.category || params.fabric || params.weave || params.occasion || params.color;

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      
      {/* 1. HEADER */}
      <div className="bg-[#f8f5f2] border-b border-[#e5e0d8] pt-12 pb-8 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <nav className="text-xs text-gray-500 mb-2 uppercase tracking-widest font-medium">
                <Link href="/">Home</Link> / <span className="text-gray-900">Collection</span>
              </nav>
              <h1 className="text-3xl md:text-5xl font-serif font-medium text-gray-900 tracking-tight">
                {query ? `"${query}"` : params.category ? `${params.category.replace('-', ' ')}` : "All Collections"}
              </h1>
              <p className="text-gray-500 mt-2 text-sm">{total} exclusive pieces found</p>
            </div>
            
            {/* Visual Controls */}
            <div className="flex items-center gap-3">
              {hasFilters && (
                <Link 
                  href="/search"
                  className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 rounded-full text-xs font-bold uppercase tracking-wider text-rose-600 hover:bg-rose-50 transition shadow-sm"
                >
                  <X className="w-3 h-3" /> Clear
                </Link>
              )}
              
              <div className="relative group">
                <button className="flex items-center gap-2 px-5 py-2 bg-white border border-gray-200 rounded-full text-xs font-bold uppercase tracking-wider text-gray-900 hover:border-black transition shadow-sm">
                   Sort By <ChevronDown className="w-3 h-3" />
                </button>
                <div className="absolute right-0 top-full mt-2 w-40 bg-white border border-gray-100 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 overflow-hidden">
                   <Link href={{ query: { ...params, sort: 'latest' } }} className="block px-4 py-2.5 text-xs font-medium hover:bg-gray-50">Newest First</Link>
                   <Link href={{ query: { ...params, sort: 'price_asc' } }} className="block px-4 py-2.5 text-xs font-medium hover:bg-gray-50">Price: Low to High</Link>
                   <Link href={{ query: { ...params, sort: 'price_desc' } }} className="block px-4 py-2.5 text-xs font-medium hover:bg-gray-50">Price: High to Low</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-7xl py-10">
        <div className="flex flex-col lg:flex-row gap-10">
          
          {/* SIDEBAR */}
          <aside className="hidden lg:block w-64 shrink-0">
             <div className="sticky top-24 space-y-8">
                <div className="flex items-center gap-2 pb-4 border-b border-gray-100">
                  <Filter className="w-4 h-4" />
                  <span className="font-serif text-lg">Filters</span>
                </div>
                <FilterSidebar facets={facets} />
             </div>
          </aside>

          {/* MOBILE FILTER TRIGGER */}
          <div className="lg:hidden mb-6">
             <button className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 border border-gray-200 rounded text-sm font-medium">
                <span className="flex items-center gap-2"><Filter className="w-4 h-4"/> Filter & Sort</span>
                <ChevronDown className="w-4 h-4" />
             </button>
          </div>

          {/* RESULTS GRID */}
          <div className="flex-1">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                  <ShoppingBag className="w-8 h-8 text-gray-300" />
                </div>
                <h3 className="text-lg font-serif font-medium text-gray-900">No products found</h3>
                <p className="text-gray-500 mb-6 max-w-xs text-center text-sm">We couldn't find matches for your specific filters.</p>
                <Link href="/search" className="inline-flex items-center gap-2 bg-black text-white px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-gray-800 transition">
                   <RefreshCcw className="w-3 h-3" /> Clear All Filters
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-10 lg:gap-x-8">
                {items.map((item) => (
                  // ✅ Use the new client component with real ratings
                  <RichProductCard key={item.id} item={item} />
                ))}
              </div>
            )}

            {/* PAGINATION */}
            <div className="mt-20 border-t border-gray-100 pt-10 flex flex-col items-center">
              <span className="text-xs text-gray-400 mb-4 uppercase tracking-widest">Page {page}</span>
              <div className="flex gap-3">
                {page > 1 && (
                  <Link
                    href={{ query: { ...params, page: page - 1 } }}
                    className="flex items-center gap-2 px-6 py-3 border border-gray-200 rounded-full hover:border-black hover:bg-black hover:text-white transition-all text-xs font-bold uppercase tracking-widest"
                  >
                    Previous
                  </Link>
                )}
                {items.length === 12 && (
                  <Link
                    href={{ query: { ...params, page: page + 1 } }}
                    className="flex items-center gap-2 px-6 py-3 bg-black text-white border border-black rounded-full hover:bg-gray-800 transition-all text-xs font-bold uppercase tracking-widest shadow-lg hover:shadow-xl"
                  >
                    Next Page <ArrowRight className="w-3 h-3" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}