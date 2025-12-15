import { AdminProduct } from "./types"

const BASE = process.env.NEXT_PUBLIC_API_BASE!

export type ProductSearchResponse = {
  items: AdminProduct[]
  facets: Record<string, any>
  page: number
  limit: number
  total: number
}



export async function api<T>(
  path: string,
  params?: Record<string, string | string[]>
) {
  const url = new URL(BASE + path)

  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (Array.isArray(v)) {
        v.forEach(val => url.searchParams.append(k, val))
      } else if (v !== undefined && v !== '') {
        url.searchParams.set(k, v)
      }
    })
  }

  const res = await fetch(url.toString(), {
    cache: 'no-store',
  })

  if (!res.ok) {
    throw new Error(`API error ${res.status}`)
  }

  return res.json() as Promise<T>
}


export async function fetchProducts(
  params: { page: number; limit: number; sort?: string }
): Promise<ProductSearchResponse> {
  const q = new URLSearchParams()
  if (params.page) q.set('page', String(params.page))
  if (params.limit) q.set('limit', String(params.limit))
  if (params.sort) q.set('sort', params.sort)

  const res = await fetch(
    `http://localhost:8080/v1/products/search?${q.toString()}`,
    { credentials: 'include' }
  )

  if (!res.ok) throw new Error('products fetch failed')
  return res.json()
}
