'use client'

import { useEffect, useState } from 'react'
import { getCart } from '@/lib/cart'
import CartItem from '@/components/CartItem'
import { formatPrice } from '@/lib/utils'

export default function CartPage() {
  const [cart, setCart] = useState<any | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    try {
      const data = await getCart()
      setCart(data)
    } catch (err) {
      console.error(err)
      setError('Failed to load cart')
      setCart({ items: [], subtotal: 0 })
    }
  }

  useEffect(() => {
    load()
  }, [])

  if (error) {
    return <div className="p-4 text-red-600">{error}</div>
  }

  if (!cart) {
    return <div className="p-4">Loading…</div>
  }

  const items = cart.items ?? []

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-xl font-semibold mb-4">Your Cart</h1>

      {items.length === 0 && <p>Your cart is empty</p>}

      {items.map((item: any) => (
        <CartItem key={item.variant.id} item={item} onRefresh={load} />
      ))}

      <div className="flex justify-between mt-6 text-lg font-semibold">
        <span>Subtotal</span>
        <span>{formatPrice(cart.subtotal ?? 0)}</span>
      </div>

      <button
        disabled={items.length === 0}
        className="mt-6 w-full bg-black text-white py-3 rounded disabled:opacity-50"
        onClick={() => (location.href = '/checkout')}
      >
        Proceed to Checkout
      </button>
    </div>
  )
}
