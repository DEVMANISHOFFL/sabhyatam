import type { AdminProduct, ProductMedia } from "./types"


const BASE = process.env.NEXT_PUBLIC_API_BASE!
const ADMIN_KEY = process.env.NEXT_PUBLIC_ADMIN_KEY!

interface ProductListParams {
  page?: number
  limit?: number
  q?: string
}

export type AdminVariant = {
  id: string
  price: number
  stock: number
  attributes?: Record<string, any>
}

interface ProductListResponse {
  items: AdminProduct[]
  total: number
  active_count?: number
  low_stock_count?: number
}



export async function adminFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(BASE + path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-ADMIN-KEY": ADMIN_KEY,
      ...(options.headers || {}),
    },
    cache: "no-store",
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `Admin API error ${res.status}`)
  }
  console.log("ADMIN_KEY =", ADMIN_KEY)


  return res.json()
}


export async function adminListProducts(params: ProductListParams = {}) {
  const query = new URLSearchParams()
  if (params.page) query.set("page", params.page.toString())
  if (params.limit) query.set("limit", params.limit.toString())
  if (params.q) query.set("q", params.q)

  return adminFetch<ProductListResponse>(`/v1/admin/products?${query.toString()}`, {
    method: "GET",
  })
}

/* PRODUCTS */
export async function adminGetProduct(id: string): Promise<{
  product: AdminProduct
  media: ProductMedia[]
  variants: AdminVariant[]

}> {
  return adminFetch(`/v1/products/${id}`)
}

export function adminCreateProduct(p: Partial<AdminProduct>) {
  return adminFetch<{ id: string }>("/v1/admin/products", {
    method: "POST",
    body: JSON.stringify(p),
  })
}

export function adminUpdateProduct(id: string, p: Partial<AdminProduct>) {
  return adminFetch(`/v1/admin/products/${id}`, {
    method: "PUT",
    body: JSON.stringify(p),
  })
}

export function adminDeleteProduct(id: string) {
  return adminFetch(`/v1/admin/products/${id}`, {
    method: "DELETE",
  })
}

/* MEDIA */


export function adminAddMedia(
  productId: string,
  media: {
    url: string
    media_type: "image"
    meta: {
      role: "hero" | "gallery"
      order: number
    }
  }
): Promise<ProductMedia> {
  return adminFetch(`/v1/admin/products/${productId}/media`, {
    method: "POST",
    body: JSON.stringify(media),
  })
}


export function adminDeleteMedia(mediaId: string) {
  return adminFetch(
    `/v1/admin/media/${mediaId}`,
    {
      method: "DELETE",
    }
  )
}

/* VARIANTS */


export function adminCreateVariant(
  productId: string,
  v: Partial<AdminVariant>
) {
  return adminFetch<{ id: string }>(
    `/v1/admin/products/${productId}/variants`,
    {
      method: "POST",
      body: JSON.stringify(v),
    }
  )
}

export function adminUpdateVariant(
  variantId: string,
  v: Partial<AdminVariant>
) {
  return adminFetch(
    `/v1/admin/variants/${variantId}`,
    {
      method: "PUT",
      body: JSON.stringify(v),
    }
  )
}

export function adminDeleteVariant(variantId: string) {
  return adminFetch(
    `/v1/admin/variants/${variantId}`,
    { method: "DELETE" }
  )
}

export async function adminGetUploadUrl(filename: string, contentType: string) {
  return adminFetch<{ upload_url: string; public_url: string }>(
    `/v1/admin/media/upload-url?filename=${encodeURIComponent(filename)}&content_type=${encodeURIComponent(contentType)}`,
    {
      method: "GET",
    }
  )
}


