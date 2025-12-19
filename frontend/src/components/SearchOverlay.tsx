"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { Search, X, ChevronRight, Clock } from "lucide-react"
import { api } from "@/lib/api"
import type { ProductCard } from "@/lib/types"

export default function SearchOverlay({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<ProductCard[]>([])
  const [loading, setLoading] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  // 1. Load Recent Searches & Focus Input
  useEffect(() => {
    const saved = localStorage.getItem("recent_searches")
    if (saved) setRecentSearches(JSON.parse(saved))
    inputRef.current?.focus()
    
    // Lock body scroll
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = 'unset' }
  }, [])

  // 2. Debounced Search API Call
  useEffect(() => {
    if (!query) {
      setResults([])
      return
    }

    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        // Fetch up to 5 results
        const data = await api<{ items: ProductCard[] }>(`/v1/products/search?q=${query}&limit=5`)
        setResults(data.items || [])
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }, 400)

    return () => clearTimeout(timer)
  }, [query])

  // 3. Save Search Term
  const handleSearch = (term: string) => {
    let updated = [term, ...recentSearches.filter(s => s !== term)].slice(0, 5)
    setRecentSearches(updated)
    localStorage.setItem("recent_searches", JSON.stringify(updated))
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-white/95 backdrop-blur-sm z-[100] animate-in fade-in duration-200">
      <div className="container mx-auto px-4 py-4">
        
        {/* Header / Input */}
        <div className="flex items-center gap-4 border-b border-gray-200 pb-4">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search for sarees, brands, or colors..."
            className="flex-1 text-lg bg-transparent outline-none placeholder:text-gray-400 font-medium"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearch(query)
                window.location.href = `/search?q=${query}`
              }
            }}
          />
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition">
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <div className="mt-8 grid md:grid-cols-12 gap-8 h-[80vh] overflow-y-auto pb-20">
          
          {/* LEFT: Suggestions / Recent */}
          <div className="md:col-span-4 space-y-8 border-r border-gray-100 pr-4">
            
            {/* Recent Searches */}
            {!query && recentSearches.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Recent</h3>
                <div className="space-y-1">
                  {recentSearches.map(term => (
                    <Link 
                      key={term} 
                      href={`/search?q=${term}`}
                      onClick={() => handleSearch(term)}
                      className="flex items-center gap-3 py-2 px-3 text-gray-600 hover:text-black hover:bg-gray-100 rounded-lg transition"
                    >
                      <Clock className="w-4 h-4 text-gray-400" />
                      {term}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Trending */}
            {!query && (
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Trending Now</h3>
                <div className="flex flex-wrap gap-2">
                  {["Kanjivaram Silk", "Banarasi", "Wedding Collection", "Red Saree", "Cotton"].map(tag => (
                     <Link 
                       key={tag}
                       href={`/search?q=${tag}`}
                       onClick={() => handleSearch(tag)}
                       className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-full text-sm font-medium hover:bg-black hover:text-white transition"
                     >
                       {tag}
                     </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: Live Results */}
          <div className="md:col-span-8">
             {loading ? (
               <div className="flex items-center justify-center py-12">
                 <div className="animate-spin h-6 w-6 border-2 border-gray-300 border-t-black rounded-full"></div>
               </div>
             ) : results.length > 0 ? (
               <div>
                 <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Products</h3>
                 <div className="grid grid-cols-1 gap-2">
                   {results.map(product => (
                     <Link 
                       key={product.id} 
                       href={`/product/${product.slug}`}
                       onClick={() => handleSearch(query)}
                       className="flex items-center gap-4 group p-2 rounded-lg hover:bg-gray-50 transition border border-transparent hover:border-gray-100"
                     >
                       <div className="h-16 w-12 bg-gray-100 rounded overflow-hidden shrink-0">
                         <img src={product.image_url || "/placeholder.svg"} className="w-full h-full object-cover" alt="" />
                       </div>
                       <div className="flex-1">
                         <h4 className="font-medium text-gray-900 group-hover:text-pink-600 transition">{product.title}</h4>
                         <p className="text-xs text-gray-500 capitalize">{product.category}</p>
                       </div>
                       <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-600" />
                     </Link>
                   ))}
                   <Link 
                     href={`/search?q=${query}`}
                     onClick={() => handleSearch(query)}
                     className="block text-center py-3 text-sm font-bold text-pink-600 hover:underline mt-4"
                   >
                     View all results for &quot;{query}&quot;
                   </Link>
                 </div>
               </div>
             ) : query && !loading ? (
                <div className="text-center py-12 text-gray-500">
                   No products found for &quot;{query}&quot;. Try checking for typos or using different keywords.
                </div>
             ) : (
                <div className="text-center py-12 text-gray-400 text-sm">
                   Start typing to search for products...
                </div>
             )}
          </div>

        </div>
      </div>
    </div>
  )
}