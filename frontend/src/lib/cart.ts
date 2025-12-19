import type { Cart, AddToCartInput } from "@/lib/types"

// FIX: Direct Backend URL to bypass Next.js Proxy (port 3000)
const CART_URL = "http://localhost:8081/v1/cart"

// --- SESSION MANAGEMENT ---
function getSessionId(): string {
  if (typeof window === 'undefined') return "" // Server-side fallback
  
  let sid = localStorage.getItem("sabhyatam_session")
  if (!sid) {
    // Generate a new UUID if one doesn't exist
    sid = crypto.randomUUID()
    localStorage.setItem("sabhyatam_session", sid)
  }
  return sid
}

function getHeaders() {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  }
  
  // Attach the Session ID to every request
  // This ensures the backend identifies the user correctly even without cookies
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
  // Fetch fresh cart to ensure UI sync
  return getCart()
}

export async function getCart(): Promise<Cart> {
  const res = await fetch(`${CART_URL}/`, { 
    cache: "no-store",
    headers: getHeaders()
  })
  
  if (!res.ok) {
    // Return empty cart structure on error/404
    return { id: "", items: [], subtotal: 0, tax: 0, total: 0 } as any
  }
  return res.json()
}

export async function removeFromCart(productId: string) {
  const res = await fetch(`${CART_URL}/remove`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ product_id: productId }),
  })
  return handleResponse(res)
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
  return handleResponse(res)
}

export async function clearCart() {
  const res = await fetch(`${CART_URL}/clear`, {
    method: "POST",
    headers: getHeaders(),
  })
  return handleResponse(res)
}