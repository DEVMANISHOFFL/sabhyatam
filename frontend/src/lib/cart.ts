import type { Cart, AddToCartInput } from "@/lib/types"
import { emitCartUpdated } from "@/lib/cart-events"

// DIRECT Backend URL (Bypassing Next.js Proxy for speed/debugging)
const CART_URL = "http://localhost:8081/v1/cart"

// --- SESSION MANAGEMENT ---
function getSessionId(): string {
  if (typeof window === 'undefined') return "" 
  
  let sid = localStorage.getItem("sabhyatam_session")
  if (!sid) {
    sid = crypto.randomUUID()
    localStorage.setItem("sabhyatam_session", sid)
  }
  return sid
}

// --- HEADERS HELPER (Fixed for Auth) ---
function getHeaders() {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  }

  // 1. Add Session ID (Always needed for Guest/Cart tracking)
  const sid = getSessionId()
  if (sid) {
    headers["X-SESSION-ID"] = sid
  }

  // 2. Add Auth Token & User ID (If logged in)
  // We grab this directly from localStorage to ensure sync with Auth Context
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem("sabhyatam_token")
    const userStr = localStorage.getItem("sabhyatam_user")

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr)
        headers["Authorization"] = `Bearer ${token}`
        headers["X-USER-ID"] = user.id
      } catch (e) {
        console.warn("Failed to parse user from local storage", e)
      }
    }
  }

  return headers
}

async function handleResponse(res: Response) {
  if (!res.ok) {
    const error = await res.json().catch(() => ({}))
    throw new Error(error.error || error.message || "Cart operation failed")
  }
  return res.json()
}

// --- API METHODS ---

export async function addToCart(item: AddToCartInput): Promise<Cart> {
  const res = await fetch(`${CART_URL}/add`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      product_id: item.product_id,
      quantity: item.quantity,
    }),
  })
  
  await handleResponse(res)
  
  emitCartUpdated()
  return getCart()
}

export async function getCart(): Promise<Cart> {
  const res = await fetch(`${CART_URL}/`, { 
    cache: "no-store",
    headers: getHeaders()
  })
  
  if (!res.ok) {
    // Return empty cart structure on error/404
    return { id: "", items: [], subtotal: 0, item_count: 0, currency: "INR" } as any
  }
  return res.json()
}

export async function removeFromCart(productId: string) {
  const res = await fetch(`${CART_URL}/remove`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ product_id: productId }),
  })
  
  const data = await handleResponse(res)
  
  emitCartUpdated()
  return data
}

export async function updateCartItem(productId: string, quantity: number) {
  const res = await fetch(`${CART_URL}/update`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ 
      product_id: productId, 
      quantity: quantity 
    }),
  })
  
  const data = await handleResponse(res)
  
  emitCartUpdated()
  return data
}

export async function clearCart() {
  const res = await fetch(`${CART_URL}/clear`, {
    method: "POST",
    headers: getHeaders(),
  })
  
  const data = await handleResponse(res)
  
  emitCartUpdated()
  return data
}