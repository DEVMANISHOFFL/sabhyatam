import type { Cart, AddToCartInput } from "@/lib/types"
import { emitCartUpdated } from "@/lib/cart-events" // 1. Import the event emitter

// FIX: Direct Backend URL to bypass Next.js Proxy (port 3000)
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

function getHeaders() {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  }
  const sid = getSessionId()
  if (sid) {
    headers["X-SESSION-ID"] = sid
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
  
  // 2. Emit event so Header updates immediately
  emitCartUpdated()
  
  return getCart()
}

export async function getCart(): Promise<Cart> {
  const res = await fetch(`${CART_URL}/`, { 
    cache: "no-store",
    headers: getHeaders()
  })
  
  if (!res.ok) {
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
  
  // 3. Emit event on remove
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
  
  // 4. Emit event on update
  emitCartUpdated()
  
  return data
}

export async function clearCart() {
  const res = await fetch(`${CART_URL}/clear`, {
    method: "POST",
    headers: getHeaders(),
  })
  
  const data = await handleResponse(res)
  
  // 5. Emit event on clear
  emitCartUpdated()
  
  return data
}