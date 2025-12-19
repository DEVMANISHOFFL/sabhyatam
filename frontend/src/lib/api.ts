import { ProductCard } from "./types"

const BASE = process.env.NEXT_PUBLIC_API_BASE!

/* ---------------------------------- */
/* Search Types (matches backend)     */
/* ---------------------------------- */

export type ProductSearchParams = {
  page: number
  limit: number
  sort?: "latest" | "price_asc" | "price_desc"

  category?: string
  min_price?: number
  max_price?: number
  fabric?: string
  occasion?: string
  color?: string
}

export type ProductSearchResponse = {
  items: ProductCard[]
  price: number
  facets: Record<string, any>
  page: number
  limit: number
  total: number
}

/* ---------------------------------- */
/* Generic API helper (keep as-is)     */
/* ---------------------------------- */

export async function api<T>(
  path: string,
  params?: Record<string, string | string[] | number | undefined>
): Promise<T> {
  const url = new URL(BASE + path)

  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v === undefined || v === "") return

      if (Array.isArray(v)) {
        v.forEach(val => url.searchParams.append(k, String(val)))
      } else {
        url.searchParams.set(k, String(v))
      }
    })
  }

  const res = await fetch(url.toString(), {
    cache: "no-store",
    credentials: "include",
  })

  if (!res.ok) {
    throw new Error(`API error ${res.status}`)
  }

  return res.json()
}

/* ---------------------------------- */
/* Products Search (FIXED)             */
/* ---------------------------------- */

export async function fetchProducts(
  params: ProductSearchParams
): Promise<ProductSearchResponse> {
  return api<ProductSearchResponse>(
    "/v1/products",
    {
      page: params.page,
      limit: params.limit,
      sort: params.sort,
      category: params.category,
      min_price: params.min_price,
      max_price: params.max_price,
      fabric: params.fabric,
      occasion: params.occasion,
      color: params.color,
    }
  )
}

export async function searchProducts(
  params: ProductSearchParams
): Promise<ProductSearchResponse> {
  return api<ProductSearchResponse>("/v1/products/search", {
    q: params.q,
    category: params.category,
    fabric: params.fabric,
    occasion: params.occasion,
    color: params.color,
    min_price: params.min_price,
    max_price: params.max_price,
    sort: params.sort,
    page: params.page,
    limit: params.limit,
  })
}