'use client'

import { useRouter, useSearchParams } from 'next/navigation'

export default function SortSelect() {
  const router = useRouter()
  const params = useSearchParams()
  const current = params.get('sort') || 'newest'

  function onChange(value: string) {
    const next = new URLSearchParams(params.toString())
    next.set('sort', value)
    router.push(`/search?${next.toString()}`)
  }

  return (
    <select
      value={current}
      onChange={e => onChange(e.target.value)}
      className="border rounded px-2 py-1 text-sm"
    >
      <option value="newest">Newest</option>
      <option value="price_asc">Price: Low to High</option>
      <option value="price_desc">Price: High to Low</option>
    </select>
  )
}
