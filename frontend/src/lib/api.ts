import { ProductCard, ProductSearchParams } from "./types"

const BASE = process.env.NEXT_PUBLIC_API_BASE || ""



export type ProductSearchResponse = {
  items: ProductCard[]
  facets: Record<string, any>
  page: number
  limit: number
  total: number
  min_price?: number
  max_price?: number
}


export async function api<T>(
  path: string,
  params?: Record<string, string | string[] | number | undefined>
): Promise<T> {
  const origin = typeof window !== "undefined" 
    ? window.location.origin 
    : "http://localhost:3000"
    
  const baseUrl = BASE || origin
  const url = new URL(path, baseUrl)

  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v === undefined || v === "" || v === null) return
      if (Array.isArray(v)) {
        v.forEach(val => url.searchParams.append(k, String(val)))
      } else {
        url.searchParams.set(k, String(v))
      }
    })
  }

  try {
    const res = await fetch(url.toString(), {
      cache: "no-store",
      credentials: "include",
      headers: {
        "Content-Type": "application/json"
      }
    })

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      throw new Error(errorData.error || `API error ${res.status}`)
    }

    return res.json()
  } catch (err) {
    console.error(`API Call Failed [${path}]:`, err)
    throw err
  }
}


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
      // @ts-ignore - Ignore if type not updated yet
      weave: params.weave, 
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
    // @ts-ignore 
    weave: params.weave,
    min_price: params.min_price,
    max_price: params.max_price,
    sort: params.sort,
    page: params.page,
    limit: params.limit,
  })
}