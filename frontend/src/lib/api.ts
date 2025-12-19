import { ProductCard, ProductSearchParams } from "./types"

// FIX: Handle missing env var gracefully. 
// If empty, we default to "" which implies relative path (proxy).
const BASE = process.env.NEXT_PUBLIC_API_BASE || ""

/* ---------------------------------- */
/* Search Types (matches backend)     */
/* ---------------------------------- */

export type ProductSearchResponse = {
  items: ProductCard[]
  facets: Record<string, any>
  page: number
  limit: number
  total: number
  // Optional: Add min/max price from backend stats if available
  min_price?: number
  max_price?: number
}

/* ---------------------------------- */
/* Generic API helper                 */
/* ---------------------------------- */

export async function api<T>(
  path: string,
  params?: Record<string, string | string[] | number | undefined>
): Promise<T> {
  // FIX: Robust URL construction
  // If BASE is empty, we use the current window origin (browser) or localhost (server)
  // as the base for the URL constructor.
  const origin = typeof window !== "undefined" 
    ? window.location.origin 
    : "http://localhost:3000"
    
  const baseUrl = BASE || origin
  const url = new URL(path, baseUrl) // <--- Fixes "Invalid URL" error

  // Append Query Params
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
      credentials: "include", // Important for Cookies/Sessions
      headers: {
        "Content-Type": "application/json"
      }
    })

    if (!res.ok) {
      // Try to parse error message
      const errorData = await res.json().catch(() => ({}))
      throw new Error(errorData.error || `API error ${res.status}`)
    }

    return res.json()
  } catch (err) {
    console.error(`API Call Failed [${path}]:`, err)
    // Return a safe fallback or rethrow depending on preference
    throw err
  }
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
    q: params.q, // 'q' is the search query
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