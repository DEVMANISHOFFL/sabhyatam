import { getOrCreateSessionId } from './session'


const CART_BASE = 'http://localhost:8081/v1/cart'

export type CartItem = {
  product_id: string
  variant_id: string
  title: string
  price: number
  quantity: number
  image_url?: string
}

export type CartResponse = {
  items: CartItem[]
  total_items: number
  total_price: number
}

export async function getCart() {
  const res = await fetch(`${CART_BASE}/`, {
    headers: {
      'X-SESSION-ID': getOrCreateSessionId(),
    },
    credentials: 'include',
  })

  if (!res.ok) throw new Error('Failed to fetch cart')
  return res.json()
}

export async function addToCart(input: {
  product_id: string
  variant_id: string
  quantity: number
}) {
  const res = await fetch(`${CART_BASE}/add`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-SESSION-ID': getOrCreateSessionId(),
    },
    body: JSON.stringify(input),
    credentials: 'include',
  })

  if (!res.ok) throw new Error('Failed to add to cart')
  return res.json()
}
export async function updateCartItem(input: {
  variant_id: string
  quantity: number
}) {
  const res = await fetch(`${CART_BASE}/update`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error('Update failed')
}

export async function removeCartItem(variant_id: string) {
  const res = await fetch(`${CART_BASE}/remove`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ variant_id }),
  })
  if (!res.ok) throw new Error('Remove failed')
}
    