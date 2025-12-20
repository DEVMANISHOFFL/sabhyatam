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


const ADMIN_ORDER_URL = "http://localhost:8082/v1/admin/orders"

export type OrderItem = {
  product_id: string
  product_title: string // Assuming backend hydrates this or we fetch it
  product_image?: string
  quantity: number
  price_cents: number
}

export type AdminOrder = {
  id: string
  user_id: string
  customer_name?: string
  customer_email?: string
  customer_phone?: string
  shipping_address?: any
  status: "pending" | "paid" | "processing" | "shipped" | "delivered" | "cancelled"
  total_amount_cents: number
  currency: string
  created_at: string
  items: OrderItem[]
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


export async function getAdminOrders(params: { page: number; limit: number; status?: string }) {
  const url = new URL(ADMIN_ORDER_URL)
  url.searchParams.set("page", params.page.toString())
  url.searchParams.set("limit", params.limit.toString())
  if (params.status && params.status !== "all") url.searchParams.set("status", params.status)

  const res = await fetch(url.toString(), { cache: "no-store" })
  if (!res.ok) throw new Error("Failed to load orders")
  return res.json() // Expects { items: [], total: 100, page: 1 }
}

export async function getAdminOrderDetail(id: string) {
  const res = await fetch(`${ADMIN_ORDER_URL}/${id}`, { cache: "no-store" })
  if (!res.ok) throw new Error("Order not found")
  return res.json() as Promise<AdminOrder>
}

export async function updateOrderStatus(id: string, status: string) {
  const res = await fetch(`${ADMIN_ORDER_URL}/${id}/status`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  })
  if (!res.ok) throw new Error("Failed to update status")
  return res.json()
}
