"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { ChevronDown, X } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

type FilterGroupProps = {
  title: string
  paramKey: string
  options: Record<string, number> // { "Silk": 10, "Cotton": 5 }
  selected?: string
}

function FilterGroup({ title, paramKey, options, selected }: FilterGroupProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isOpen, setIsOpen] = useState(true)

  function toggleFilter(value: string) {
    const params = new URLSearchParams(searchParams.toString())
    
    // Toggle: if already selected, remove it. Otherwise, set it.
    if (selected === value) {
      params.delete(paramKey)
    } else {
      params.set(paramKey, value)
    }
    
    // Reset page on filter change
    params.set("page", "1")
    
    router.push(`/search?${params.toString()}`)
  }

  if (Object.keys(options).length === 0) return null

  return (
    <div className="border-b border-gray-100 py-4">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between text-sm font-bold text-gray-900 uppercase tracking-wide mb-2"
      >
        {title}
        <ChevronDown className={cn("h-4 w-4 transition", isOpen ? "rotate-180" : "")} />
      </button>
      
      {isOpen && (
        <div className="space-y-2 mt-2">
          {Object.entries(options).map(([label, count]) => (
            <label key={label} className="flex items-center gap-3 cursor-pointer group">
              <div className={cn(
                "w-4 h-4 border rounded flex items-center justify-center transition",
                selected === label ? "bg-black border-black" : "border-gray-300 group-hover:border-gray-400"
              )}>
                {selected === label && <div className="w-2 h-2 bg-white rounded-sm" />}
              </div>
              <input 
                type="checkbox" 
                className="hidden" 
                checked={selected === label}
                onChange={() => toggleFilter(label)}
              />
              <span className={cn("text-sm", selected === label ? "text-gray-900 font-medium" : "text-gray-600")}>
                {label} <span className="text-gray-400 text-xs">({count})</span>
              </span>
            </label>
          ))}
        </div>
      )}
    </div>
  )
}

export default function FilterSidebar({ facets }: { facets: any }) {
  const searchParams = useSearchParams()
  const router = useRouter()

  const hasFilters = ["category", "fabric", "occasion", "min_price"].some(k => searchParams.has(k))

  return (
    <div className="w-64 flex-shrink-0 hidden lg:block pr-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-serif text-lg font-bold">Filters</h3>
        {hasFilters && (
          <button 
            onClick={() => router.push("/search")}
            className="text-xs text-red-600 hover:underline flex items-center gap-1"
          >
            <X className="h-3 w-3" /> Clear All
          </button>
        )}
      </div>

      <FilterGroup 
        title="Fabric" 
        paramKey="fabric" 
        options={facets.fabric || {}} 
        selected={searchParams.get("fabric") || undefined} 
      />

      <FilterGroup 
        title="Weave" 
        paramKey="weave" 
        options={facets.weave || {}} 
        selected={searchParams.get("weave") || undefined} 
      />

      <FilterGroup 
        title="Occasion" 
        paramKey="occasion" 
        options={facets.occasion || {}} 
        selected={searchParams.get("occasion") || undefined} 
      />
    </div>
  )
}