'use client'

import { useRouter, useSearchParams } from 'next/navigation'

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
    if (current === value) next.delete(name)
    else next.set(name, value)
    router.push(`/search?${next.toString()}`)
  }

  return (
    <div className="mb-4">
      <div className="font-medium mb-2">{title}</div>
      <div className="space-y-1">
        {Object.entries(options).map(([value, count]) => (
          <button
            key={value}
            onClick={() => toggle(value)}
            className={`block text-sm ${
              current === value ? 'font-semibold' : 'text-muted-foreground'
            }`}
          >
            {value} ({count})
          </button>
        ))}
      </div>
    </div>
  )
}
