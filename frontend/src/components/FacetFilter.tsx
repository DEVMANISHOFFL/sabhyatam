'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Check } from 'lucide-react'

export default function FacetFilter({
  title,
  name,
  options,
}: {
  title: string
  name: string
  options: Record<string, number>
}) {
  const router = useRouter()
  const params = useSearchParams()
  const current = params.get(name)

  function toggle(value: string) {
    const next = new URLSearchParams(params.toString())
    
    // FIX 1: Reset to page 1 to prevent empty results on deep pages
    next.set("page", "1")

    if (current === value) {
      next.delete(name)
    } else {
      next.set(name, value)
    }
    
    // FIX 2: scroll: false prevents the page from jumping to top
    router.push(`/search?${next.toString()}`, { scroll: false })
  }

  // Don't show empty filters
  if (!options || Object.keys(options).length === 0) return null

  return (
    <div className="border-b border-gray-100 py-4 last:border-0">
      <h3 className="font-bold text-xs text-gray-900 mb-3 uppercase tracking-wider">
        {title}
      </h3>
      <div className="space-y-2 max-h-64 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200">
        {Object.entries(options).map(([value, count]) => {
          const isSelected = current === value
          return (
            <button
              key={value}
              onClick={() => toggle(value)}
              className="flex items-center justify-between w-full group text-left py-1"
            >
              <div className="flex items-center gap-2.5">
                {/* Checkbox UI */}
                <div 
                  className={`w-4 h-4 border rounded flex items-center justify-center transition-all ${
                    isSelected 
                      ? "bg-black border-black text-white" 
                      : "border-gray-300 bg-white group-hover:border-gray-400"
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
                
                <span className={`text-sm ${isSelected ? 'font-medium text-gray-900' : 'text-gray-600 group-hover:text-gray-900'}`}>
                  {value}
                </span>
              </div>
              
              <span className="text-xs text-gray-400">({count})</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}