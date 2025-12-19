"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { X } from "lucide-react"
import FacetFilter from "@/components/FacetFilter"

export default function FilterSidebar({ facets }: { facets: any }) {
  const searchParams = useSearchParams()
  const router = useRouter()

  // Check if any specific filter is active (excluding 'q' and 'sort')
  const filterKeys = ["category", "fabric", "weave", "occasion", "min_price", "max_price"]
  const hasFilters = filterKeys.some(k => searchParams.has(k))

  function clearAll() {
    const params = new URLSearchParams(searchParams.toString())
    
    // Remove all filter keys but keep 'q' (search query) and 'sort'
    filterKeys.forEach(key => params.delete(key))
    
    // Reset to page 1
    params.set("page", "1")
    
    router.push(`/search?${params.toString()}`, { scroll: false })
  }

  return (
    <div className="w-64 flex-shrink-0 hidden lg:block pr-8 sticky top-24 h-[calc(100vh-100px)] overflow-y-auto scrollbar-hide">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-2 border-b border-gray-100">
        <h3 className="font-serif text-lg font-bold text-gray-900">Filters</h3>
        {hasFilters && (
          <button 
            onClick={clearAll}
            className="text-xs text-red-600 hover:text-red-800 hover:underline flex items-center gap-1 font-medium transition"
          >
            <X className="h-3 w-3" /> Clear All
          </button>
        )}
      </div>

      {/* Filter Groups */}
      <div className="space-y-1">
        
        {/* Category Facet */}
        <FacetFilter 
          title="Category" 
          name="category" 
          options={facets.category || {}} 
        />

        {/* Fabric Facet */}
        <FacetFilter 
          title="Fabric" 
          name="fabric" 
          options={facets.fabric || {}} 
        />

        {/* Weave Facet */}
        <FacetFilter 
          title="Weave" 
          name="weave" 
          options={facets.weave || {}} 
        />

        {/* Occasion Facet */}
        <FacetFilter 
          title="Occasion" 
          name="occasion" 
          options={facets.occasion || {}} 
        />

        {/* Color Facet (if available in backend) */}
        {facets.color && (
          <FacetFilter 
            title="Color" 
            name="color" 
            options={facets.color} 
          />
        )}
      </div>
    </div>
  )
}