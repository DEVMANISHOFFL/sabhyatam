import { getOrCreateSessionId } from './session'
import { emitCartUpdated } from './cart-events' 

const CART_BASE = 'http://localhost:8081/v1/cart'


export type CartItem = {
  product: {
    id: string
    title: string
    slug: string
    image: string
  }
  variant: {
    id: string
    price: number
    mrp?: number
  }
  quantity: number
  line_total: number
}

export type CartResponse = {
  items: CartItem[]
  subtotal: number
}

export async function getCart(): Promise<CartResponse> {
  const res = await fetch(`${CART_BASE}/`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'X-SESSION-ID': getOrCreateSessionId(),
    },
  })

  if (!res.ok) {
    throw new Error('Failed to fetch cart')
  }

  return res.json()
}

export async function addToCart(input: {
  product_id: string
  variant_id: string
  quantity: number
}) {
  const res = await fetch(`${CART_BASE}/add`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'X-SESSION-ID': getOrCreateSessionId(),
    },
    body: JSON.stringify(input),
  })

  if (!res.ok) {
    throw new Error('Failed to add to cart')
  }

  const data = await res.json()
  
  emitCartUpdated() 
  
  return data
}

export async function updateCartItem(input: {
  variant_id: string
  quantity: number
}) {
  const res = await fetch(`${CART_BASE}/update`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'X-SESSION-ID': getOrCreateSessionId(),
    },
    body: JSON.stringify(input),
  })

  if (!res.ok) {
    throw new Error('Update failed')
  }

  emitCartUpdated()
}

export async function removeCartItem(variant_id: string) {
  const res = await fetch(`${CART_BASE}/remove`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'X-SESSION-ID': getOrCreateSessionId(),
    },
    body: JSON.stringify({ variant_id }),
  })

  if (!res.ok) {
    throw new Error('Remove failed')
  }

  emitCartUpdated()
}