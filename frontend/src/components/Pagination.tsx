'use client'

import { useRouter, useSearchParams } from 'next/navigation'

export default function Pagination({
  page,
  totalPages,
}: {
  page: number
  totalPages: number
}) {
  const router = useRouter()
  const params = useSearchParams()

  function goTo(p: number) {
    const next = new URLSearchParams(params.toString())
    next.set('page', String(p))
    router.push(`/search?${next.toString()}`)
  }

  if (totalPages <= 1) return null

  return (
    <div className="flex gap-2 mt-6">
      {Array.from({ length: totalPages }).map((_, i) => {
        const p = i + 1
        return (
          <button
            key={p}
            onClick={() => goTo(p)}
            className={`px-3 py-1 border rounded text-sm ${
              p === page ? 'font-semibold' : 'text-muted-foreground'
            }`}
          >
            {p}
          </button>
        )
      })}
    </div>
  )
}
