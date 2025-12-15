'use client'

import { useEffect, useState } from 'react'
import { getCart } from '@/lib/cart'
import CartItem from '@/components/CartItem'

export default function CartPage() {
  const [cart, setCart] = useState<any>(null)

  async function load() {
    const data = await getCart()
    setCart(data)
  }

  useEffect(() => {
    load()
  }, [])

  if (!cart) return <div>Loading…</div>

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-xl font-semibold mb-4">Your Cart</h1>

      {cart.items.length === 0 && <p>Your cart is empty</p>}

      {cart.items.map((item: any) => (
        <CartItem key={item.variant.id} item={item} onRefresh={load} />
      ))}

      <div className="flex justify-between mt-6 text-lg font-semibold">
        <span>Subtotal</span>
        <span>₹{cart.subtotal}</span>
      </div>

      <button
        disabled={cart.items.length === 0}
        className="mt-6 w-full bg-black text-white py-3 rounded disabled:opacity-50"
        onClick={() => location.href = '/checkout'}
      >
        Proceed to Checkout
      </button>
    </div>
  )
}
